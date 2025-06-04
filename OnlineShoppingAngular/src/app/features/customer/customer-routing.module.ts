import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './general/home/home.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';

const routes: Routes = [  
<<<<<<< Updated upstream
  {
    path: 'home',
    component: HomeComponent,
=======
  { path: 'home', component: HomeComponent },
  { path: 'auth/verify/:id', component: VerifyComponent },

  {
    path: 'auth/register',
    component: RegisterComponent
  },
  {
    path: 'auth/login',
    component: LoginComponent
>>>>>>> Stashed changes
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
  
})
export class CustomerRoutingModule { }
