import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionDTO } from '@app/core/models/permissionDTO';
import { PermissionService } from '@app/core/services/permission.service';

@Component({
  selector: 'app-permission-update',
  standalone: false,
  templateUrl: './permission-update.component.html',
  styleUrls: ['./permission-update.component.css']
})
export class PermissionUpdateComponent implements OnInit {
  permissionForm!: FormGroup;
  permissionId!: number;

  constructor(
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize form
    this.permissionForm = this.fb.group({
      code: ['', Validators.required],
      description: ['']
    });

    // Get permission id from route params
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.permissionId = +idParam;
        this.loadPermission(this.permissionId);
      }
    });
  }

  loadPermission(id: number): void {
    this.permissionService.getPermissionById(id).subscribe({
      next: (permission: PermissionDTO) => {
        this.permissionForm.patchValue(permission);
      },
      error: (err) => console.error('Failed to load permission', err)
    });
  }

  submit(): void {
    if (this.permissionForm.invalid) return;

    const updatedPermission: PermissionDTO = {
      id: this.permissionId,
      ...this.permissionForm.value
    };

    this.permissionService.updatePermission(this.permissionId, updatedPermission).subscribe({
      next: () => {
        alert('Permission updated successfully!');
        this.router.navigate(['/admin/permission-list']);
      },
      error: (err) => console.error('Update failed', err)
    });
  }
}
