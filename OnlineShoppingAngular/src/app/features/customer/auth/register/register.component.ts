

import { Component,  OnInit } from "@angular/core"
import {
   FormBuilder,
   FormGroup,
  Validators,
   AbstractControl,
   ValidationErrors,
} from "@angular/forms"
import  { AuthService } from "../../../../core/services/auth.service"
import  { Router } from "@angular/router"
import  { LoginModalService } from "../../../../core/services/LoginModalService"
import  { RegisterModalService } from "../../../../core/services/RegisterModalService"
import  { ForgotPasswordModalService } from "../../../../core/services/ForgotPasswordModalService"
import Swal from 'sweetalert2';
import { AlertService } from "../../../../core/services/alert.service"

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  standalone: false,
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup
  isSubmitted = false
  showPassword = false
  showConfirmPassword = false
  passwordStrength = 0
  passwordStrengthClass = ""
  isLoading = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private router: Router,
    private sweetalt : AlertService,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        name: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", Validators.required],
        confirmPassword: ["", Validators.required],
      },
      {
        validators: [this.passwordMatchValidator],
      },
    )

    this.registerForm.get("password")?.valueChanges.subscribe((password) => {
      this.updatePasswordStrength(password)
    })
  }

  passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get("password")?.value
    const confirmPassword = formGroup.get("confirmPassword")?.value
    return password === confirmPassword ? null : { passwordMismatch: true }
  }

  updatePasswordStrength(password: string): void {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    this.passwordStrength = (strength / 4) * 100

    if (this.passwordStrength < 50) {
      this.passwordStrengthClass = "weak"
    } else if (this.passwordStrength < 75) {
      this.passwordStrengthClass = "medium"
    } else {
      this.passwordStrengthClass = "strong"
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword
  }

  resetForm(): void {
    this.registerForm.reset()
    this.isSubmitted = false
    this.passwordStrength = 0
    this.passwordStrengthClass = ""
  }

  onSubmit(): void {
    this.isSubmitted = true

    if (this.registerForm.invalid) {
      return
    }

    this.isLoading = true
    const { name, email, password } = this.registerForm.value
    const userData = { name, email, password }

  //   this.authService.register(userData).subscribe({
  //     next: (response: any) => {
  //       console.log("hi response of register")
  //       if (typeof response === "string" && response.startsWith("Email sent successfully. User ID:")) {
  //         const id = response.split("User ID: ")[1].trim()
  //      this.sweetalt.success("check your email for varification!")
  //         this.router.navigate(["/customer/auth/verify", id])
  //       } else {
  //         console.log("Registration failed:", response)
  //         this.sweetalt.error("Registration failed")
  //         this.isLoading = false;
  //       }
  //     },
  //     error: (err) => {
       
  //       if (err.status === 500 || err.status===409) {
  //         // this.toastr.error("This email is already registered.")
  //       this.sweetalt.error("email already exist!")
  //         this.isLoading = false;
  //         console.log(err)
  //       } else {
  //         console.log(err)
  //         this.sweetalt.error("something went wrong!Try again")
  //         this.isLoading = false;
  //       }
  //     },
  //     complete: () => {
  //       this.isLoading = false
  //     },
  //   })
  this.authService.register(userData).subscribe({
  next: (response: any) => {
    console.log("hi response of register");

    if (response?.message === "Email sent successfully.") {
      const id = response.userId;
      this.sweetalt.success(response.message);
      this.router.navigate(["/customer/auth/verify", id]);
    } else {
      console.log("Registration failed:", response);
      this.sweetalt.error(response.message || "Registration failed");
      this.isLoading = false;
    }
  },
  error: (err) => {
    const errorMessage = err.error?.message || err.error || "Something went wrong! Try again";

    this.sweetalt.error(errorMessage);
    console.log(err);
    this.isLoading = false;
  },
  complete: () => {
    this.isLoading = false;
  },
});

   }

  closeModal(): void {
    this.registerModalService.hide()
  }

  onSignIn(): void {
    this.registerModalService.hide()
    this.loginModalService.show()
  }
}
