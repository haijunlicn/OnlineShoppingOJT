import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { DataEntry, SalesDataResponse, GroupOption, MetricOption, TimePeriod, SalesChartDetail } from '../models/sale.model';

@Injectable({
  providedIn: "root",
})
export class SalesDataService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private apiUrl = 'http://localhost:8080/api/analytics/sales-by-category';
  private detailApiUrl = 'http://localhost:8080/api/analytics/sales-by-category-product-variant';

  constructor(private http: HttpClient) {}

  fetchSalesData(
    timePeriod: TimePeriod,
    groupBy: GroupOption,
    metric: MetricOption,
    page = 1,
    limit = 100,
  ): Observable<SalesDataResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('timePeriod', timePeriod)
      .set('groupBy', groupBy);

    return this.http.get<DataEntry[]>(this.apiUrl, { params }).pipe(
      map((data: DataEntry[]) => ({
        data,
        totalCount: data.length,
        hasMore: false
      })),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  fetchSalesDetailData(
    timePeriod: string
  ): Observable<SalesChartDetail[]> {
    this.loadingSubject.next(true);

    let params = new HttpParams().set('timePeriod', timePeriod);

    return this.http.get<SalesChartDetail[]>(this.detailApiUrl, { params }).pipe(
      finalize(() => this.loadingSubject.next(false))
    );
  }

  fetchSalesDetailDataWithGroupBy(
    timePeriod: string,
    groupBy: string,
    metric: string
  ): Observable<SalesChartDetail[]> {
    this.loadingSubject.next(true);
    let params = new HttpParams()
      .set('timePeriod', timePeriod)
      .set('groupBy', groupBy)
      .set('metric', metric);
    return this.http.get<SalesChartDetail[]>(this.detailApiUrl, { params }).pipe(
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Export data to CSV
  exportToCSV(data: DataEntry[], metric: MetricOption, groupBy?: string): void {
    let headers: string[];
    
    // Determine headers based on grouping
    switch (groupBy) {
      case "Category":
        headers = ["Category", "Date", metric];
        break;
      case "Product":
        headers = ["Category", "Product", "Date", metric];
        break;
      case "ProductVariant":
        headers = ["Category", "Product", "Variant", "Date", metric];
        break;
      case "City":
        headers = ["City", "Date", metric];
        break;
      default:
        headers = ["Category", "Product", "Variant", "Date", metric];
    }
    
    const rows: string[] = [];

    data.forEach((entry) => {
      entry.series.forEach((item) => {
        const rowData: string[] = [];
        
        // Add data based on grouping
        switch (groupBy) {
          case "Category":
            rowData.push(entry.name, item.name, item.value.toString());
            break;
          case "Product":
            const parts = entry.name.split(" - ");
            rowData.push(parts[0] || "", parts[1] || "", item.name, item.value.toString());
            break;
          case "ProductVariant":
            const variantParts = entry.name.split(" - ");
            rowData.push(variantParts[0] || "", variantParts[1] || "", variantParts[2] || "", item.name, item.value.toString());
            break;
          case "City":
            rowData.push(entry.name, item.name, item.value.toString());
            break;
          default:
            const allParts = entry.name.split(" - ");
            rowData.push(allParts[0] || "", allParts[1] || "", allParts[2] || "", item.name, item.value.toString());
        }
        
        rows.push(rowData.join(","));
      });
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-data-${groupBy}-${metric}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private transformToChartData(data: SalesChartDetail[]): any[] {
    // Group by composite name: Category - Product - Variant
    const groupMap: { [key: string]: { name: string, series: { name: string, value: number }[] } } = {};

    data.forEach(item => {
      const groupName = `${item.category} - ${item.product} - ${item.variant}`;
      if (!groupMap[groupName]) {
        groupMap[groupName] = { name: groupName, series: [] };
      }
      groupMap[groupName].series.push({ name: item.timePoint, value: item.value });
    });

    return Object.values(groupMap);
  }
}
