export interface ProductReviewImage {
  id?: number; // id is now optional for create
  imageUrl: string;
}

export interface ProductReview {
  id?: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdDate: string; // ISO string
  updatedDate?: string; // ISO string, optional
  images: ProductReviewImage[];
  userName?: string;
  verifiedPurchase?: boolean;
}