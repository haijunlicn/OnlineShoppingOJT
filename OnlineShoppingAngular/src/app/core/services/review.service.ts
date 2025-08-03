import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ProductReview } from "../models/review";

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = "http://localhost:8080/api/reviews";

  constructor(private http: HttpClient) {}

  getProductReviews(productId: number, page: number = 1, size: number = 5, sort: string = 'date_desc', rating?: number): Observable<{reviews: ProductReview[], total: number, average: number, breakdown: {[key: number]: number}}> {
   console.log("HI GET PRODUCT REVIEWS")
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    if (rating) params = params.set('rating', rating);

    return this.http.get<{reviews: ProductReview[], total: number, average: number, breakdown: {[key: number]: number}}>(
      `${this.baseUrl}/public/product/${productId}`, { params }
    );
  }

  addReview(review: Partial<ProductReview>): Observable<ProductReview> {
    return this.http.post<ProductReview>(`${this.baseUrl}`, review);
  }

  updateReview(review: ProductReview): Observable<ProductReview> {
    return this.http.put<ProductReview>(`${this.baseUrl}/${review.id}`, review);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`);
  }

  checkPurchaseStatus(productId: number): Observable<{canReview: boolean; hasReviewed: boolean}> {
    return this.http.get<{canReview: boolean; hasReviewed: boolean}>(`${this.baseUrl}/check-purchase/${productId}`);
  }

  getAllReviews(): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(`${this.baseUrl}/public/all`);
  }

  getUserReviews(): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(`${this.baseUrl}/user/my-reviews`);
  }
}