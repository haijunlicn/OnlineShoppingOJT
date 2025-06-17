import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PermissionDTO } from "../models/permissionDTO";

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private baseUrl = "http://localhost:8080/permission";

  constructor(private http: HttpClient) { }

  createPermission(permission: PermissionDTO): Observable<PermissionDTO> {
    return this.http.post<PermissionDTO>(`${this.baseUrl}/create`, permission, {
      responseType: 'json'
    });
  }

  getAllPermissions(): Observable<PermissionDTO[]> {
    return this.http.get<PermissionDTO[]>(`${this.baseUrl}/list`);
  }

  getPermissionById(id: number): Observable<PermissionDTO> {
    return this.http.get<PermissionDTO>(`${this.baseUrl}/getbyid/${id}`);
  }
   updatePermission(id: number, permission: PermissionDTO): Observable<PermissionDTO> {
    return this.http.put<PermissionDTO>(`${this.baseUrl}/update/${id}`, permission, {
      responseType: 'json'
    });
  }

  // ✅ Delete Permission
  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
