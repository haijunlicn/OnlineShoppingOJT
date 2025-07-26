import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAccountService } from '@app/core/services/admin-account.service';
import { AlertService } from '@app/core/services/alert.service';
import { RoleService } from '@app/core/services/role.service';


@Component({
  selector: 'app-admin-account-create',
  standalone: false,
  templateUrl: './admin-account-create.component.html',
  styleUrl: './admin-account-create.component.css'
})

export class AdminAccountCreateComponent implements OnInit {
  accountForm!: FormGroup;
  roles: any[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private accountService: AdminAccountService,
    private router: Router,
    private alert: AlertService
  ) { }

  ngOnInit(): void {
    this.accountForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: [null, Validators.required]
    });

    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: roles => {
        this.roles = roles.filter((r: any) => r.type === 1); // only admin roles
      },
      error: err => {
        this.alert.error('Failed to load roles');
      }
    });
  }

  submit(): void {
    if (this.accountForm.invalid) return;
    this.isSubmitting = true;

    this.accountService.createAccount(this.accountForm.value).subscribe({
      next: (response) => {
        this.alert.toast('Admin account created successfully!', 'success');
        this.router.navigate(['/admin/account/list']);
      },
      error: err => {
        console.error('Raw error:', err);
        let message = 'Failed to create account';
        
        if (err.status === 200 && err.error) {
          // Server returned success but with text response
          message = err.error;
        } else if (err.error?.message) {
          message = err.error.message;
        } else if (err.message) {
          message = err.message;
        }
        
        this.alert.error(message);
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/account/list'])
  }
}
