import { UserResponse } from "./UserResponse";

export interface DiscountGroup {
  id: number;
  name: string;
  createdDate: string; // String because backend sends string now
  member_count: number
  members: UserResponse[];
}