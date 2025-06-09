import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private baseUrl = 'http://localhost:8080/api/cloudinary';

  constructor(private http: HttpClient) { }

  /**
   * Uploads an image file to Cloudinary via the backend.
   * 
   * @param imageFile - The image file to upload.
   * @returns Observable<string> - The URL of the uploaded image.
   */
  uploadCategoryImage(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http.post(`${this.baseUrl}/upload`, formData, { responseType: 'text' });
  }

}
