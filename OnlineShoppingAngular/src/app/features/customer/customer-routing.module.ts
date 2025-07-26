import { Component, NgModule } from '@angular/core';
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
import { OrderManagementComponent } from './orderManagements/order-management/order-management.component';
import { PaymentAcceptComponent } from './orderManagements/payment-accept/payment-accept.component';
import { OrderDetailComponent } from './orderManagements/order-detail/order-detail.component';
import { OrderListComponent } from './orderManagements/order-list/order-list.component';
import { RefundRequestFormComponent } from './refundManagements/refund-request-form/refund-request-form.component';
import { AccountSettingsComponent } from './common/account-settings/account-settings.component';

import { NotificationListComponent } from './notification/notification-list/notification-list.component';
import { PaymentGuard } from '@app/core/services/payment-guard.service';
import { RefundEligibilityGuard } from '@app/core/guards/refund-eligibility.guard';
import { LocationSettingComponent } from './common/location-setting/location-setting.component';
import { NotiSettingComponent } from './common/noti-setting/noti-setting.component';
import { ProfileInfoSettingComponent } from './common/profile-info-setting/profile-info-setting.component';
import { VlogComponent } from './policy/vlog/vlog.component';
import { VlogListComponent } from './policy/vlog-list/vlog-list.component';
import { DiscountDetailComponent } from './product_display/discount-detail/discount-detail.component';

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
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'policy/privacy', component: PrivacyPolicyComponent },
  { path: 'policy/terms-conditions', component: TermsConditionsComponent },
  { path: 'policy/faq', component: FaqComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'policy/privacy', component: PrivacyPolicyComponent },
  { path: 'policy/terms-conditions', component: TermsConditionsComponent },
  { path: 'policy/faq', component: FaqComponent },
  // {
  //   path: 'customer/auth/verify/:id',
  //   component: VerifyComponent,canActivate: [NoAuthGuard],
  { path: 'account-settings', component: AccountSettingsComponent },

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
  },
  { path: 'order', component: OrderManagementComponent },
  {
    path: 'payment',
    component: PaymentAcceptComponent,
    canDeactivate: [PaymentGuard]
  },
  { path: 'orderDetail/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] },
  { path: 'order', component: OrderManagementComponent, canActivate: [AuthGuard] },
  {
    path: 'refundRequest/:orderId',
    component: RefundRequestFormComponent,
    canActivate: [AuthGuard, RefundEligibilityGuard]
  },
  { path: 'blog-list', component: VlogListComponent },

  { path: 'blog', component: VlogComponent },
  { path: 'notifications', component: NotificationListComponent, canActivate: [AuthGuard] },
  { path: 'account/settings/location', component: LocationSettingComponent, canActivate: [AuthGuard] },
  { path: 'account/settings/notifications', component: NotiSettingComponent, canActivate: [AuthGuard] },
  { path: 'account/settings/profile', component: ProfileInfoSettingComponent, canActivate: [AuthGuard] },
  {
    path: 'account-settings',
    component: AccountSettingsComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'location', component: LocationCardComponent },
      { path: 'profile', component: ProfileInfoSettingComponent },

    ]
  },
  {
    path: 'discount/:id',
    component: DiscountDetailComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  

})
export class CustomerRoutingModule { }
