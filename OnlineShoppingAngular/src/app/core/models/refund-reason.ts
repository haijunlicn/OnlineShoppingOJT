export interface RefundReasonDTO {
  id?: number;
  label: string;
  delFg?: number;
  createdDate?: Date;
  updatedDate?: Date;
  allowCustomText?: boolean;
}

export interface RejectionReasonDTO {
  id?: number;
  label: string;
  delFg?: number;
  createdDate?: Date;
  updatedDate?: Date;
  allowCustomText?: boolean;
}

export interface PaymentRejectionReasonDTO {
  id?: number;
  label: string;
  allowCustomText?: boolean;
  delFg?: number;
  createdDate?: Date;
  updatedDate?: Date;
}
