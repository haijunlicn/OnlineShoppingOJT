export interface PaymentMethodDTO {
  id?: number;
  methodName: string;
  qrPath?: string;
  logo?: string;
  status?: number;
  createdDate?: string;
  updatedDate?: string;
}
