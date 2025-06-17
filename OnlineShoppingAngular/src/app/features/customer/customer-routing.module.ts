import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './general/home/home.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgetPasswordComponent } from './auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { LocationCardComponent } from './account/location-card/location-card.component';
import { EditLocationComponent } from './account/edit-location/edit-location.component';
import { AboutComponent } from './general/about/about.component';
import { ContactComponent } from './general/contact/contact.component';
import { PrivacyPolicyComponent } from './policy/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './policy/terms-conditions/terms-conditions.component';
import { FaqComponent } from './policy/faq/faq.component';
import { UserproductListComponent } from './general/userproduct-list/userproduct-list.component';
import { WishlistComponent } from './general/wishlist/wishlist.component';
import { CartComponent } from './general/cart/cart.component';
import { ProductListComponent } from './product_display/product-list/product-list.component';
import { ProductDetailComponent } from './product_display/product-detail/product-detail.component';
import { NoAuthGuard } from '../../core/guards/no-auth.guard';
import { AuthGuard } from '../../core/guards/auth.guard';


const routes: Routes = [

  { path: 'home', component: HomeComponent },
  { path: 'general/home', component: HomeComponent },
  {
    path: 'auth/verify/:id',
    component: VerifyComponent,
    canActivate: [NoAuthGuard]
  },
  { path: 'general/home', component: HomeComponent },
  {
    path: 'auth/register',
    component: RegisterComponent,
  },
  {
    path: 'auth/login',
    component: LoginComponent,

  },
  {
    path: 'auth/forgetPass',
    component: ForgetPasswordComponent,
  },
  {path: 'about', component: AboutComponent, canActivate: [NoAuthGuard]},
  {path: 'contact' , component: ContactComponent, canActivate: [NoAuthGuard]},
  {path: 'policy/privacy', component: PrivacyPolicyComponent, canActivate: [NoAuthGuard]},
  {path: 'policy/terms-conditions', component: TermsConditionsComponent, canActivate: [NoAuthGuard]},
  {path: 'policy/faq', component: FaqComponent, canActivate: [NoAuthGuard]},
  // {
  //   path: 'customer/auth/verify/:id',
  //   component: VerifyComponent,canActivate: [NoAuthGuard],

  {
    path: 'auth/reset-password',
    component: ResetPasswordComponent
  },
  { path: 'location', component: LocationCreateComponent },
  { path: 'editlocation/:id', component: EditLocationComponent },
  { path: 'userproduct', component: UserproductListComponent },
  { path: 'address', component: LocationCardComponent },
  {
    path: 'general/wishlist', component: WishlistComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cart', component: CartComponent,
    canActivate: [AuthGuard]
  },
  { path: 'address', component: LocationCardComponent },
  {
    path: 'auth/reset-password',
    component: ResetPasswordComponent
  },
  { path: 'location', component: LocationCreateComponent },
  { path: 'editlocation/:id', component: EditLocationComponent },
  { path: 'address', component: LocationCardComponent },
  {
    path: 'productList',
    component: ProductListComponent,
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]

})
export class CustomerRoutingModule { }
