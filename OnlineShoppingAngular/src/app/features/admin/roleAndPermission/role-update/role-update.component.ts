import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { RoleDTO } from "@app/core/models/roleDTO";
import { AlertService } from "@app/core/services/alert.service";
import { PermissionService } from "@app/core/services/permission.service";
import { RoleService } from "@app/core/services/role.service";

interface PermissionGroup {
  resource: string
  permissions: PermissionDTO[]
  expanded: boolean
}

@Component({
  selector: "app-role-update",
  standalone: false,
  templateUrl: "./role-update.component.html",
  styleUrls: ["./role-update.component.css"],
})
export class RoleUpdateComponent implements OnInit {
  roleForm!: FormGroup
  roleId!: number
  allPermissions: PermissionDTO[] = []
  groupedPermissions: PermissionGroup[] = []
  filteredGroupedPermissions: PermissionGroup[] = []
  searchTerm = ""
  isSubmitting = false

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.roleId = +this.route.snapshot.paramMap.get("id")!
    this.initForm()
    this.loadPermissions()
    this.loadRole()
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      description: [""],
      type: [1, Validators.required],
      permissionIds: [[]],
    })
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.allPermissions = res
        this.groupPermissions()
      },
      error: (err) => {
        console.error("Error loading permissions:", err)
        // Add user-friendly error handling here
      },
    })
  }

  groupPermissions(): void {
    const grouped: { [key: string]: PermissionDTO[] } = {}

    for (const perm of this.allPermissions) {
      const resource = perm.resource || "Other"
      if (!grouped[resource]) {
        grouped[resource] = []
      }
      grouped[resource].push(perm)
    }

    this.groupedPermissions = Object.entries(grouped).map(([resource, permissions]) => ({
      resource,
      permissions: permissions.sort((a, b) => a.description!.localeCompare(b.description!)),
      expanded: false,
    }))

    // Expand first group by default
    if (this.groupedPermissions.length > 0) {
      this.groupedPermissions[0].expanded = true
    }

    this.filteredGroupedPermissions = [...this.groupedPermissions]
  }

  loadRole(): void {
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (role: RoleDTO) => {
        const selectedIds = role.permissions?.map((p) => p.id!) || []
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          type: role.type,
          permissionIds: selectedIds,
        })
      },
      error: (err) => {
        console.error("Error loading role:", err)
        // Add user-friendly error handling here
      },
    })
  }

  onPermissionChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    const permissionIds = [...(this.roleForm.get("permissionIds")?.value as number[])]

    if (checked) {
      if (!permissionIds.includes(id)) {
        permissionIds.push(id)
      }
    } else {
      const index = permissionIds.indexOf(id)
      if (index !== -1) {
        permissionIds.splice(index, 1)
      }
    }

    this.roleForm.get("permissionIds")?.setValue(permissionIds)
  }

  isPermissionSelected(id: number): boolean {
    const permissionIds = this.roleForm.get("permissionIds")?.value as number[]
    return permissionIds.includes(id)
  }

  getModuleIcon(resource: string): string {
    // Simple icon mapping based on keywords in resource name
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

    return "fas fa-folder" // default icon
  }

  toggleGroup(index: number): void {
    this.filteredGroupedPermissions[index].expanded = !this.filteredGroupedPermissions[index].expanded
  }

  getSelectedCount(permissions: PermissionDTO[]): number {
    const selectedIds = this.roleForm.get("permissionIds")?.value as number[]
    return permissions.filter((p) => selectedIds.includes(p.id!)).length
  }

  selectGroupPermissions(permissions: PermissionDTO[], select: boolean): void {
    const permissionIds = [...(this.roleForm.get("permissionIds")?.value as number[])]

    for (const perm of permissions) {
      if (select) {
        if (!permissionIds.includes(perm.id!)) {
          permissionIds.push(perm.id!)
        }
      } else {
        const index = permissionIds.indexOf(perm.id!)
        if (index !== -1) {
          permissionIds.splice(index, 1)
        }
      }
    }

    this.roleForm.get("permissionIds")?.setValue(permissionIds)
  }

  selectAll(): void {
    const allIds = this.allPermissions.map((p) => p.id!)
    this.roleForm.get("permissionIds")?.setValue(allIds)
  }

  clearAll(): void {
    this.roleForm.get("permissionIds")?.setValue([])
  }

  filterPermissions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGroupedPermissions = [...this.groupedPermissions]
      return
    }

    const term = this.searchTerm.toLowerCase()
    this.filteredGroupedPermissions = this.groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (perm) =>
            perm.description!.toLowerCase().includes(term) ||
            perm.code!.toLowerCase().includes(term) ||
            perm.resource!.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }

  getSelectedPermissionsCount(): number {
    return (this.roleForm.get("permissionIds")?.value as number[]).length
  }

  getSelectedPermissions(): PermissionDTO[] {
    const selectedIds = this.roleForm.get("permissionIds")?.value as number[]
    return this.allPermissions.filter((p) => selectedIds.includes(p.id!))
  }

  submit(): void {
    if (this.roleForm.valid && !this.isSubmitting) {
      this.isSubmitting = true
      const formVal = this.roleForm.value

      const updatedRole: RoleDTO = {
        id: this.roleId,
        name: formVal.name,
        description: formVal.description,
        type: formVal.type,
        permissions: this.allPermissions.filter((p) => formVal.permissionIds.includes(p.id)),
      }

      this.roleService.updateRole(updatedRole).subscribe({
        next: () => {
          this.alertService.toast('Role updated successfully!', 'success');
          this.router.navigate(["/admin/role-list"]);
        },
        error: (err) => {
          console.error("Error updating role:", err)
          alert("Error updating role. Please try again.")
          this.isSubmitting = false
        },
      })
    }
  }

  goBack(): void {
    this.router.navigate(["/admin/role-list"])
  }
}
