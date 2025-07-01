export interface StoreLocationDto {
  id?: number;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  phoneNumber: string;
  delFg?: boolean;
  city: string;
  country: string;
  zipCode: string;
}