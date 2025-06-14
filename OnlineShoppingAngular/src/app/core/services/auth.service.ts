import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OtpDTO } from '../models/otpDTO';
import { Router } from '@angular/router';
import { LoginModalService } from './LoginModalService';
import { RegisterModalService } from './RegisterModalService';
import { AlertService } from './alert.service';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

 
   
  private apiUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient,
    private router: Router, 
     private loginModalService: LoginModalService,
      private registerModalService: RegisterModalService,
      private alertService :AlertService,
  ) {}

 

register(userData: any): Observable<any> {
  console.log("I'm register");
  return this.http.post<any>('http://localhost:8080/auth/register', userData);
}


  verifyOtp(otpCode: string, userId: string): Observable<any> {
    const otpDTO: OtpDTO = {
      otpCode: otpCode,
      userId: +userId, // make sure it's a number
      purpose: 'EMAIL_VERIFICATION',
      isUsed: false // required by backend
    };
    console.log(otpCode, userId)
    return this.http.post(`${this.apiUrl}/verify-otp`, otpDTO);
  }

  resendOtp(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/resend`, {
      params: { userId: userId.toString() }
    });
  }

login(email: string, password: string, rememberMe: boolean) {
  this.http.post<any>('http://localhost:8080/auth/login', { email, password, rememberMe })
    .subscribe({
      next: (res) => {
        if (res.token) {
          // ✅ Login Success
          const token = res.token;
          if (rememberMe) {
            localStorage.setItem('token', token);
          } else {
            sessionStorage.setItem('token', token);
          }

          this.alertService.success("Login Success");
          this.loginModalService.hide();
          this.registerModalService.hide();
          this.router.navigate(['/customer/general/home']);
        } else if (res.message) {
          console.error("Server error:", res.message);
          this.alertService.error(res.message);
        }
      },
      error: (err) => {
        const message = err.error?.message || 'An unknown error occurred.';

        // ✅ Email not verified
        if (message === 'Email is not verified.') {
          const id = err.error?.id;

          Swal.fire({
            icon: 'error',
            title: 'Email not verified!',
            text: 'Want to verify your email now?',
            showCancelButton: true,
            confirmButtonText: 'Yes, verify now',
            cancelButtonText: 'No',
          } 
        ).then((result) => {
            console.log("id : " + id + ", isConfirmed : " + result.isConfirmed);

            if (result.isConfirmed && id) {
              // ⏩ Call resend OTP API
              this.http.get<any>(`http://localhost:8080/auth/resend?userId=${id}`)
                .subscribe({
                  next: (res) => {
                    Swal.fire({
                      icon: 'success',
                      title: 'OTP Sent!',
                      text: res.message || 'OTP has been resent to your email.',
                    }).then(() => {
                      // Navigate after showing confirmation
                      this.router.navigate(['/customer/auth/verify', id]);
                    });
                  },
                  error: (resendErr) => {
                    Swal.fire({
                      icon: 'error',
                      title: 'Failed to resend OTP',
                      text: resendErr.error?.message || 'Please try again later.',
                    });
                  }
                });
            }
          });

        } else {
          // 🚫 Other login failure
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: message
          });
        }
      }
    });
}



  logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.router.navigate(['/customer/auth/login']);
  }
  
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }


  isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }


requestPasswordReset(email: string) {
 
  return this.http.post(
    `${this.apiUrl}/forgot-password`,
    { email },
    { responseType: 'text' as 'json' }  
  );
}


// resetPassword(token: string, password: string) {
//   return this.http.post('http://localhost:8080/auth/reset-password', { token, password });
// }

resetPassword(token: string, password: string) {
  return this.http.post('http://localhost:8080/auth/reset-password', { token, password },  { responseType: 'text' as 'json' });
}
}
