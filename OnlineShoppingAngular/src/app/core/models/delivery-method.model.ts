export interface DeliveryMethod {
  id: number;
  name: string;
  minDistance: number;
  maxDistance: number;
  baseFee: number;
  feePerKm: number;
} 