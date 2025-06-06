import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { LoginComponent } from './auth/login/login.component';


import { HomeComponent } from './general/home/home.component';
import { HeaderComponent } from './common/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { RegisterComponent } from './auth/register/register.component';
import { RouterModule } from '@angular/router';
import { ForgetPasswordComponent } from './auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { VerifyComponent } from './auth/verify/verify.component';
=======
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { HttpClientModule } from '@angular/common/http';
>>>>>>> Stashed changes
=======
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { HttpClientModule } from '@angular/common/http';
>>>>>>> Stashed changes
=======
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { HttpClientModule } from '@angular/common/http';
>>>>>>> Stashed changes



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    HeaderComponent,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    ForgetPasswordComponent,
    ResetPasswordComponent,
    VerifyComponent

=======
    LocationCreateComponent,
>>>>>>> Stashed changes
=======
    LocationCreateComponent,
>>>>>>> Stashed changes
=======
    LocationCreateComponent,
>>>>>>> Stashed changes

  ],
  imports: [
    CommonModule,
    CustomerRoutingModule,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    FormsModule,
    ReactiveFormsModule,

=======
    ReactiveFormsModule,
    FormsModule,
   HttpClientModule
>>>>>>> Stashed changes
=======
    ReactiveFormsModule,
    FormsModule,
   HttpClientModule
>>>>>>> Stashed changes
=======
    ReactiveFormsModule,
    FormsModule,
   HttpClientModule
>>>>>>> Stashed changes

  ]
})
export class CustomerModule { }
