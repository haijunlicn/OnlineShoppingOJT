import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { OtpVeficationComponent } from './auth/otp-vefication/otp-vefication.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { HomeComponent } from './general/home/home.component';
import { HeaderComponent } from './common/header/header.component';


@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    OtpVeficationComponent,
    ResetPasswordComponent,
    HomeComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    CustomerRoutingModule
  ]
})
export class CustomerModule { }
