import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-verify',
  standalone: false,
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css'
})
export class VerifyComponent implements OnInit{

 otp: string[] = ['', '', '', '', '', ''];
  userId!: string;

  constructor(
    private otpService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.userId = id;
      } else {
        this.toastr.error('Missing user ID.');
        this.router.navigate(['/']);
      }
    });
  }

  isVerifying: boolean = false;
  moveFocus(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    if (value && index < 5) {
      const nextInput = input.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  otpCode: string = '';

  verifyOtp() {

     this.otpCode = this.otp.join('');
    if (this.otpCode.length !== 6) {
      this.toastr.warning('Please enter a 6-digit code.');
      return;
    }
 this.isVerifying = true; // disable button
    console.log("code : " + this.otpCode)
    console.log("userId : " + this.userId)
    this.otpService.verifyOtp(this.otpCode, this.userId).subscribe({
    next: (res: any) => {
      if (res.message.startsWith('Welcome')) {
        this.toastr.success(res.message); // ✅ show welcome
        this.router.navigate(['/customer/auth/login']); // ✅ go to login
      } else {
        this.toastr.warning(res.message);
         this.isVerifying = false; // enable button again
      }
    },
    error: (err: any) => {
     
      this.toastr.error(err.error?.message || 'Something went wrong, verify email again.');
    }
  });
  }

  resendOtp() {
  const userIdNumber = +this.userId;

  this.otpService.resendOtp(userIdNumber).subscribe({
    next: (res: any) => {
      // Save returned userId into a variable
      this.userId = res.userId;

      // Show clean toast message (not including userId)
      this.toastr.success('Check your email.');
    },
    error: (err: any) => {
      this.toastr.error(err.error?.message || 'Something went wrong, try again later.');
    }
  });
}

  
}
