import { Component } from '@angular/core';

import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
   standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthClass = '';

  constructor(
    private fb: FormBuilder,
    private registerService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.registerForm.get('password')?.valueChanges.subscribe((value) => {
      this.updatePasswordStrength(value);
    });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  updatePasswordStrength(password: string) {
    const lengthScore = password.length >= 8 ? 30 : 0;
    const upperScore = /[A-Z]/.test(password) ? 20 : 0;
    const lowerScore = /[a-z]/.test(password) ? 20 : 0;
    const numberScore = /[0-9]/.test(password) ? 15 : 0;
    const specialScore = /[!@#$%^&*]/.test(password) ? 15 : 0;

    this.passwordStrength = lengthScore + upperScore + lowerScore + numberScore + specialScore;

    if (this.passwordStrength < 40) {
      this.passwordStrengthClass = 'bg-danger';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthClass = 'bg-warning';
    } else {
      this.passwordStrengthClass = 'bg-success';
    }
  }

  
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // force validation messages to show
      this.toastr.error('Please fill all required fields correctly.');
      return;
    }

   this.registerService.register(this.registerForm.value).subscribe({
  next: (response: any) => {
    if (typeof response === 'string' && response.startsWith('Email sent successfully. User ID:')) {
      const id = response.split('User ID: ')[1].trim();
      this.toastr.success('Registration successful! Please check your email for verification.');
      this.router.navigate(['/customer/auth/verify', id]);
    } else {
      console.log('Registration failed:', response);
    }
  },
     error: (err) => {
  if (err.status === 409) {
    this.toastr.error('This email is already registered.');
    console.log(err);
  } else {
    console.log(err);
    this.toastr.error('Something went wrong. Please try again.');
  }
}
    });
  }
}
