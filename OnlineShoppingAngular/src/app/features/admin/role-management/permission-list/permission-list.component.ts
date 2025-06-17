// src/app/permission/permission-list/permission-list.component.ts

import { Component, OnInit } from "@angular/core";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { PermissionService } from "@app/core/services/permission.service";


@Component({
  selector: 'app-permission-list',
  standalone : false,
  templateUrl: './permission-list.component.html',
  styleUrls: ['./permission-list.component.css']
})
export class PermissionListComponent implements OnInit {
  permissions: PermissionDTO[] = [];

  constructor(private permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => this.permissions = res,
      error: (err) => console.error('Failed to load permissions', err)
    });
  }

  editPermission(p: PermissionDTO): void {
    // navigate to update form (implement navigation logic here)
    console.log('Editing permission', p);
  }

  deletePermission(id: number): void {
    if (confirm('Are you sure to delete this permission?')) {
      // implement delete logic in service and call it
      console.log('Deleting permission', id);
    }
  }
}
