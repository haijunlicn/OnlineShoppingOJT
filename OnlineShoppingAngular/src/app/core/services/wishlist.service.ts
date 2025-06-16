import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WishlistDTO } from '../models/wishlist-dto';
import { WishlistTitleDTO } from '../models/wishlist-titleDTO';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = 'http://localhost:8080/api/wishlist';

  constructor(private http: HttpClient) {}

  getWishlistTitles(userId: number): Observable<WishlistTitleDTO[]> {
    return this.http.get<WishlistTitleDTO[]>(`${this.baseUrl}/titles/${userId}`);
  }
 getProductsByWishlistTitle(titleId: number): Observable<WishlistDTO[]> {
  return this.http.get<WishlistDTO[]>(`${this.baseUrl}/items/${titleId}`);
}



  createWishlistTitle(dto: WishlistTitleDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/title`, dto);
  }

  addProductToWishlist(dto: WishlistDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, dto);
  }
  getWishedProductIds(userId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/wished-products/${userId}`);
  }
removeProductFromWishlist(userId: number, productId: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/remove`, {
    params: { userId: userId.toString(), productId: productId.toString() }
  });
}
removeProductFromSpecificWishlistTitle(userId: number, titleId: number, productId: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/remove-from-title`, {
    params: {
      userId: userId.toString(),
      titleId: titleId.toString(),
      productId: productId.toString()
    }
  });
}
removeWishlistTitle(titleId: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/title/${titleId}`);
}


}
