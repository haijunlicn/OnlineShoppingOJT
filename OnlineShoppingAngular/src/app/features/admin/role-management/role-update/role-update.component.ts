import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { RoleDTO } from "@app/core/models/roleDTO";
import { PermissionService } from "@app/core/services/permission.service";
import { RoleService } from "@app/core/services/role.service";


@Component({
  selector: 'app-role-update',
  standalone: false,
  templateUrl: './role-update.component.html',
  styleUrls: ['./role-update.component.css']
})
export class RoleUpdateComponent implements OnInit {
  roleForm!: FormGroup;
  roleId!: number;
  allPermissions: PermissionDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roleId = +this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadPermissions();
    this.loadRole();
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: [0, Validators.required],
      permissionIds: [[]]
    });
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => (this.allPermissions = res),
      error: (err) => console.error(err)
    });
  }
  getCheckedValue(event: Event): boolean {
  return (event.target as HTMLInputElement)?.checked ?? false;
}


  loadRole(): void {
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (role: RoleDTO) => {
        const selectedIds = role.permissions?.map(p => p.id!) || [];
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          type: role.type,
          permissionIds: selectedIds
        });
      },
      error: (err) => console.error(err)
    });
  }

  onPermissionChange(id: number, checked: boolean): void {
    const permissionIds = this.roleForm.get('permissionIds')?.value as number[];
    if (checked) {
      permissionIds.push(id);
    } else {
      const index = permissionIds.indexOf(id);
      if (index !== -1) {
        permissionIds.splice(index, 1);
      }
    }
    this.roleForm.get('permissionIds')?.setValue(permissionIds);
  }

  submit(): void {
    if (this.roleForm.valid) {
      const formVal = this.roleForm.value;
      const updatedRole: RoleDTO = {
        id: this.roleId,
        name: formVal.name,
        description: formVal.description,
        type: formVal.type,
        permissions: this.allPermissions.filter(p => formVal.permissionIds.includes(p.id))
      };

      this.roleService.updateRole(updatedRole).subscribe({
        next: () => alert('Role updated successfully!'),
        error: (err) => console.error(err)
      });
    }
  }
}
