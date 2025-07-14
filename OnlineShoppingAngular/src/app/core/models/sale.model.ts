export interface SeriesItem {
  name: string
  value: number
}

export interface DataEntry {
  name: string
  series: SeriesItem[]
}

export interface MetricData {
  [metricName: string]: DataEntry[]
}

export interface GroupData {
  [groupName: string]: MetricData
}

export type GroupOption = "Category" | "Product" | "ProductVariant" | "City"
export type MetricOption = "Total Revenue" | "Total Orders"
export type TimePeriod = "week" | "month" | "year"

export interface TimeFilteredData {
  week: GroupData
  month: GroupData
  year: GroupData
}

export interface SalesDataResponse {
  data: DataEntry[]
  totalCount: number
  hasMore: boolean
}

export interface CacheStats {
  size: number
  keys: string[]
}

export interface SalesChartDetail {
  category: string;
  product: string;
  variant: string;
  city: string;
  timePoint: string;
  value: number;
  metric: string;
}
