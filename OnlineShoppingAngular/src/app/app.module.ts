import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './features/customer/auth/login/login.component';
import { RegisterComponent } from './features/customer/auth/register/register.component';
import { ResetPasswordComponent } from './features/customer/auth/reset-password/reset-password.component';
import { OtpVerifyComponent } from './features/customer/auth/otp-verify/otp-verify.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,
    OtpVerifyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
