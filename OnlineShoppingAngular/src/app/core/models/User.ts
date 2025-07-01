


export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string; // Optional
  roleName?: string; // Must match DTO's roleName
  isVerified?: boolean; // Optional
  delFg?: boolean; // Optional
  createdDate?: string; // LocalDateTime will be sent as ISO String
  updatedDate?: string;
  permissions?: string[];
}
