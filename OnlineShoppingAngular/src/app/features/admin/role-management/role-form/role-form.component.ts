import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { PermissionDTO } from "@app/core/models/permissionDTO";
import { PermissionService } from "@app/core/services/permission.service";
import { RoleService } from "@app/core/services/role.service";


@Component({
  selector: 'app-role-form',
  standalone: false,
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  roleForm!: FormGroup;
  allPermissions: PermissionDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: [0, Validators.required], // 0 = customer, 1 = admin
      permissionIds: [[]] // array of selected permission IDs
    });

    this.loadPermissions();
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => (this.allPermissions = res),
      error: (err) => console.error('Error loading permissions', err)
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

  getCheckedValue(event: Event): boolean {
  return (event.target as HTMLInputElement)?.checked ?? false;
}


 submit(): void {
  if (this.roleForm.valid) {
    const formValue = this.roleForm.value;
    this.roleService.createRole({
      name: formValue.name,
      description: formValue.description,
      type: 1, // Always Admin
      permissions: this.allPermissions.filter(p => formValue.permissionIds.includes(p.id))
    }).subscribe({
      next: () => {
        alert('Role created successfully!');
        this.router.navigate(['/admin/role-list']); // ✅ Go to role list
      },
      error: (err) => console.error('Create role failed', err)
    });
  }
}


}
