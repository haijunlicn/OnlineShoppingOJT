import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImageUploadResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private baseUrl = 'http://localhost:8080/api/cloudinary';

  constructor(private http: HttpClient) { }

  uploadProductImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData()
    formData.append("image", file)
    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/product`, formData)
  }

  uploadVariantImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData()
    formData.append("image", file)
    return this.http.post<ImageUploadResponse>(`${this.baseUrl}/variant`, formData)
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload`, formData, { responseType: 'text' });
  }


  deleteImage(imagePath: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}`, {
      body: { imagePath },
    })
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 5MB

    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Only image files are allowed" };
    }

    if (file.size > maxSize) {
      return { valid: false, error: "Image size must be less than 5MB" };
    }

    return { valid: true };
  }

  

}
