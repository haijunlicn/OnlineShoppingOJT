export interface UserResponse {
  id: number;
  email: string;
  name: string;
  profile?:string;
  password?:string;
  phone?: string;
  isVerified: boolean;
  delFg: boolean;
  createdDate: string;
  updatedDate: string;
  roleName: string;
}
