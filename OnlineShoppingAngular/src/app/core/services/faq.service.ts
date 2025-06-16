import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Faq } from "../models/faq";


@Injectable({
  providedIn: 'root'
})
export class FaqService {

  private baseUrl = 'http://localhost:8080/faq';

  constructor(private http: HttpClient) { }

  // Create
 createFaq(faq: Faq): Observable<any> {
  return this.http.post(`${this.baseUrl}/create`, faq, { responseType: 'text' as 'json' });
}


  // Read - All
  getAllFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>(`${this.baseUrl}/list`);
  }

  // Read - By ID
  getFaqById(id: number): Observable<Faq> {
    return this.http.get<Faq>(`${this.baseUrl}/getbyid/${id}`);
  }

  // Update
  updateFaq(faq: Faq): Observable<string> {
    return this.http.put(`${this.baseUrl}/update/${faq.id}`, faq, { responseType: 'text' });
  }

  // Delete (Soft Delete)
  deleteFaq(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
}
