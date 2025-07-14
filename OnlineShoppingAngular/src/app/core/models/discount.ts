import { User } from "./User";
import { ProductDTO } from '../models/product.model';

export enum typeCA {
  COUPON = 'Coupon',
  AUTO = 'Auto'
}

export enum MechanismType {
  DISCOUNT = 'Discount',
  FREE_GIFT = 'freeGift'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED'
}
export interface DiscountEA_A {
  id: number;
  name: string;
  type: typeCA | string;
  description?: string;
  code?: string;
  currentRedemptionCount?: number;
  imgUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  perUserLimit?: number;
  delFg?: boolean;
  createdDate?: string;
  updatedDate?: string;
  discountMechanisms?: DiscountMechanismEA_B[];
 
}

export interface DiscountMechanismEA_B {
  id?: number;
  mechanismType: MechanismType | string;
  quantity?: number;
  mechanismIndex?: number
  discountType?: DiscountType | string;
   serviceDiscount?:string;
  value: string;
  maxDiscountAmount?: string;
  delFg?: boolean;
  createdDate?: string;
  updatedDate?: string;

  discountId?: number;
  disocunt?:DiscountEA_A;
  discountProducts?: DiscountProductEA_E[];

  discountConditionGroup?: DiscountConditionGroupEA_C[];
  freeGifts?: FreeGiftEA_F[];
 
}


export enum ConditionType {
  PRODUCT = 'PRODUCT',
  CUSTOMER_GROUP = 'CUSTOMER_GROUP',
  ORDER = 'ORDER',
  USER_STATUS = 'USER_STATUS'
}
export enum Operator {
  EQUAL = 'EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IS_ONE_OF = 'IS_ONE_OF'
}
 

export interface DiscountProductEA_E {
  id?: number;
  productId?: number;
  discountMechanismId?: number;
  product?:ProductDTO;
  discountMechanism?:DiscountMechanismEA_B;

}
export interface DiscountConditionGroupEA_C {
  id?: number;
  logicOperator: string;
  discountMechanismId?: number;
  groupId?: number;
 
  discountMechanism?: DiscountMechanismEA_B;
  group?: GroupEA_G; 
  discountCondition: DiscountConditionEA_D[];
}

export interface DiscountConditionEA_D {
  id?: number;
  conditionType: ConditionType | string
  conditionDetail: string;
  delFg?: boolean;
  createdDate?: string;
  updatedDate?: string;
  operator: Operator; // or '=' | 'IN' | ...
  value: string[];
  discountConditionGroupId?: number;
  discountConditionGroup?:DiscountConditionGroupEA_C;
}
export interface FreeGiftEA_F {
  id: number;
  mechanismId: number;
  productId: number;
  discount:DiscountEA_A;
  discountMechanism:DiscountMechanismEA_B;
}
export interface GroupEA_G {
  id: number;
  name: string;
  createDate?: string;
  updateDate?: string;

  customerGroup?: CustomerGroupEA_H[];
  discountConditionGroups?: DiscountConditionGroupEA_C[];
}
export interface CustomerGroupEA_H {
  id: string;
  groupId: number;
  userId: number;
  group:GroupEA_G;
  user:User;
}
export interface Product {
  id: number
  name: string
  sku: string
  category: string
  brand: string
  price: number
  stock: number
  status: string
  image: string
  createdDate: string
}

export interface Category {
  id: number
  name: string
}

export interface Brand {
  id: number
  name: string
}

export interface City {
  name: string
  region: string
}

export interface Rule {
  id: string
  type: string
  field: string
  operator: string
  values: string[]
}

export interface ValidationError {
  ruleId: string
  valueIndex?: number
  message: string
}
