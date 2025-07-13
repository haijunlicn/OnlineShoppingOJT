import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { PermissionDTO } from '@app/core/models/permissionDTO'
import { RoleDTO } from '@app/core/models/roleDTO'
import { PermissionService } from '@app/core/services/permission.service'
import { RoleService } from '@app/core/services/role.service'

interface PermissionGroup {
  resource: string
  permissions: PermissionDTO[]
  expanded: boolean
}

@Component({
  selector: 'app-role-form',
  standalone: false,
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css'],
})
export class RoleFormComponent implements OnInit {
  roleForm!: FormGroup
  allPermissions: PermissionDTO[] = []
  groupedPermissions: PermissionGroup[] = []
  filteredGroupedPermissions: PermissionGroup[] = []
  searchTerm = ''
  isSubmitting = false

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm()
    this.loadPermissions()
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: [1, Validators.required], // default to Admin
      permissionIds: [[]],
    })
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.allPermissions = res
        this.groupPermissions()
      },
      error: (err) => console.error('Error loading permissions:', err),
    })
  }

  groupPermissions(): void {
    const grouped: { [key: string]: PermissionDTO[] } = {}

    for (const perm of this.allPermissions) {
      const resource = perm.resource || 'Other'
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

    if (this.groupedPermissions.length > 0) {
      this.groupedPermissions[0].expanded = true
    }

    this.filteredGroupedPermissions = [...this.groupedPermissions]
  }

  onPermissionChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    const permissionIds = [...(this.roleForm.get('permissionIds')?.value as number[])]

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

    this.roleForm.get('permissionIds')?.setValue(permissionIds)
  }

  isPermissionSelected(id: number): boolean {
    const permissionIds = this.roleForm.get('permissionIds')?.value as number[]
    return permissionIds.includes(id)
  }

  getModuleIcon(resource: string): string {
    const r = resource.toLowerCase()
    if (r.includes('product')) return 'fas fa-box'
    if (r.includes('order')) return 'fas fa-shopping-cart'
    if (r.includes('customer')) return 'fas fa-users'
    if (r.includes('delivery') || r.includes('payment')) return 'fas fa-truck'
    if (r.includes('discount') || r.includes('coupon')) return 'fas fa-percent'
    if (r.includes('analytic') || r.includes('report')) return 'fas fa-chart-bar'
    if (r.includes('role') || r.includes('permission') || r.includes('admin')) return 'fas fa-user-shield'
    if (r.includes('setting')) return 'fas fa-cog'
    if (r.includes('log') || r.includes('audit')) return 'fas fa-file-alt'
    if (r.includes('system') || r.includes('superadmin')) return 'fas fa-crown'
    return 'fas fa-folder'
  }

  toggleGroup(index: number): void {
    this.filteredGroupedPermissions[index].expanded = !this.filteredGroupedPermissions[index].expanded
  }

  getSelectedCount(perms: PermissionDTO[]): number {
    const selectedIds = this.roleForm.get('permissionIds')?.value as number[]
    return perms.filter((p) => selectedIds.includes(p.id!)).length
  }

  selectGroupPermissions(perms: PermissionDTO[], select: boolean): void {
    const selectedIds = [...(this.roleForm.get('permissionIds')?.value as number[])]

    for (const p of perms) {
      if (select && !selectedIds.includes(p.id!)) {
        selectedIds.push(p.id!)
      } else if (!select && selectedIds.includes(p.id!)) {
        selectedIds.splice(selectedIds.indexOf(p.id!), 1)
      }
    }

    this.roleForm.get('permissionIds')?.setValue(selectedIds)
  }

  selectAll(): void {
    const allIds = this.allPermissions.map((p) => p.id!)
    this.roleForm.get('permissionIds')?.setValue(allIds)
  }

  clearAll(): void {
    this.roleForm.get('permissionIds')?.setValue([])
  }

  filterPermissions(): void {
    const term = this.searchTerm.toLowerCase().trim()

    if (!term) {
      this.filteredGroupedPermissions = [...this.groupedPermissions]
      return
    }

    this.filteredGroupedPermissions = this.groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.description?.toLowerCase().includes(term) ||
            p.code?.toLowerCase().includes(term) ||
            p.resource?.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }

  getSelectedPermissionsCount(): number {
    return (this.roleForm.get('permissionIds')?.value as number[]).length
  }

  getSelectedPermissions(): PermissionDTO[] {
    const selectedIds = this.roleForm.get('permissionIds')?.value as number[]
    return this.allPermissions.filter((p) => selectedIds.includes(p.id!))
  }

  submit(): void {
    if (this.roleForm.valid && !this.isSubmitting) {
      this.isSubmitting = true
      const val = this.roleForm.value

      const newRole: RoleDTO = {
        name: val.name,
        description: val.description,
        type: val.type,
        permissions: this.allPermissions.filter((p) => val.permissionIds.includes(p.id)),
      }

      this.roleService.createRole(newRole).subscribe({
        next: () => {
          alert('Role created successfully!')
          this.router.navigate(['/admin/role-list'])
        },
        error: (err) => {
          console.error('Create role failed', err)
          alert('Failed to create role.')
          this.isSubmitting = false
        },
      })
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/role-list'])
  }
}
