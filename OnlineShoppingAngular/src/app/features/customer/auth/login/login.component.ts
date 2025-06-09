import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { AuthService } from "../../../../core/services/auth.service"
import { LoginModalService } from "../../../../core/services/LoginModalService"
import { RegisterModalService } from "../../../../core/services/RegisterModalService"
import { ForgotPasswordModalService } from "../../../../core/services/ForgotPasswordModalService"
import { AlertService } from "../../../../core/services/alert.service"

@Component({
  selector: "app-login",
  standalone: false,
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"], // ✅ fixed typo: styleUrl -> styleUrls
})
export class LoginComponent {
  loginForm: FormGroup
  isSubmitted = false

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private alertService: AlertService
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      rememberMe: [false],
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
    this.auth.login(email, password, rememberMe)
  }

  closeModal() {
    this.loginModalService.hide()
  }

  onRegister() {
    this.loginModalService.hide()
    this.registerModalService.show()
  }

  onforget() {
    this.loginModalService.hide()
    this.forgotModalService.show()
  }

  resetForm() {
    this.loginForm.reset()
    this.isSubmitted = false
  }
}
