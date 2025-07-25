// src/app/core/services/vlog-comment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VlogComment } from '../models/vlog';

@Injectable({
  providedIn: 'root',
})
export class VlogCommentService {
  private baseUrl = 'http://localhost:8080/vlog-comments';

  constructor(private http: HttpClient) {}

  createComment(comment: VlogComment): Observable<VlogComment> {
    return this.http.post<VlogComment>(`${this.baseUrl}/create`, comment);
  }
  

  getCommentsByVlogId(vlogId: number): Observable<VlogComment[]> {
    return this.http.get<VlogComment[]>(`${this.baseUrl}/list/${vlogId}`);
  }
}
