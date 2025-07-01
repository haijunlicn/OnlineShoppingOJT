export interface RefundReason {
  id: number;
  label: string;
  allowCustomText: boolean;
}

export interface OrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  deliveredQty: number;
  maxReturnQty: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  orderDate: Date;
  shippingAddress: string;
  items: OrderItem[];
}

export interface RefundItemForm {
  orderItemId: number;
  productName: string;
  sku: string;
  maxReturnQty: number;
  returnQty: number;
  reasonId: number | null;
  customReasonText: string;
  customerNote: string;
  proofs: File[];
}

export interface ReturnRequestForm {
  orderId: number;
  items: RefundItemForm[];
  overallNote: string;
}

export interface ReturnRequestPayload {
  orderId: number;
  items: {
    orderItemId: number;
    returnQty: number;
    reasonId: number;
    customReasonText?: string;
    customerNote?: string;
  }[];
  overallNote?: string;
}
