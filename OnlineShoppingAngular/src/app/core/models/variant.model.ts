export interface VariantOptionDTO {
<<<<<<< Updated upstream
  // type: string;
  // typeName: string;
  // value: string;

  optionId: number;
  optionValueId: number;
  optionName?: string;   // optional for display/debug
  valueName?: string;
=======
  type: string;
  typeName: string;
  value: string;
>>>>>>> Stashed changes
}

export interface ProductVariantDTO {
  options: VariantOptionDTO[];
  price: number;
  stock: number;
  sku: string;
<<<<<<< Updated upstream
  priceHistory?: VariantPriceDTO[];
}

export interface VariantPriceDTO {
  id: number;
  price: number;
  startDate: string;
  endDate?: string | null;
}
=======
}
>>>>>>> Stashed changes
