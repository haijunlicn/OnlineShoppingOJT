import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { OtpDTO } from '../models/otpDTO';
import { Router } from '@angular/router';
import { LoginModalService } from './LoginModalService';
import { RegisterModalService } from './RegisterModalService';
import { AlertService } from './alert.service';
import Swal from 'sweetalert2';
import { User } from '../models/User';
import { jwtDecode } from 'jwt-decode';
import { StorageService } from './StorageService';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private alertService: AlertService,
    private storageService: StorageService
  ) { }

  // Create BehaviorSubject to hold user object (initially null)
  private userSubject = new BehaviorSubject<User | null>(null);

  // Expose it as an observable (readonly to outside)
  public user$: Observable<User | null> = this.userSubject.asObservable();

  public isLoggedIn$: Observable<boolean> = this.user$.pipe(
    map(user => !!user)
  );

  public isCustomer$: Observable<boolean> = this.user$.pipe(
    map(user => !!user && user.roleName === 'CUSTOMER')
  );

  initializeUserFromToken(): void {
    const token = this.storageService.getItem('token');
    if (token && !this.isTokenExpired(token)) {
      const decoded: any = jwtDecode(token);
      const email = decoded.sub;
      const roleType = decoded.roleType; // 👈 Make sure your backend encodes this into the token
      console.log("roletype : " , decoded.roleType); // will show 0 or 1

      if (email && roleType !== undefined) {
        this.getCurrentUserByEmailAndRoleType(email, roleType).subscribe({
          next: () => {
            // No need to handle, userSubject is already set inside the method
          },
          error: () => {
            this.userSubject.next(null);
            this.storageService.removeItem('token');
          }
        });
      } else {
        this.userSubject.next(null);
        this.storageService.removeItem('token');
      }
    } else {
      this.userSubject.next(null);
    }
  }



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

  login(email: string, password: string, rememberMe: boolean, roleType: number): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password, rememberMe, roleType }).pipe(
      switchMap((res) => {
        if (!res.token) throw new Error(res.message || 'Login failed');

        const token = res.token;
        const decodedToken: any = jwtDecode(token);
        const email = decodedToken.sub;

        this.storageService.setItem('token', token, rememberMe ? 'local' : 'session');

        return this.getCurrentUserByEmailAndRoleType(email, 0); // return user observable
      })
    );
  }

  getCurrentUserByEmailAndRoleType(email: string, roleType: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me?email=${email}&roleType=${roleType}`).pipe(
      map((res: any) => {
        const user: User = {
          id: res.id,
          email: res.email,
          name: res.name,
          phone: res.phone,
          roleName: res.roleName,
          isVerified: res.isVerified,
          delFg: res.delFg,
          createdDate: res.createdDate,
          updatedDate: res.updatedDate
        };
        return user;
      }),
      tap((user: User) => {
        this.userSubject.next(user);
      })
    );
  }


  logout() {
    this.storageService.removeItem('token');
    this.userSubject.next(null);
    this.router.navigate(['/customer/auth/login']);
  }

  // Optional: get current user snapshot
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  isLoggedIn(): boolean {
    const token = this.storageService.getItem('token');
    return !!token && !this.isTokenExpired(token);
  }

  isCustomer(): boolean {
    const user = this.userSubject.getValue();
    return !!user && user.roleName === 'customer';
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

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password }, { responseType: 'text' as 'json' });
  }

  loginAdmin(email: string, password: string, rememberMe: boolean, roleType: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password, rememberMe, roleType }).pipe(
      switchMap((res) => {
        if (!res.token) {
          throw new Error(res.message || 'Login failed');
        }

        const token = res.token;

        if (rememberMe) {
          this.storageService.setItem('token', token, 'local');
        } else {
          this.storageService.setItem('token', token, 'session');
        }

        const decodedToken: any = jwtDecode(token);
        const userEmail = decodedToken.sub;

        // ✅ Wait for user fetch to complete
        return this.getCurrentUserByEmailAndRoleType(userEmail, 1);
      }),
      catchError((error) => throwError(() => error))
    );
  }


}
