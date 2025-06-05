<<<<<<< Updated upstream
import { OptionDTO, OptionTypeDTO, OptionValueDTO } from "./option.model";
import { VariantOptionDTO } from "./variant.model";

=======

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
>>>>>>> Stashed changes

export interface ProductVariantDTO {
  options: VariantOptionDTO[];
  price: number;
  stock: number;
  sku: string;
}

<<<<<<< Updated upstream
export interface ProductOptionDTO {
  id: number;
  name: string;
  optionValues: OptionValueDTO[];
}

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  options: OptionTypeDTO[];
=======
  options: OptionDTO[];
>>>>>>> Stashed changes
  variants: ProductVariantDTO[];
}