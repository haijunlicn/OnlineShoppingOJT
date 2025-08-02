export interface DiscountDisplayDTO {
  id: number;
  name: string;
  title: string;
  type: 'AUTO' | 'COUPON';
  couponcode: string | null;
  value: number | null;
  discountType?: 'PERCENTAGE' | 'FIXED';
  mechanismType?: string;
  maxDiscountAmount?: number | null;
  shortLabel?: string;
  conditionSummary?: string;
  conditionGroups?: any[];
  requireFrontendChecking?: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  offeredProductIds?: number[];
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  mechanismId?: number;
} 