import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PermissionDTO } from "../models/permissionDTO";

@Injectable({
  providedIn: 'root'
})
export class AccessControlService {

  private permissions = new Set<string>();

  setPermissions(perms: string[]): void {
    this.permissions = new Set(perms);
  }

  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }

  hasAny(...perms: string[]): boolean {
    return perms.some(p => this.permissions.has(p));
  }

  hasAll(...perms: string[]): boolean {
    return perms.every(p => this.permissions.has(p));
  }

  clearPermissions(): void {
    this.permissions.clear();
  }

}
