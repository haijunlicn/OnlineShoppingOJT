import type { CategoryDTO } from "./category-dto"
import type { OptionTypeDTO, OptionValueDTO } from "./option.model"
import type { VariantOptionDTO } from "./variant.model"

export interface ProductVariantDTO {
  options: VariantOptionDTO[]
  price: number
  stock: number
  sku: string
  imgPath?: string // Single optional image for variant
  // imageUrl?: string // For display purposes
  priceHistory?: VariantPriceDTO[]
}

export interface ProductOptionDTO {
  id: number
  name: string
  optionValues: OptionValueDTO[]
}

export interface ProductDTO {
  id?: number
  name: string
  description: string
  brandId: string
  categoryId: string
  basePrice: number
  createdDate?: string
  productImages?: ProductImageDTO[] // Multiple images for product
}

export interface BrandDTO {
  id: string
  name: string
}

export interface CreateProductRequestDTO {
  product: ProductDTO
  options: OptionTypeDTO[]
  variants: ProductVariantDTO[]
  productImages?: ProductImageDTO[] // Add product images
}

export interface ProductListItemDTO {
  id: number
  product: ProductDTO
  brand: BrandDTO
  category: CategoryDTO
  variants: ProductVariantDTO[]
  options: ProductOptionDTO[]
}

export interface VariantPriceDTO {
  id: number
  price: number
  startDate: string
  endDate?: string | null
}

export interface ProductImageDTO {
  id?: number
  productId?: number
  imgPath?: string
  // imageUrl?: string // For display purposes
  displayOrder: number
  mainImageStatus: boolean
  altText?: string
  createdDate?: string
}

export interface ImageUploadResponse {
  imgPath?: string
  imageUrl?: string
}

export interface ProductCardItem extends ProductListItemDTO {
  status: string;
}

export interface ImagePoolItem {
  id: string
  file: File
  previewUrl: string
  displayOrder: number
  isMain: boolean
  altText: string
  uploaded?: boolean
  uploadedUrl?: string
}