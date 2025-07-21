import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductAnswer, ProductQuestion } from '../models/qanda.model';


@Injectable({ providedIn: 'root' })
export class ProductQandaService {
  private baseUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getQuestions(productId: number, page: number = 1, size: number = 5): Observable<{questions: ProductQuestion[], total: number}> {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<{questions: ProductQuestion[], total: number}>(`${this.baseUrl}/public/${productId}/questions`, { params });
  }

  addQuestion(productId: number, questionText: string): Observable<ProductQuestion> {
    return this.http.post<ProductQuestion>(`${this.baseUrl}/${productId}/questions`, { questionText });
  }

  addAnswer(questionId: number, answerText: string): Observable<ProductAnswer> {
    return this.http.post<ProductAnswer>(`${this.baseUrl}/questions/${questionId}/answers`, { answerText });
  }

  // Admin: get all questions (with product, user, answers)
  getAllQuestions(page: number = 1, size: number = 10): Observable<{questions: ProductQuestion[], total: number}> {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<{questions: ProductQuestion[], total: number}>(`${this.baseUrl}/admin/questions`, { params });
  }

  // Admin: edit answer
  editAnswer(answerId: number, answerText: string): Observable<ProductAnswer> {
    return this.http.put<ProductAnswer>(`${this.baseUrl}/answers/${answerId}`, { answerText });
  }

  // Admin: delete question (and its answers)
  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/questions/${questionId}`);
  }
  // editQuestion(questionId: number, questionText: string) {
  //   return this.http.put(`/api/products/questions/${questionId}`, { questionText });
  // }
  editQuestionByCustomer(questionId: number, questionText: string) {
    return this.http.put(`${this.baseUrl}/questions/${questionId}/customer`, { questionText });
  }
  deleteQuestionByCustomer(questionId: number) {
    return this.http.delete(`${this.baseUrl}/questions/${questionId}/customer`);
  }
}