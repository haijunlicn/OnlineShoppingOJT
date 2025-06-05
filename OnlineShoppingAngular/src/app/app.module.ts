
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
<<<<<<< Updated upstream
import { VerifyComponent } from './features/customer/auth/verify/verify.component';
import { TableModule } from 'primeng/table';

=======
import { TableModule } from 'primeng/table';
import { HttpClientModule } from '@angular/common/http';
>>>>>>> Stashed changes

@NgModule({
  declarations: [
    AppComponent,
    VerifyComponent,



  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    FormsModule,
<<<<<<< Updated upstream
    // ReactiveFormsModule,
    BrowserAnimationsModule, // required animations module

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
    HttpClientModule,
=======
>>>>>>> Stashed changes
    TableModule
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

