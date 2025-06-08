import { CategoryDTO } from "./category-dto";
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
  createdDate?: string;
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

export interface ProductListItemDTO {
  product: ProductDTO;
  brand: BrandDTO; // i think i should remove this line and category since they're already in productdto?
  category: CategoryDTO;
  variants: ProductVariantDTO[];
  options: ProductOptionDTO[];
}
