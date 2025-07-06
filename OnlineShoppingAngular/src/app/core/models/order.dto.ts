export interface OrderItemRequestDTO {
  variantId: number;
  productId: number;
  quantity: number;
  price: number;
  // variantSku: string;
  // productName: string;
  imgPath: string;
}

export interface OrderRequestDTO {
  userId: number;
  shippingAddressId: number;
  paymentMethodId?: number | null;
  paymentType?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'Payment Failed';
  totalAmount: number;
  shippingFee: number;
  items: OrderItemRequestDTO[];
  deliveryMethod: string;
} 