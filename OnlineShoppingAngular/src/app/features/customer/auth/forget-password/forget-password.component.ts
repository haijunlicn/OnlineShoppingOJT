import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forget-password',
  standalone: false,
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent {
  message = '';
  forgotForm: FormGroup;

  constructor(private fbd: FormBuilder, private authService: AuthService) {
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
      return;
    }

    const email = this.forgotForm.value.email!;
    this.authService.requestPasswordReset(email).subscribe({
      next: res => {
        this.message = 'Reset link sent. Check your email.';
      },
      error: err => {
        console.error('Reset error:', err);
        this.message = err.error?.message || 'Email not found or error occurred.';
      }
    });
  }
}
