import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OptionTypeDTO, OptionValueDTO } from '../models/option.model';

@Injectable({ providedIn: 'root' })
export class AttributeService {
  constructor(private http: HttpClient) {}

  getOptionTypes() {
    return this.http.get<OptionTypeDTO[]>('/api/options');
  }

  createOptionType(data: Partial<OptionTypeDTO>) {
    return this.http.post('/api/options', data);
  }

  updateOptionType(id: number, data: Partial<OptionTypeDTO>) {
    return this.http.put(`/api/options/${id}`, data);
  }

  getOptionValues() {
    return this.http.get<OptionValueDTO[]>('/api/option-values');
  }

  createOptionValue(data: any) {
    return this.http.post('/api/option-values', data);
  }

  updateOptionValue(id: number, data: any) {
    return this.http.put(`/api/option-values/${id}`, data);
  }
}
