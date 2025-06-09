import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import Swal from 'sweetalert2';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-verify',
  standalone: false,
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css'
})
export class VerifyComponent implements OnInit {

  otp: string[] = ['', '', '', '', '', ''];
  userId!: string;
  isVerifying: boolean = false;
  otpCode: string = '';

  constructor(
    private otpService: AuthService,
    private sweetalt : AlertService,
    private router: Router,
    private route: ActivatedRoute,
     private loginModalService: LoginModalService,
      private registerModalService: RegisterModalService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.userId = id;
      } else {
        // this.toastr.error('Missing user ID.');
        this.sweetalt.error("Missing user ID")
        this.router.navigate(['/']);
      }
    });
  }

  moveFocus(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    if (value && index < 5) {
      const nextInput = input.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  handleBackspace(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.otp[index - 1] = '';
      }
    }
  }

  verifyOtp() {
    this.otpCode = this.otp.join('');
    if (this.otpCode.length !== 6) {
      // this.toastr.warning('Please enter a 6-digit code.');
      this.sweetalt.warning("Please enter a 6-digit code");
      return;
    }

    this.isVerifying = true;
    console.log(this.otpCode)
    console.log(this.userId)

    this.otpService.verifyOtp(this.otpCode, this.userId).subscribe({
      next: (res: any) => {
        if (res.message.startsWith('Welcome')) {
          // this.toastr.success(res.message);
          this.sweetalt.success(res.message);
          this.router.navigate(['/customer/general/home']);
            this.loginModalService.show()
            this.registerModalService.hide()
        } else {
          // this.toastr.warning();
          this.sweetalt.warning(res.message)
      

          this.isVerifying = false;
        }
      },
      error: (err: any) => {
       // this.toastr.error();
        this.sweetalt.error(err.error?.message || 'Something went wrong, verify email again.')
        this.isVerifying = false;
      }
    });
  }

  resendOtp() {
    const userIdNumber = +this.userId;

    this.otpService.resendOtp(userIdNumber).subscribe({
      next: (res: any) => {
        this.userId = res.userId;
       // this.toastr.success('Check your email.');
        this.sweetalt.success("Check your email")
      },
      error: (err: any) => {
       // this.toastr.error();
        this.sweetalt.error(err.error?.message || 'Something went wrong, try again later.')
      }
    });
  }
}
