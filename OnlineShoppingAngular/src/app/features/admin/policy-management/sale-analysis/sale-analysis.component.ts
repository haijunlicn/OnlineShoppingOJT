import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CacheStats, DataEntry, GroupOption, MetricOption, TimePeriod, SalesChartDetail } from '@app/core/models/sale.model';
import { SalesDataService } from '@app/core/services/sales-data.service';
import { Subject, takeUntil } from 'rxjs';
import { curveLinear } from 'd3-shape';

interface TableRow {
  category: string;
  product: string;
  variant: string;
  city: string;
  date: string;
  value: number;
  index: number;
}

interface StatCard {
  title: string
  value: string
  change: number
  isPositive: boolean
  period: string
}

@Component({
  selector: "app-sale-analysis",
  standalone:false,
  templateUrl: "./sale-analysis.component.html",
  styleUrls: ["./sale-analysis.component.css"],
})
export class SaleAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  // Filter options
  groupBy: GroupOption = "Category"
  metric: MetricOption = "Total Revenue"
  timePeriod: TimePeriod = "week"

  // Data
  chartData: DataEntry[] = []
  tableData: TableRow[] = []
  loading = false
  error: string | null = null
  totalCount = 0
  hasMore = false
  currentPage = 1

  // UI State
  showTable = false
  showPerformanceMonitor = false
  sortField = ""
  sortDirection: "asc" | "desc" = "desc"

  // Options
  groupOptions: GroupOption[] = ["Category", "Product", "ProductVariant", "City"]
  metricOptions: MetricOption[] = ["Total Revenue", "Total Orders"]
  timePeriodOptions = [
    { value: "week" as TimePeriod, label: "Last 7 Days" },
    { value: "month" as TimePeriod, label: "Last 12 Months" },
    { value: "year" as TimePeriod, label: "Last Year" },
  ]

  // Chart configuration
  view: [number, number] = [900, 400]
  colorScheme = {
    name: "custom",
    selectable: true,
    group: "Ordinal" as any,
    domain: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#d88488"],
  }

  // Statistics
  statsCards: StatCard[] = []
  cacheStats: CacheStats = { size: 0, keys: [] }
  renderTime = 0
  curve = curveLinear;

  constructor(
    private salesDataService: SalesDataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData()
    this.updateStats()

    // Monitor loading state
    this.salesDataService.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.loading = loading
      this.cdr.detectChanges()
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // Load data based on current filters
  loadData(): void {
    const startTime = performance.now();

    this.salesDataService
      .fetchSalesDetailDataWithGroupBy(this.timePeriod, this.groupBy, this.metric)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: SalesChartDetail[]) => {
          // For chart: group by composite name, fill missing dates
          this.chartData = this.transformToChartData(data, this.timePeriod);

          // For table: flat data
          this.tableData = data.map((row, idx) => ({
            category: row.category || "",
            product: row.product || "",
            variant: row.variant || "",
            city: row.city || "",
            date: row.timePoint,
            value: row.value,
            index: idx,
          }));

          this.totalCount = data.length;
          this.error = null;
          this.renderTime = performance.now() - startTime;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.message || "An error occurred while loading data";
          this.cdr.detectChanges();
        },
      });
  }

  // Filter change handlers
  onGroupChange(value: GroupOption): void {
    this.groupBy = value
    this.currentPage = 1
    this.loadData()
  }

  onMetricChange(value: MetricOption): void {
    this.metric = value
    this.currentPage = 1
    this.loadData()
  }

  onTimePeriodChange(value: TimePeriod): void {
    this.timePeriod = value
    this.currentPage = 1
    this.loadData()
  }

  // Load more data
  loadMore(): void {
    if (!this.loading && this.hasMore) {
      this.currentPage++
      this.loadData()
    }
  }

  // Refresh data
  refresh(): void {
    this.currentPage = 1;
    this.loadData();
  }

  // Export functionality
  exportData(): void {
    this.salesDataService.exportToCSV(this.chartData, this.metric, this.groupBy)
  }

  // Update table data
  private updateTableData(): void {
    const flattened: TableRow[] = []

    this.chartData.forEach((entry, entryIndex) => {
      entry.series.forEach((item, itemIndex) => {
        flattened.push({
          category: entry.name,
          product: '',   // or a real value if available
          variant: '',   // or a real value if available
          city: '',      // or a real value if available
          date: item.name,
          value: item.value,
          index: entryIndex * 1000 + itemIndex,
        })
      })
    })

    // Apply sorting
    if (this.sortField) {
      flattened.sort((a, b) => {
        let aVal: any = (a as any)[this.sortField]
        let bVal: any = (b as any)[this.sortField]

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (this.sortDirection === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }

    this.tableData = flattened
  }

  // Sort table
  sortTable(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "desc"
    }
    this.updateTableData()
  }

  // Update statistics
  private updateStats(): void {
    const stats = this.getStatsForPeriod(this.timePeriod)
    this.statsCards = [
      {
        title: "Total Revenue",
        value: this.formatCurrency(stats.totalRevenue.value),
        change: stats.totalRevenue.change,
        isPositive: stats.totalRevenue.isPositive,
        period: stats.period,
      },
      {
        title: "Total Orders",
        value: this.formatNumber(stats.totalOrders.value),
        change: stats.totalOrders.change,
        isPositive: stats.totalOrders.isPositive,
        period: stats.period,
      },
      {
        title: "Average Order Value",
        value: `$${stats.avgOrderValue.value}`,
        change: stats.avgOrderValue.change,
        isPositive: stats.avgOrderValue.isPositive,
        period: stats.period,
      },
    ]

  }

  private getStatsForPeriod(period: TimePeriod) {
    switch (period) {
      case "week":
        return {
          totalRevenue: { value: 156420, change: 12.5, isPositive: true },
          totalOrders: { value: 1247, change: 8.2, isPositive: true },
          avgOrderValue: { value: 125.45, change: 3.8, isPositive: true },
          period: "last 7 days",
        }
      case "month":
        return {
          totalRevenue: { value: 2450000, change: 15.3, isPositive: true },
          totalOrders: { value: 18500, change: 11.7, isPositive: true },
          avgOrderValue: { value: 132.43, change: 5.2, isPositive: true },
          period: "last 12 months",
        }
      case "year":
        return {
          totalRevenue: { value: 28500000, change: 22.8, isPositive: true },
          totalOrders: { value: 215000, change: 18.5, isPositive: true },
          avgOrderValue: { value: 132.56, change: 3.7, isPositive: true },
          period: "last year",
        }
    }
  }

  // Utility methods
  formatValue(value: number): string {
    if (this.metric === "Total Revenue") {
      return `$${value.toLocaleString()}`
    }
    return value.toString()
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }

  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toLocaleString()
  }

  // Toggle functions
  toggleTable(): void {
    this.showTable = !this.showTable
  }

  togglePerformanceMonitor(): void {
    this.showPerformanceMonitor = !this.showPerformanceMonitor
  }

  // Get chart data for ngx-charts
  get chartDataFormatted() {
    return this.chartData
  }

  // Get sort icon
  getSortIcon(field: string): string {
    if (this.sortField !== field) return ""
    return this.sortDirection === "asc" ? "↑" : "↓"
  }

  // Get time period label
  getTimePeriodLabel(): string {
    switch (this.timePeriod) {
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 12 Months";
      case "year":
        return "Last Year";
      default:
        return "Last 7 Days";
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Get table columns based on grouping
  getTableColumns(): string[] {
    switch (this.groupBy) {
      case "Category":
        return ["category", "date", "value"];
      case "Product":
        return ["category", "product", "date", "value"];
      case "ProductVariant":
        return ["category", "product", "variant", "date", "value"];
      case "City":
        return ["city", "date", "value"];
      default:
        return ["category", "product", "variant", "date", "value"];
    }
  }

  // Get column display name
  getColumnDisplayName(column: string): string {
    switch (column) {
      case "category": return "Category";
      case "product": return "Product";
      case "variant": return "Variant";
      case "city": return "City";
      case "date": return "Date";
      case "value": return this.metric;
      default: return column;
    }
  }

  // Check if column should be shown
  shouldShowColumn(column: string): boolean {
    const columns = this.getTableColumns();
    return columns.includes(column);
  }

  // Generate continuous date range for the selected period
  private generateDateRange(period: TimePeriod): string[] {
    const result: string[] = [];
    const today = new Date();
    let start: Date;
    let format: (d: Date) => string;
    
    if (period === "week") {
      // Last 7 days
      start = new Date(today);
      start.setDate(today.getDate() - 6); // 7 days including today
      format = (d) => d.toISOString().slice(0, 10);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        result.push(format(d));
      }
    } else if (period === "month") {
      // Last 12 months
      start = new Date(today.getFullYear(), today.getMonth() - 11, 1); // 12 months ago
      format = (d) => d.toISOString().slice(0, 7); // YYYY-MM format
      for (let m = 0; m < 12; m++) {
        const d = new Date(today.getFullYear(), today.getMonth() - 11 + m, 1);
        result.push(format(d));
      }
    } else if (period === "year") {
      // Last 1 year (12 months)
      start = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      format = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      for (let m = 0; m < 12; m++) {
        const d = new Date(today.getFullYear() - 1, today.getMonth() + m, 1);
        result.push(format(d));
      }
    }
    return result;
  }

  // Update transformToChartData to fill missing dates
  private transformToChartData(data: SalesChartDetail[], period: TimePeriod): any[] {
    // Group by composite name based on grouping option
    const groupMap: { [key: string]: { name: string, series: { name: string, value: number }[] } } = {};
    const dateRange = this.generateDateRange(period);

    // Group data by composite key based on grouping option
    data.forEach(item => {
      let groupName: string;
      switch (this.groupBy) {
        case "Category":
          groupName = item.category;
          break;
        case "Product":
          groupName = `${item.category} - ${item.product}`;
          break;
        case "ProductVariant":
          groupName = `${item.category} - ${item.product} - ${item.variant}`;
          break;
        case "City":
          groupName = item.city;
          break;
        default:
          groupName = `${item.category} - ${item.product} - ${item.variant}`;
      }
      
      if (!groupMap[groupName]) {
        groupMap[groupName] = { name: groupName, series: [] };
      }
      groupMap[groupName].series.push({ name: item.timePoint, value: item.value });
    });

    // Fill missing dates with 0
    Object.values(groupMap).forEach(group => {
      const dateMap = new Map(group.series.map(s => [s.name, s.value]));
      group.series = dateRange.map(date => ({ name: date, value: dateMap.get(date) ?? 0 }));
    });

    return Object.values(groupMap);
  }
}