// src/app/permission/permission-list/permission-list.component.ts

import { Component, OnInit } from "@angular/core";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { PermissionService } from "@app/core/services/permission.service";

interface PermissionGroup {
  resource: string
  permissions: PermissionDTO[]
  expanded: boolean
}

@Component({
  selector: "app-permission-list",
  standalone: false,
  templateUrl: "./permission-list.component.html",
  styleUrls: ["./permission-list.component.css"],
})
export class PermissionListComponent implements OnInit {
  permissions: PermissionDTO[] = []
  filteredPermissions: PermissionDTO[] = []
  groupedFilteredPermissions: PermissionGroup[] = []
  searchTerm = ""
  selectedResource = ""
  uniqueResources: string[] = []

  constructor(private permissionService: PermissionService) { }

  ngOnInit(): void {
    this.loadPermissions()
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.permissions = res
        this.filteredPermissions = [...res]
        this.extractUniqueResources()
        this.groupPermissions()
      },
      error: (err) => console.error("Failed to load permissions", err),
    })
  }

  extractUniqueResources(): void {
    const resources = this.permissions.map((p) => p.resource || "Other")
    this.uniqueResources = [...new Set(resources)].sort()
  }

  filterPermissions(): void {
    let filtered = [...this.permissions]

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (perm) =>
          perm.description!.toLowerCase().includes(term) ||
          perm.code!.toLowerCase().includes(term) ||
          perm.resource!.toLowerCase().includes(term),
      )
    }

    // Filter by resource
    if (this.selectedResource) {
      filtered = filtered.filter((perm) => perm.resource === this.selectedResource)
    }

    this.filteredPermissions = filtered
    this.groupPermissions()
  }

  groupPermissions(): void {
    const grouped: { [key: string]: PermissionDTO[] } = {}

    for (const perm of this.filteredPermissions) {
      const resource = perm.resource || "Other"
      if (!grouped[resource]) {
        grouped[resource] = []
      }
      grouped[resource].push(perm)
    }

    this.groupedFilteredPermissions = Object.entries(grouped).map(([resource, permissions]) => ({
      resource,
      permissions: permissions.sort((a, b) => a.description!.localeCompare(b.description!)),
      expanded: true, // Expand all by default for read-only view
    }))
  }

  getModuleIcon(resource: string): string {
    const resourceLower = resource.toLowerCase()

    if (resourceLower.includes("product")) return "fas fa-box"
    if (resourceLower.includes("order")) return "fas fa-shopping-cart"
    if (resourceLower.includes("customer")) return "fas fa-users"
    if (resourceLower.includes("delivery") || resourceLower.includes("payment")) return "fas fa-truck"
    if (resourceLower.includes("discount") || resourceLower.includes("coupon")) return "fas fa-percent"
    if (resourceLower.includes("analytic") || resourceLower.includes("report")) return "fas fa-chart-bar"
    if (resourceLower.includes("role") || resourceLower.includes("permission") || resourceLower.includes("admin"))
      return "fas fa-user-shield"
    if (resourceLower.includes("setting")) return "fas fa-cog"
    if (resourceLower.includes("log") || resourceLower.includes("audit")) return "fas fa-file-alt"
    if (resourceLower.includes("system") || resourceLower.includes("superadmin")) return "fas fa-crown"

    return "fas fa-folder"
  }

  toggleGroup(index: number): void {
    this.groupedFilteredPermissions[index].expanded = !this.groupedFilteredPermissions[index].expanded
  }

  getReadPermissionsCount(): number {
    return this.permissions.filter((p) => p.code!.includes("READ")).length
  }

  getManagePermissionsCount(): number {
    return this.permissions.filter(
      (p) =>
        p.code!.includes("MANAGE") ||
        p.code!.includes("CREATE") ||
        p.code!.includes("UPDATE") ||
        p.code!.includes("DELETE"),
    ).length
  }
}