export interface VariantOptionDTO {
  type: string;
  typeName: string;
  value: string;
}

export interface ProductVariantDTO {
  options: VariantOptionDTO[];
  price: number;
  stock: number;
  sku: string;
}