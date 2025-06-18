import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { LoginComponent } from './auth/login/login.component';


import { HomeComponent } from './general/home/home.component';
import { HeaderComponent } from './common/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './auth/register/register.component';
import { RouterModule } from '@angular/router';
import { ForgetPasswordComponent } from './auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { LocationCreateComponent } from './account/location-create/location-create.component';
import { HttpClientModule } from '@angular/common/http';
import { LocationCardComponent } from './account/location-card/location-card.component';
import { EditLocationComponent } from './account/edit-location/edit-location.component';
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
import { OrderComponent } from './general/order/order.component';
import { OrderManagementComponent } from './orderManagements/order-management/order-management.component';


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
    LocationCardComponent,
    EditLocationComponent,
    WishlistDialogComponent,
    UserproductListComponent,
    WishlistComponent,
    CartComponent,
    ProductListComponent,
    ProductDetailComponent,
    OrderComponent,
    OrderManagementComponent

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
  ]
})
export class CustomerModule { }
