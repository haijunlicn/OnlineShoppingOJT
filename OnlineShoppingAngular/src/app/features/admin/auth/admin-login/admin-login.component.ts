import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-login',
  standalone: false,
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
 loginForm: FormGroup
  error = ""
  isLoading = false

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    })
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true
      this.error = ""
      console.log("hello");
      

      // Simulate login process
      setTimeout(() => {
        this.isLoading = false
        // Add your login logic here
        console.log("Login attempt:", this.loginForm.value)
      }, 2000)
    }
  }
}
