
export interface OptionDTO {
  type: string;
  values: string[];
}

export interface OptionTypeDTO {
  id: string;
  name: string;
  values: string[];
}

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

export interface ProductDTO {
  name: string;
  description: string;
  brandId: string;
  categoryId: string;
  basePrice: number;
}

export interface BrandDTO {
  id: string;
  name: string;
}

export interface CreateProductRequestDTO {
  product: ProductDTO;
  options: OptionDTO[];
  variants: ProductVariantDTO[];
}