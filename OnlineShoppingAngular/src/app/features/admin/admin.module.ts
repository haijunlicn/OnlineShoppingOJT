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
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TreeModule } from 'primeng/tree';
import { MenuModule } from 'primeng/menu';

import { ProductListComponent } from './product_management/product-list/product-list.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ProductAttributesComponent } from './product_management/product-attributes/product-attributes.component';
import { AttributeManagementComponent } from './product_management/attribute-management/attribute-management.component';
import { CategoryManagementComponent } from './product_management/category-management/category-management.component';
import { OptionManagementComponent } from './product_management/option-management/option-management.component';
import { BrandManagementComponent } from './product_management/brand-management/brand-management.component';
import { RichTextEditorComponent } from './policy-management/rich-text-editor/rich-text-editor.component';
import { PolicyCreateComponent } from './policy-management/policy-create/policy-create.component';
import { PolicyListComponent } from './policy-management/policy-list/policy-list.component';
import { FaqListComponent } from './policy-management/faq-list/faq-list.component';
import { FaqCreateComponent } from './policy-management/faq-create/faq-create.component';
import { FaqUpdateComponent } from './policy-management/faq-update/faq-update.component';
import { DiscountGroupComponent } from './discount_management/discount-group/discount-group.component';
import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { ProductBulkUploadComponent } from './product_management/product-bulk-upload/product-bulk-upload.component';


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
    ProductCreateComponent,
    ProductAttributesComponent,
    AttributeManagementComponent,
    CategoryManagementComponent,
    OptionManagementComponent,
    BrandManagementComponent,
    RichTextEditorComponent,
    PolicyCreateComponent,
    PolicyListComponent,
    FaqListComponent,
    FaqCreateComponent,
    FaqUpdateComponent,
    
    DiscountGroupComponent,
    ProductBulkUploadComponent,
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
    RippleModule,
    TabViewModule,
    DialogModule,
    TagModule,
    CheckboxModule,
    ColorPickerModule,
    TreeModule,
    MenuModule,
    
    
     FormsModule
  ]
})
export class AdminModule { }
