import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VlogFileDTO } from '../models/vlog';

@Injectable({
  providedIn: 'root'
})
export class VlogFileService {
  
  private baseUrl = 'http://localhost:8080/vlog';

  constructor(private http: HttpClient) {}

createVlogFile(dto: VlogFileDTO): Observable<VlogFileDTO> {
  return this.http.post<VlogFileDTO>(`${this.baseUrl}/create`, dto);
}


  // ✅ Get by ID
  getById(id: number): Observable<VlogFileDTO> {
    return this.http.get<VlogFileDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  // ✅ Update
  updateVlogFile(id: number, vlogFile: VlogFileDTO): Observable<VlogFileDTO> {
    return this.http.put<VlogFileDTO>(`${this.baseUrl}/update/${id}`, vlogFile);
  }

  // ✅ Delete
  deleteVlogFile(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

  // ✅ Get files by vlogId
  getFilesByVlogId(vlogId: number): Observable<VlogFileDTO[]> {
    return this.http.get<VlogFileDTO[]>(`${this.baseUrl}?vlogId=${vlogId}`);
  }

  // ✅ Get all files
  getFiles(): Observable<VlogFileDTO[]> {
    return this.http.get<VlogFileDTO[]>('http://localhost:8080/vlog-files');
  }
  
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('http://localhost:8080/api/cloudinary/upload', formData, {
      responseType: 'text',
    });
  }

}
