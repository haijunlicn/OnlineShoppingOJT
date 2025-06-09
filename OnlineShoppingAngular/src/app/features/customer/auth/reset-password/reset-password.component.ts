import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {

  message = '';
  token = '';
  resetForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';

    this.resetForm = this.fb.group({
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.message = 'Password is required.';
      return;
    }

    const password = this.resetForm.value.password!;
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => this.message = "Password successfully reset.",
      error: () => this.message = "Invalid or expired token."
    });
  }
}
