import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { ProductEditComponent } from './product_management/product-edit/product-edit.component';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminHeaderComponent } from './common/admin-header/admin-header.component';
import { AdminSidebarComponent } from './common/admin-sidebar/admin-sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminFooterComponent } from './common/admin-footer/admin-footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AdminDashboardComponent } from './layout/admin-dashboard/admin-dashboard.component';
import { PrimeIcons } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { ProductListComponent } from './product_management/product-list/product-list.component';
import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    ProductEditComponent,
    AdminLoginComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    DashboardComponent,
    AdminFooterComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AdminDashboardComponent,
    ProductListComponent,
    ProductCreateComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    SliderModule,
    TooltipModule,
    RippleModule
  ]
})
export class AdminModule { }
