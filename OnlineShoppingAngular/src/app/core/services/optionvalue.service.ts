import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OptionValueDTO } from '../models/option.model';

@Injectable({
  providedIn: 'root'
})
export class OptionvalueService {

  baseUrl = "http://localhost:8080/option-value";


  constructor(private http: HttpClient) { }

  createOptionValue(value: OptionValueDTO): Observable<OptionValueDTO> {
    return this.http.post<OptionValueDTO>(`${this.baseUrl}/create`, value, { responseType: 'text' as 'json' });
  }

  getValuesByOptionId(optionId: number): Observable<OptionValueDTO[]> {
    return this.http.get<OptionValueDTO[]>(`${this.baseUrl}/list/${optionId}`);
  }

  getOptionValueById(id: number): Observable<OptionValueDTO> {
    return this.http.get<OptionValueDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateOptionValues(value: OptionValueDTO): Observable<OptionValueDTO> {
    return this.http.put<OptionValueDTO>(`${this.baseUrl}/update/${value.id}`, value, { responseType: 'text' as 'json' });
  }

  deleteOptionValue(id: number): Observable<OptionValueDTO> {
    return this.http.delete<OptionValueDTO>(`${this.baseUrl}/delete/${id}`, { responseType: 'text' as 'json' });
  }

}
