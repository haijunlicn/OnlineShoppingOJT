export interface StoreLocationDto {
  id?: number;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  phoneNumber: string;
  city: string;
  country: string;
  zipCode: string;
  email: string;
  delFg?: boolean;
}