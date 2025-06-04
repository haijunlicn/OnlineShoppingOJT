import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OtpDTO } from '../models/otpDTO';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

 
  
  private apiUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

 
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
console.log(otpCode,userId)
  return this.http.post(`${this.apiUrl}/verify-otp`, otpDTO);
}

 resendOtp(userId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/resend`, {
    params: { userId: userId.toString() } 
  });
}


}
