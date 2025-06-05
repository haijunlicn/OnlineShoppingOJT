export interface VariantOptionDTO {
  // type: string;
  // typeName: string;
  // value: string;

  optionId: number;
  optionValueId: number;
  optionName?: string;   // optional for display/debug
  valueName?: string;
}

export interface ProductVariantDTO {
  options: VariantOptionDTO[];
  price: number;
  stock: number;
  sku: string;
  priceHistory?: VariantPriceDTO[];
}

export interface VariantPriceDTO {
  id: number;
  price: number;
  startDate: string;
  endDate?: string | null;
}
