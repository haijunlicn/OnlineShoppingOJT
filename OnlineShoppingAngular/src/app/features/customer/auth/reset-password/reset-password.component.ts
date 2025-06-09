import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginModalService } from '../../../../core/services/LoginModalService';

import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  message = '';
  token = '';
  resetForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  isSuccessMessage = false;
  isSubmitted = false;
  passwordStrength = 0;
  passwordStrengthClass = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private loginModalService: LoginModalService,
    private sweetalt:AlertService,
     private registerModalService: RegisterModalService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.resetForm.get('password')?.valueChanges.subscribe((password) => {
      this.updatePasswordStrength(password);
    });
  }

  updatePasswordStrength(password: string): void {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    this.passwordStrength = (strength / 4) * 100;

    if (this.passwordStrength < 50) {
      this.passwordStrengthClass = 'weak';
    } else if (this.passwordStrength < 75) {
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrengthClass = 'strong';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.message = 'Password is required.';
      this.isSuccessMessage = false;
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isSubmitted = true;

    const password = this.resetForm.value.password!;
    this.authService.resetPassword(this.token, password).subscribe({
      next: (res) => {
        console.log('Password reset success:', res);
        // this.message = 'Password successfully reset.';
        this.sweetalt.success("Passwrod successfully reset")
        this.isSuccessMessage = true;
        this.isLoading = false;
        this.router.navigate(['/customer/general/home']);
        this.loginModalService.show()
        this.registerModalService.hide()
      },
      error: (err) => {
        console.error('Password reset failed:', err);
        // this.message = 'Invalid or expired token.';
        this.sweetalt.error("Invalid or expired token")
        this.isSuccessMessage = false;
        this.isLoading = false;
      },
    });
  }

  onSignIn(): void {
    this.loginModalService.show();
  }
}
