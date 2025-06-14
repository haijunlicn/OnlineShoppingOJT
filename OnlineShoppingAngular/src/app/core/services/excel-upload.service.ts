import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {

  constructor(
    private http : HttpClient
  ) { }

  uploadZip(formData: FormData) {
    return this.http.post('/api/products/upload-zip', formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

}
