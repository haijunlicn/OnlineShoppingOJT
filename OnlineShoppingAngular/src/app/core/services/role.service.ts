import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RoleDTO } from "../models/roleDTO";


@Injectable({
  providedIn: 'root'
})
export class RoleService {

  baseUrl = "http://localhost:8080/roles";

  constructor(private http: HttpClient) { }

  createRole(role: RoleDTO): Observable<RoleDTO> {
    return this.http.post<RoleDTO>(`${this.baseUrl}/create`, role , { responseType: 'text' as 'json' });
  }

  getAllRoles(): Observable<RoleDTO[]> {
    return this.http.get<RoleDTO[]>(`${this.baseUrl}/list`);
  }

  getRoleById(id: number): Observable<RoleDTO> {
    return this.http.get<RoleDTO>(`${this.baseUrl}/getbyid/${id}`);
  }

  updateRole(role: RoleDTO): Observable<RoleDTO> {
    return this.http.put<RoleDTO>(`${this.baseUrl}/update/${role.id}`, role , { responseType: 'text' as 'json' });
  }

  deleteRole(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

}
