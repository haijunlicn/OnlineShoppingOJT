import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VerifyComponent } from './features/customer/auth/verify/verify.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ForgetPasswordComponent } from './features/customer/auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './features/customer/auth/reset-password/reset-password.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { ToastrModule } from 'ngx-toastr';
import { AuthService } from './core/services/auth.service';
import { initializeAuth } from './core/init/auth-init.factory';


@NgModule({
  declarations: [
    AppComponent,

  
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    GoogleMapsModule,

  ],
  providers: [
    provideClientHydration(withEventReplay()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    }
  ],
  
  bootstrap: [AppComponent]
})
export class AppModule { }

