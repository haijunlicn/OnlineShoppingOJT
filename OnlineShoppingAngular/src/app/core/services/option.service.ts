import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OptionTypeDTO } from '../models/option.model';

@Injectable({
  providedIn: 'root'
})
export class OptionService {

  baseUrl = "http://localhost:8080/option";

  constructor(private http: HttpClient) {}

  createOptionType(optionType: OptionTypeDTO): Observable<OptionTypeDTO> {
    return this.http.post<OptionTypeDTO>(`${this.baseUrl}/create`, optionType, { responseType: 'text' as 'json' });
  }

  getAllOptionTypes(): Observable<OptionTypeDTO[]> {
    return this.http.get<OptionTypeDTO[]>(`${this.baseUrl}/list`);
  }

  getOptionTypeById(id: number): Observable<OptionTypeDTO> {
    return this.http.get<OptionTypeDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateOptionType(optionType: OptionTypeDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${optionType.id}`, optionType, { responseType: 'text' as 'json' });
  }

  deleteOptionType(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }
}
