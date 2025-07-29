import { OrderDetail } from "./order.dto";

// RefundStatus enum in Angular
export enum RefundStatus {
  REQUESTED = "REQUESTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// RefundItemStatus enum in Angular
export enum RefundItemStatus {
  REQUESTED = "REQUESTED", // Customer submitted request
  APPROVED = "APPROVED",   // Admin approved request

  RETURN_PENDING = "RETURN_PENDING", // Admin approved a return-required action (return&refund and replacement) (item to be returned by customer)
  // RETURN_IN_TRANSIT = "RETURN_IN_TRANSIT", // (optional) Customer shipped the return and shared tracking
  RETURN_RECEIVED = "RETURN_RECEIVED", // Admin received returned item (return&refund and replacement)

  REFUNDED = "REFUNDED",     // Refund has been processed
  REPLACED = "REPLACED",     // Replacement item sent

  REJECTED = "REJECTED",     // Admin rejected request initially
  RETURN_REJECTED = "RETURN_REJECTED", // Admin rejected item after it was returned
}


export enum RequestedRefundAction {
  REFUND_ONLY = "REFUND_ONLY",
  RETURN_AND_REFUND = "RETURN_AND_REFUND",
  REPLACEMENT = "REPLACEMENT"
}


// DTOs matching your backend structure
export interface RefundReasonDTO {
  id?: number;
  label: string;
  allowCustomText?: boolean;
  delFg?: number;
  createdDate?: Date;
  updatedDate?: Date;
}

export interface RefundItemImageDTO {
  id?: number;
  refundItemId?: number;
  imgPath: string;
  uploadedAt?: Date;
}

export interface RefundItemDTO {
  id?: number;
  refundRequestId?: number;
  orderItemId: number;
  quantity: number;
  reasonId?: number;
  status?: RefundItemStatus;
  rejectionReasonId?: number;
  adminComment?: string;
  updatedAt?: Date;
  images?: RefundItemImageDTO[];
  customReasonText?: string
  productName?: string;
  sku?: string;
  productImg?: string;
  requestedAction?: RequestedRefundAction;
  statusHistory?: RefundItemStatusHistoryDTO[];
}

export interface RefundRequestDTO {
  id?: number;
  userId?: number;
  orderId: number;
  orderDetail?: OrderDetail;
  status?: RefundStatus;
  returnTrackingCode?: string;
  customerTrackingCode?: string;
  receivedDate?: Date;
  refundedDate?: Date;
  adminComment?: string;
  createdAt?: Date;
  updatedAt?: Date;
  items: RefundItemDTO[];
  statusHistory?: RefundStatusHistoryDTO[];
}

// Form interfaces for frontend use
export interface RefundItemForm {
  orderItemId: number;
  productName: string;
  sku: string;
  maxReturnQty: number;
  returnQty: number;
  reasonId: number | null;
  customReasonText?: string;
  proofs: File[];
  requestedAction: RequestedRefundAction;
  statusHistoryList?: RefundItemStatusHistoryDTO[];
}

export interface ReturnRequestForm {
  orderId: number;
  items: RefundItemForm[];
}

// Payload for API submission
export interface ReturnRequestPayload {
  orderId: number;
  items: {
    orderItemId: number;
    quantity: number;
    reasonId: number;
    customReasonText?: string
    requestedAction: RequestedRefundAction;
  }[];
  userId: number;
}

// Response from backend
export interface ReturnRequestResponse {
  id: number;
  orderId: number;
  status: RefundStatus;
  createdAt: string;
  items: RefundItemResponseDTO[];
}

export interface RefundItemResponseDTO {
  id: number;
  orderItemId: number;
  quantity: number;
  reasonId: number;
  status: RefundItemStatus;
  statusHistoryList?: RefundItemStatusHistoryDTO[];
}

export interface RefundStatusHistoryDTO {
  id?: number;
  refundRequestId?: number;
  status: RefundStatus;
  note?: string;
  createdAt?: Date;
  updatedBy?: number;
  updatedAdmin?: string;
  updatedAdminRole?: string;
}

export interface RefundItemStatusHistoryDTO {
  id?: number;
  refundItemId?: number;
  status: RefundItemStatus;
  note?: string;
  createdAt?: Date;
  updatedBy?: number;
  updatedAdmin?: string;
  updatedAdminRole?: string;
}
