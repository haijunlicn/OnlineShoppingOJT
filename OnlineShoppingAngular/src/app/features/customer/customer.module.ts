import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerRoutingModule } from './customer-routing.module';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './general/home/home.component';
import { HeaderComponent } from './common/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './auth/register/register.component';
import { RouterModule } from '@angular/router';
import { CountdownModule } from 'ngx-countdown';
import { ForgetPasswordComponent } from './auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { HttpClientModule } from '@angular/common/http';
import { EditLocationComponent } from './account/edit-location/edit-location.component';
import { AboutComponent } from './general/about/about.component';
import { ContactComponent } from './general/contact/contact.component';
import { PrivacyPolicyComponent } from './policy/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './policy/terms-conditions/terms-conditions.component';
import { FaqComponent } from './policy/faq/faq.component';
import { UserproductListComponent } from './general/userproduct-list/userproduct-list.component';
import { WishlistDialogComponent } from './general/wishlist-dialog/wishlist-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { WishlistComponent } from './general/wishlist/wishlist.component';
import { CartComponent } from './general/cart/cart.component';
import { ProductListComponent } from './product_display/product-list/product-list.component';
import { ProductDetailComponent } from './product_display/product-detail/product-detail.component';
import { CategoryGridComponent } from './product_display/category-grid/category-grid.component';
import { CategoryDropdownComponent } from './product_display/category-dropdown/category-dropdown.component';
import { FilterSidebarComponent } from './common/filter-sidebar/filter-sidebar.component';
import { OrderComponent } from './general/order/order.component';
import { OrderManagementComponent } from './orderManagements/order-management/order-management.component';
import { PaymentAcceptComponent } from './orderManagements/payment-accept/payment-accept.component';
import { OrderDetailComponent } from './orderManagements/order-detail/order-detail.component';
import { OrderListComponent } from './orderManagements/order-list/order-list.component';
import { FileUploadComponent } from './refundManagements/file-upload/file-upload.component';
import { RefundRequestFormComponent } from './refundManagements/refund-request-form/refund-request-form.component';
import { AccountSettingsComponent } from './common/account-settings/account-settings.component';
import { NotificationBellComponent } from './notification/notification-bell/notification-bell.component';
import { SearchBarComponent } from './common/search-bar/search-bar.component';
import { LocationCardComponent } from './account/location-card/location-card.component';
import { NotificationDetailComponent } from './notification/notification-detail/notification-detail.component';
import { NotificationListComponent } from './notification/notification-list/notification-list.component';
import { LocationSettingComponent } from './common/location-setting/location-setting.component';
import { ProfileInfoSettingComponent } from './common/profile-info-setting/profile-info-setting.component';
import { NotiSettingComponent } from './common/noti-setting/noti-setting.component';

import { VlogComponent } from './policy/vlog/vlog.component';
import { VlogListComponent } from './policy/vlog-list/vlog-list.component';
import { DiscountDisplayComponent } from './product_display/discount-display/discount-display.component';
import { StickyDiscountProgressComponent } from './product_display/sticky-discount-progress/sticky-discount-progress.component';
import { DiscountConditionDisplayComponent } from './product_display/discount-condition-display/discount-condition-display.component';
import { ProductqandaComponent } from './product_display/productqanda/productqanda.component';
import { VlogCommentComponent } from './policy/vlog-comment/vlog-comment.component';

import { DiscountHeroCarouselComponent } from './product_display/discount-hero-carousel/discount-hero-carousel.component';
import { DiscountDetailComponent } from './product_display/discount-detail/discount-detail.component';
import { DiscountDisplayForHomeComponent } from './product_display/discount-display-for-home/discount-display-for-home.component';
import { CustomerGroupDetailComponent } from './product_display/customer-group-detail/customer-group-detail.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    HeaderComponent,
    ForgetPasswordComponent,
    ResetPasswordComponent,
    VerifyComponent,
    LocationCreateComponent,
    EditLocationComponent,
    WishlistDialogComponent,
    UserproductListComponent,
    WishlistComponent,
    CartComponent,
    AboutComponent,
    ContactComponent,
    PrivacyPolicyComponent,
    TermsConditionsComponent,
    FaqComponent,
    ProductListComponent,
    ProductDetailComponent,
    CategoryGridComponent,
    CategoryDropdownComponent,
    FilterSidebarComponent,
    OrderComponent,
    OrderManagementComponent,
    PaymentAcceptComponent,
    OrderDetailComponent,
    OrderListComponent,
    OrderListComponent,
    FileUploadComponent,
    RefundRequestFormComponent,
    AccountSettingsComponent,
    NotificationBellComponent,
    NotificationListComponent,
    SearchBarComponent,
    LocationCardComponent,
    NotificationDetailComponent,
    NotificationListComponent,
    LocationSettingComponent,
    ProfileInfoSettingComponent,
    NotiSettingComponent,
    ProductqandaComponent,

  VlogCommentComponent,
    VlogComponent,
    VlogListComponent,
    DiscountDisplayComponent,
    StickyDiscountProgressComponent,
    DiscountConditionDisplayComponent,
    ProductqandaComponent,
    DiscountHeroCarouselComponent,
    DiscountDetailComponent,
    DiscountDisplayForHomeComponent,
    CustomerGroupDetailComponent
  ],
  imports: [
    CommonModule,
    CustomerRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatDialogModule,
    MatDialogModule,
    MatListModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    HttpClientModule,
    CountdownModule,
  ]
})
export class CustomerModule { }
