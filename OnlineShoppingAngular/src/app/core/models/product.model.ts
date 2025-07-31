import type { CategoryDTO } from "./category-dto";
import { DiscountDisplayDTO } from "./discount";
import type { OptionTypeDTO, OptionValueDTO } from "./option.model";
import { User } from "./User";
import type { VariantOptionDTO } from "./variant.model";


// Product Variant
export interface ProductVariantDTO {
  id?: number;
  options: VariantOptionDTO[]
  price: number
  stock: number
  sku: string
  imgPath?: string
  priceHistory?: VariantPriceDTO[]
  displayLabel?: string
  isDefault?: boolean
  isRemovable?: boolean
  isExisting?: boolean
  isActive?: boolean
  createdBy?: User
  createdDate?: string
  delFg?: number;
}

// Product Option
export interface ProductOptionDTO {
  id: number;
  name: string;
  optionValues: OptionValueDTO[];
}

// Basic Product DTO
export interface ProductDTO {
  id?: number;
  name: string;
  description: string;
  brandId: string;
  brand?: BrandDTO;
  category?: CategoryDTO;
  categoryId: number | string;
  basePrice: number;
  createdDate?: string;
  productImages?: ProductImageDTO[];
  discountPrice?: number;
  originalPrice?: number;
  productVariants?: { stock: number }[];
  createdBy?: User;
  delFg?: number;
}

// Brand DTO
export interface BrandDTO {
  id: string;
  name: string;
  logo?: string;
  baseSku?: string;
  status?: number; // Optional for frontend compatibility
  delFg?: number; // Backend soft delete flag: 1=active, 0=inactive
  productCount?: number; // Number of products associated with this brand
}

// Create Product Request DTO
export interface CreateProductRequestDTO {
  product: ProductDTO;
  options: OptionTypeDTO[];
  variants: ProductVariantDTO[];
  productImages?: ProductImageDTO[];

}

// Main product list item DTO used in list view
export interface ProductListItemDTO {
  id: number;
  product: ProductDTO;
  brand: BrandDTO;
  category: CategoryDTO;
  variants: ProductVariantDTO[];
  options: ProductOptionDTO[];
  
}

// Price history per variant
export interface VariantPriceDTO {
  id: number;
  price: number;
  startDate: string;
  endDate?: string | null;
  orderCount?: number;
  createdBy?: User;
}

// Product Image
export interface ProductImageDTO {
  id?: number;
  productId?: number;
  imgPath?: string;
  displayOrder: number;
  mainImageStatus: boolean;
  altText?: string;
  createdDate?: string;
}

// Card item view of product (extends list item with a status badge)
export interface ProductCardItem extends ProductListItemDTO {
  status: string;
  discountHints?: DiscountDisplayDTO[];
  originalPrice?: number;
  discountedPrice?: number;
  discountBreakdown?: { label: string; amount: number }[];
  reviewAverage?: number;
  reviewTotal?: number;
}

// Image Pool Item (for image upload panel)
export interface ImagePoolItem {
  id: string;
  file: File;
  previewUrl: string;
  displayOrder: number;
  isMain: boolean;
  altText: string;
  uploaded?: boolean;
  uploadedUrl?: string;
}
export interface ImageUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  // add any other fields returned by your image upload response
}
