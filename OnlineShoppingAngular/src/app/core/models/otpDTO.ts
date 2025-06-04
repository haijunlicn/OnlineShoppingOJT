export interface OtpDTO {
  id?: number; 
  userId:number;
  otpCode: string;
  purpose: string;
  isUsed: boolean;
  expiryTime?: string;     
  createdDate?: string;    
}