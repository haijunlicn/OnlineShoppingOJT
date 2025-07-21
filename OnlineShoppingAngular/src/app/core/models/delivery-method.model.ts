export interface DeliveryMethod {
  id: number;
  name: string;
  minDistance: number;
  maxDistance: number;
  baseFee: number;
  feePerKm: number;
  icon?: string;
  type?: number; // 1 = default, 0 or undefined = normal
} 