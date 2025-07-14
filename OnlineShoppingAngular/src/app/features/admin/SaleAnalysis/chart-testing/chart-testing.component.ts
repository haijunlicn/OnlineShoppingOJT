import { Component, OnInit } from '@angular/core';
import { colorSets } from '@swimlane/ngx-charts';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

@Component({
  selector: 'app-chart-testing',
  standalone: false,
  templateUrl: './chart-testing.component.html',
  styleUrls: ['./chart-testing.component.css'],
})

export class ChartTestingComponent implements OnInit {
  dateRange = {
    start: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  };

  groupBy: 'category' | 'discount' | 'city' | 'product' = 'category';
  metric: 'revenue' | 'orders' = 'revenue';

  multi: any[] = []; // ngx-charts data format

  view: [number, number] = [900, 500]; // width, height

  // options
  showLegend: boolean = true;
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  showYAxisLabel: boolean = true;
  yAxisLabel: string = 'Value';

  colorScheme = colorSets.find(s => s.name === 'cool') || colorSets[0];

  // colorScheme = {
  //   name: 'cool',
  //   selectable: true,
  //   group: 'Ordinal',
  //   domain: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
  // };


  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    const labels = this.generateDateLabels(this.dateRange.start, this.dateRange.end);

    const groupedData = this.getMockDatasets(this.groupBy, this.metric, labels.length);

    // ngx-charts expects: { name: string, series: { name: string, value: number }[] }
    this.multi = groupedData.map(group => ({
      name: group.label,
      series: labels.map((label, i) => ({
        name: label,
        value: group.data[i]
      }))
    }));
  }

  generateDateLabels(start: string, end: string): string[] {
    const labels: string[] = [];
    let current = dayjs(start);
    const last = dayjs(end);

    while (current.isSameOrBefore(last)) {
      labels.push(current.format('MMM D'));
      current = current.add(1, 'day');
    }

    return labels;
  }

  getMockDatasets(groupBy: string, metric: string, length: number) {
    const dataMap: Record<string, string[]> = {
      category: ['Electronics', 'Fashion', 'Home'],
      discount: ['Summer Sale', 'Flash Deals', 'None'],
      city: ['Yangon', 'Mandalay', 'Naypyidaw'],
      product: ['iPhone 15', 'T-shirt Blue L', 'Rice Cooker Pro'],
    };

    const valueRange = metric === 'revenue' ? [1000, 8000] : [5, 200];

    return dataMap[groupBy].map((label) => ({
      label,
      data: this.generateRandomData(length, valueRange[0], valueRange[1])
    }));
  }

  generateRandomData(length: number, min: number, max: number): number[] {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  }
}