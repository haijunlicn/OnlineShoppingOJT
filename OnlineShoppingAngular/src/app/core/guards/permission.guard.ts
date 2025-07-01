// src/app/core/guards/permission.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AccessControlService } from '../services/AccessControl.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private accessControlService: AccessControlService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const groups: string[][] = route.data['permissionGroups'];

    let allowed = false;

    if (groups && Array.isArray(groups)) {
      allowed = groups.some(group => this.accessControlService.hasAll(...group));
    }

    if (!allowed) {
      this.router.navigate(['/admin/dashboard']);
    }

    return allowed;
  }

}
