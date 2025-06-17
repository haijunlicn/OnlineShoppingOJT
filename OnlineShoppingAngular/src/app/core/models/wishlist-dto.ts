import { ProductCardItem, ProductDTO } from "./product.model";

export interface WishlistDTO {
  productId: number;
  wishlistTitleId: number;
  productName?: string;
  product?: ProductDTO;
}