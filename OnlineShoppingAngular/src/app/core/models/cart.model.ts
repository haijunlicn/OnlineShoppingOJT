export interface CartItem {
  productId: number;
  productName: string;
  variantId: number;
  variantSku: string;
  stock: number;
  price: number;
  imgPath?: string;
  quantity: number;
  brandId: number;
  categoryId: number;
}
