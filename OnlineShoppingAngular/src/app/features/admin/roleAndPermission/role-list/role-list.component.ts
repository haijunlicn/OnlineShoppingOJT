import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { RoleDTO } from "@app/core/models/roleDTO";
import { RoleService } from "@app/core/services/role.service";


@Component({
  selector: "app-role-list",
  standalone: false,
  templateUrl: "./role-list.component.html",
  styleUrls: ["./role-list.component.css"],
})
export class RoleListComponent implements OnInit {
  roles: RoleDTO[] = []
  filteredRoles: RoleDTO[] = []
  searchTerm = ""
  selectedType = ""

  constructor(
    private roleService: RoleService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadRoles()
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        this.roles = res
        this.filteredRoles = [...res]
      },
      error: (err) => console.error("Error loading roles", err),
    })
  }

  filterRoles(): void {
    let filtered = [...this.roles]

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (role) =>
          role.name!.toLowerCase().includes(term) ||
          (role.description && role.description.toLowerCase().includes(term)),
      )
    }

    // Filter by type
    if (this.selectedType !== "") {
      const typeFilter = Number.parseInt(this.selectedType)
      filtered = filtered.filter((role) => role.type === typeFilter)
    }

    this.filteredRoles = filtered
  }

  getPreviewPermissions(permissions: PermissionDTO[]): PermissionDTO[] {
    return permissions.slice(0, 3)
  }

  isFixedRole(id: number): boolean {
    return id === 1 || id === 2
  }

  isSuperAdmin(): boolean {
    const roleId = Number(localStorage.getItem("role_id"))
    return roleId === 2
  }

  editRole(role: RoleDTO): void {
    this.router.navigate(["/admin/role-update", role.id])
  }

  deleteRole(id: number): void {
    if (this.isFixedRole(id)) {
      alert("Cannot delete system roles!")
      return
    }

    if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      this.roleService.deleteRole(id).subscribe({
        next: () => {
          this.loadRoles()
          // Consider using a toast service instead of alert
          alert("Role deleted successfully!")
        },
        error: (err) => {
          console.error("Delete error", err)
          alert("Error deleting role. Please try again.")
        },
      })
    }
  }

  getAdminRolesCount(): number {
    return this.roles.filter((role) => role.type === 1).length
  }

  getCustomerRolesCount(): number {
    return this.roles.filter((role) => role.type === 0).length
  }

  getSystemRolesCount(): number {
    return this.roles.filter((role) => this.isFixedRole(role.id!)).length
  }
}
