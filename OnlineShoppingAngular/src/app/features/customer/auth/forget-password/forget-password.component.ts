import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';
import { LoginModalService } from '../../../../core/services/LoginModalService';

@Component({
  selector: 'app-forget-password',
  standalone: false,
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent {
  message = '';
  forgotForm: FormGroup;
  isLoading = false;
  isSuccessState = false;
  submittedEmail = '';
  isErrorMessage = false;

  constructor(
    private fbd: FormBuilder, 
    private authService: AuthService,
    private forgotModalService: ForgotPasswordModalService,
    private loginModService: LoginModalService
  ) {
    this.forgotForm = this.fbd.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotForm.get('email');
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.message = 'Please enter a valid email address.';
      this.isErrorMessage = true;
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isErrorMessage = false;

    const email = this.forgotForm.value.email!;
    this.authService.requestPasswordReset(email).subscribe({
      next: res => {
        this.isLoading = false;
        this.submittedEmail = email;
        this.isSuccessState = true;
        this.message = 'Reset link sent. Check your email.';
        this.isErrorMessage = false;
      },
      error: err => {
        this.isLoading = false;
        console.error('Reset error:', err);
        this.message = err.error?.message || 'Email not found or error occurred.';
        this.isErrorMessage = true;
      }
    });
  }

  closeModal() {
    this.resetForm();
    this.forgotModalService.hide();
  }

  backtologin() {
    this.resetForm();
    this.loginModService.show();
    this.forgotModalService.hide();
  }

  private resetForm() {
    this.forgotForm.reset();
    this.message = '';
    this.isLoading = false;
    this.isSuccessState = false;
    this.submittedEmail = '';
    this.isErrorMessage = false;
  }
}