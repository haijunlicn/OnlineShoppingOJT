
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VerifyComponent } from './features/customer/auth/verify/verify.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ForgetPasswordComponent } from './features/customer/auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './features/customer/auth/reset-password/reset-password.component';

@NgModule({
  declarations: [
   AppComponent,
   
  
  ],
  imports: [
   BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    // ReactiveFormsModule,
      BrowserAnimationsModule, // required animations module
    ReactiveFormsModule,
   ToastrModule.forRoot({
    
  positionClass: 'toast-bottom-right', // 👈 ညာဘက်အောက်
  toastClass: 'ngx-toastr toast-custom', // 👈 custom class များသုံးဖို့
 // ✅ Custom class
      timeOut: 3000,                         // Optional: 3 seconds
      closeButton: true,
      progressBar: true,
    }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
    
  ],
  providers: [
    provideClientHydration(withEventReplay()),
     {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

