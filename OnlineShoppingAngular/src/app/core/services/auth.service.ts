import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OtpDTO } from '../models/otpDTO';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {



  private apiUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient, private router: Router) { }


  register(userData: any): Observable<string> {

    return this.http.post('http://localhost:8080/auth/register', userData, { responseType: 'text' });
  }


  //  verifyOtp(code: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/verify`, { otp: code });
  // }
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
    return this.http.post<{ token: string }>(
      `http://localhost:8080/auth/login`,
      { email, password, rememberMe }
    ).subscribe({
      next: res => {
        const token = res.token;

        if (rememberMe) {
          localStorage.setItem('token', token);
        } else {
          sessionStorage.setItem('token', token);
        }
        console.log("login success");
        this.router.navigate(['/customer/general/home']);
      },
      error: err => {
        // backend က status ကိုစစ်
        if (err.status === 401) {
          // backend မှာ "message" key ပါလာမယ် map ထဲက
          console.error('Unauthorized:', err.error.message);
        } else if (err.status === 404) {
          console.error('Not Found:', err.error.message);
        } else if (err.status === 500) {
          console.error('Not Found:', err.error.message);
        }
        else {
          console.error('Other error:', err.error?.message || err.message || err);
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

  //  requestPasswordReset(email: string) {
  //   return this.http.post(`${this.apiUrl}/forgot-password` , { email });
  // }

  requestPasswordReset(email: string) {
    return this.http.post(
      `${this.apiUrl}/forgot-password`,
      { email },
      { responseType: 'text' as 'json' }  // TypeScript ကထပ်ပြောအောင် 'as' ထည့်တယ်
    );
  }


  resetPassword(token: string, password: string) {
    return this.http.post('http://localhost:8080/auth/reset-password', { token, password });
  }

}
