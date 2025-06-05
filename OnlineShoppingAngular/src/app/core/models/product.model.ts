import { OptionDTO, OptionTypeDTO, OptionValueDTO } from "./option.model";
import { VariantOptionDTO } from "./variant.model";


export interface ProductVariantDTO {
  options: VariantOptionDTO[];
  price: number;
  stock: number;
  sku: string;
}

export interface ProductOptionDTO {
  id: number;
  name: string;
  optionValues: OptionValueDTO[];
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
  options: OptionTypeDTO[];
  variants: ProductVariantDTO[];
}