import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { AuthService } from "../../../../core/services/auth.service"
import { AlertService } from "../../../../core/services/alert.service"
import { Router } from "@angular/router"

@Component({
  selector: "app-admin-login",
  standalone: false,
  templateUrl: "./admin-login.component.html",
  styleUrls: ["./admin-login.component.css"],
})
export class AdminLoginComponent {
  loginForm: FormGroup
  isSubmitted = false
  errorMessage = ""

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      rememberMe: [true],
    })
  }

  get email() {
    return this.loginForm.get("email")!
  }

  get password() {
    return this.loginForm.get("password")!
  }

  onSubmit() {
    this.isSubmitted = true

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched()
      return
    }

    const { email, password, rememberMe } = this.loginForm.value

    console.log("gonna call auth");
    this.auth.loginAdmin(email, password, rememberMe, 1).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']); // ✅ Now it works on first click
      },
      error: (err) => {
        this.errorMessage = "Invalid admin credentials";
      }
    });

  }

  resetForm() {
    this.loginForm.reset()
    this.isSubmitted = false
  }
}
