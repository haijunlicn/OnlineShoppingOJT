import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { LoginComponent } from './auth/login/login.component';


import { HomeComponent } from './general/home/home.component';
import { HeaderComponent } from './common/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './auth/register/register.component';



@NgModule({
  declarations: [
    LoginComponent,
   RegisterComponent,
    HomeComponent,
    HeaderComponent,
   
  ],
  imports: [
    CommonModule,
    CustomerRoutingModule,
    FormsModule,
    ReactiveFormsModule, 
    
  ]
})
export class CustomerModule { }
