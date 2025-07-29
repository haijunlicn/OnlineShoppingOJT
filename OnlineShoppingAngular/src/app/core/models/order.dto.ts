import { DiscountType, MechanismType, OrderDiscountMechanismDTO } from "./discount";
import { RefundRequestDTO } from "./refund.model";

export interface OrderItemRequestDTO {
  variantId: number;
  productId: number;
  quantity: number;
  price: number;
  imgPath: string;
  originalPrice?: number
  appliedDiscounts?: OrderItemDiscountMechanismDTO[]
}

export interface OrderItemDiscountMechanismDTO {
  discountMechanismId: number
  mechanismType: MechanismType
  discountType: DiscountType
  discountAmount: number // Base amount per item
  couponCode?: string
  description: string
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

export interface OrderDetail {
  id: number;
  trackingNumber: string;
  paymentStatus: PAYMENT_STATUS;
  currentOrderStatus: ORDER_STATUS;
  totalAmount: number;
  shippingFee: number;
  createdDate: string;
  updatedDate: string;
  paymentProofPath?: string;
  maxReturnQty?: number;
  orderType?: orderType;

  // Payment method information
  paymentMethod?: {
    id: number;
    methodName: string;
    description: string;
    type: string;
    logo?: string;
    qrPath?: string;
    status: number;
  };
  paymentType?: string;

  user: {
    id: number;
    name: string;
    email: string;
    // phone: string;
  };
  shippingAddress: {
    id: number;
    address: string;
    city: string;
    township: string;
    zipCode: string;
    country: string;
    lat: number;
    lng: number;
    phoneNumber?: string;
  };
  deliveryMethod: {
    id: number;
    name: string;
    baseFee: number;
    feePerKm: number;
  };
  items: OrderItemDetail[];
  statusHistory: OrderStatusHistory[];
  refunds?: RefundRequestDTO[];
}


export interface OrderItemDetail {
  id: number;
  quantity: number;
  price: number;
  totalPrice: number;
  variant: {
    id: number;
    sku: string;
    price: number;
    stock: number;
    variantName: string;
    imgPath: string;
    options?: VariantOption[]; // <-- add this line
  };
  product: {
    id: number;
    name: string;
    description: string;
    imgPath: string;
    sku: string;
  };
  maxReturnQty?: number;
  appliedDiscounts?: OrderItemDiscountMechanismDTO[];
}

export interface VariantOption {
  optionId: number;
  optionValueId: number;
  optionName: string;
  valueName: string;
}

export interface OrderStatusEntity {
  id: number;
  code: ORDER_STATUS;
  label: string;
  displayOrder: number;
  isFailure: boolean;
  isFinal: boolean;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  statusId: number;
  statusCode: string;
  note: string;
  createdAt: string;
  updatedBy: number;
  status?: OrderStatusEntity; // ✅ newly added
}

export interface UserSummary {
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface AddressSummary {
  address: string;
  city: string;
  township: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
}

export interface DeliveryMethod {
  name: string;
  baseFee: number;
  feePerKm: number;
}

export interface PaymentMethod {
  name: string;
}

export interface OrderItem {
  quantity: number;
  price: number;
  product: { name: string; imgPath?: string };
  variant: { sku: string; imgPath?: string };
}

export interface OrderStatusHistory {
  statusId: number;
  changedAt: string;
  changedBy: string;
}

export interface OrderStatus {
  code: ORDER_STATUS;
  label: string;
}

export interface OrderStatusEntity {
  code: ORDER_STATUS;
  label: string;
}

export enum ORDER_STATUS {
  ORDER_PENDING = 'ORDER_PENDING',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  PAID = 'PAID'
}

export enum PAYMENT_STATUS {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

export interface StatusStep {
  label: string;
  icon: string;
  key: ORDER_STATUS | PAYMENT_STATUS | string;
  class?: string;
  connectorClass?: string;
  date?: string;
  note?: string;  // add this line to include the note
  isCurrent?: boolean;
  isCompleted?: boolean;
}

export const STATUS_TRANSITIONS: Record<ORDER_STATUS, ORDER_STATUS[]> = {
  [ORDER_STATUS.ORDER_PENDING]: [ORDER_STATUS.ORDER_CONFIRMED],
  [ORDER_STATUS.ORDER_CONFIRMED]: [ORDER_STATUS.PACKED, ORDER_STATUS.ORDER_CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ORDER_CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ORDER_CANCELLED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.ORDER_CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.ORDER_CANCELLED]: [],
  [ORDER_STATUS.PAYMENT_REJECTED]: [],
  [ORDER_STATUS.PAID]: [],
  // [ORDER_STATUS.PLACED]: [],
};

export interface TimelineStep {
  code: ORDER_STATUS;
  label: string;
  icon: string;
  order: number;
}

export const TIMELINE_STEPS: TimelineStep[] = [
  {
    code: ORDER_STATUS.ORDER_PENDING,
    label: 'Order Pending',
    icon: 'fas fa-clock',
    order: 1
  },
  {
    code: ORDER_STATUS.PAID,
    label: 'Payment Confirmed',
    icon: 'fas fa-credit-card',
    order: 2
  },
  {
    code: ORDER_STATUS.PAYMENT_REJECTED,
    label: 'Payment Rejected',
    icon: 'fas fa-exclamation-triangle',
    order: 3
  },
  {
    code: ORDER_STATUS.ORDER_CONFIRMED,
    label: 'Confirmed',
    icon: 'fas fa-thumbs-up',
    order: 4
  },
  {
    code: ORDER_STATUS.PACKED,
    label: 'Packed',
    icon: 'fas fa-box',
    order: 5
  },
  {
    code: ORDER_STATUS.SHIPPED,
    label: 'Shipped',
    icon: 'fas fa-truck',
    order: 6
  },
  {
    code: ORDER_STATUS.OUT_FOR_DELIVERY,
    label: 'Out for Delivery',
    icon: 'fas fa-shipping-fast',
    order: 7
  },
  {
    code: ORDER_STATUS.DELIVERED,
    label: 'Delivered',
    icon: 'fas fa-home',
    order: 8
  },
  {
    code: ORDER_STATUS.ORDER_CANCELLED,
    label: 'Cancelled',
    icon: 'fas fa-ban',
    order: 99
  }
];

export const ORDER_STATUS_LABELS: Record<ORDER_STATUS, string> = {
  [ORDER_STATUS.ORDER_PENDING]: 'Order Pending',
  [ORDER_STATUS.ORDER_CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PACKED]: 'Packed',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.ORDER_CANCELLED]: 'Cancelled',
  [ORDER_STATUS.PAYMENT_REJECTED]: 'Payment Rejected',
  [ORDER_STATUS.PAID]: 'Payment Confirmed'
};

const ORDER_PROGRESS_FLOW: ORDER_STATUS[] = [
  ORDER_STATUS.ORDER_PENDING,
  ORDER_STATUS.ORDER_CONFIRMED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED
];

const UNIFIED_TIMELINE_STEPS: StatusStep[] = [
  { label: 'Order Placed', icon: 'fas fa-shopping-cart', key: 'ORDER_PLACED' }, // synthetic first step
  { label: 'Payment Pending', icon: 'fas fa-clock', key: PAYMENT_STATUS.PENDING },
  { label: 'Payment Confirmed', icon: 'fas fa-credit-card', key: PAYMENT_STATUS.PAID },
  { label: 'Payment Failed', icon: 'fas fa-times-circle', key: PAYMENT_STATUS.FAILED },
  { label: 'Order Confirmed', icon: 'fas fa-thumbs-up', key: ORDER_STATUS.ORDER_CONFIRMED },
  { label: 'Packed', icon: 'fas fa-box', key: ORDER_STATUS.PACKED },
  { label: 'Shipped', icon: 'fas fa-truck', key: ORDER_STATUS.SHIPPED },
  { label: 'Out for Delivery', icon: 'fas fa-shipping-fast', key: ORDER_STATUS.OUT_FOR_DELIVERY },
  { label: 'Delivered', icon: 'fas fa-home', key: ORDER_STATUS.DELIVERED },
  { label: 'Order Cancelled', icon: 'fas fa-ban', key: ORDER_STATUS.ORDER_CANCELLED }
];

export enum orderType {
  NORMAL = 'NORMAL',
  REPLACEMENT = 'REPLACEMENT',
}
