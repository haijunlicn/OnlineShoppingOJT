import { CustomerGroupEA_H } from "./discount";



export interface User {
  id: number;
  email: string;
  name: string;
  role?:string;
  profile?:string;
  groupIds?:number[] ;
  customerGroup?: CustomerGroupEA_H[]
  phone?: string; // Optional
  roleName?: string; // Must match DTO's roleName
  isVerified?: boolean; // Optional
  delFg?: boolean; // Optional
  createdDate?: string; // LocalDateTime will be sent as ISO String
  updatedDate?: string;
  permissions?: string[];
  avatar?: string;
  roleType?: number;
  orderCount?: number;
  totalSpent?: number;
  city?: string;
}
