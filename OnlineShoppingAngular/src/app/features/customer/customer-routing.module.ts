import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './general/home/home.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { NoAuthGuard } from '../../core/guards/no-auth.guard';
import { ForgetPasswordComponent } from './auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { LocationCardComponent } from './account/location-card/location-card.component';
import { EditLocationComponent } from './account/edit-location/edit-location.component';
import { UserproductListComponent } from './general/userproduct-list/userproduct-list.component';
import { WishlistComponent } from './general/wishlist/wishlist.component';
import { CartComponent } from './general/cart/cart.component';

const routes: Routes = [  

  { path: 'home', component: HomeComponent },
  { path: 'auth/verify/:id', component: VerifyComponent ,canActivate: [NoAuthGuard]},

  {
    path: 'auth/register',
    component: RegisterComponent,canActivate: [NoAuthGuard],
  },
  {
    path: 'auth/login',
    component: LoginComponent,canActivate: [NoAuthGuard],

  },
  {
    path: 'auth/forgetPass',
    component: ForgetPasswordComponent,canActivate: [NoAuthGuard],

  },
 {
  path: 'auth/reset-password',
  component: ResetPasswordComponent
},
  {path:'location',component:LocationCreateComponent},
  { path: 'editlocation/:id', component: EditLocationComponent },
  {path:'userproduct',component:UserproductListComponent, canActivate: [NoAuthGuard]},
  {path:'address',component:LocationCardComponent, canActivate: [NoAuthGuard]},
  { path: 'general/wishlist', component: WishlistComponent, canActivate: [NoAuthGuard] },
  {path:'cart',component:CartComponent}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
  
})
export class CustomerRoutingModule { }
