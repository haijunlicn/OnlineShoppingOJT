import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { AuthService } from "../../../../core/services/auth.service"
import { LoginModalService } from "../../../../core/services/LoginModalService"
import { RegisterModalService } from "../../../../core/services/RegisterModalService"
import { ForgotPasswordModalService } from "../../../../core/services/ForgotPasswordModalService"
import { AlertService } from "../../../../core/services/alert.service"
import Swal from "sweetalert2"
import { Router } from "@angular/router"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

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
    private http: HttpClient,
    private router: Router,
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
    this.isSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    this.auth.login(email, password, rememberMe, 0).subscribe({
      next: (user) => {
        this.alertService.toast("Login Successful", "success");
        this.loginModalService.hide();
        this.registerModalService.hide();
      },
      error: async (err) => {
        const message = err.error?.message || err.message || 'An unknown error occurred.';

        if (message === 'Email is not verified.') {
          const id = err.error?.id;

          if (!id) {
            this.alertService.toast('User ID missing for OTP resend.', 'error');
            return;
          }

          const wantsToVerify = await this.alertService.emailNotVerifiedToast();

          if (wantsToVerify) {
            this.auth.resendOtp(id).subscribe({
              next: (res) => {
                this.alertService.toast(res.message || 'OTP has been resent to your email.', 'success');
              },
              error: (resendErr) => {
                this.alertService.toast(
                  resendErr.error?.message || 'Failed to resend OTP. Please try again later.',
                  'error'
                );
              }
            });

            // Navigate immediately without waiting for API response
            this.router.navigate(['/customer/auth/verify', id]);
          }

        } else {
          this.alertService.toast(message, 'error');
        }
      }
    });
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
