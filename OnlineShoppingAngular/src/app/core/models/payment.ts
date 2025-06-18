export interface PaymentMethodDTO {
  id?: number;
  methodName: string;
  qrPath?: string;
  status?: number;
  createdDate?: Date;
  updatedDate?: Date;
}
