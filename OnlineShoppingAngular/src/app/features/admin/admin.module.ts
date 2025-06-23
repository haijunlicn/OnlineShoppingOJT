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
import { NgxMaskModule } from 'ngx-mask';

import { ProductListComponent } from './product_management/product-list/product-list.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CategoryManagementComponent } from './attribute_management/category-management/category-management.component';
import { OptionManagementComponent } from './attribute_management/option-management/option-management.component';
import { BrandManagementComponent } from './attribute_management/brand-management/brand-management.component';
import { RichTextEditorComponent } from './policy-management/rich-text-editor/rich-text-editor.component';
import { PolicyCreateComponent } from './policy-management/policy-create/policy-create.component';
import { PolicyListComponent } from './policy-management/policy-list/policy-list.component';
import { FaqListComponent } from './policy-management/faq-list/faq-list.component';
import { FaqCreateComponent } from './policy-management/faq-create/faq-create.component';
import { FaqUpdateComponent } from './policy-management/faq-update/faq-update.component';
import { DiscountGroupComponent } from './discount_management/discount-group/discount-group.component';
import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { ProductBulkUploadComponent } from './product_management/product-bulk-upload/product-bulk-upload.component';
import { RoleListComponent } from './role-management/role-list/role-list.component';
import { RoleFormComponent } from './role-management/role-form/role-form.component';
import { PermissionListComponent } from './role-management/permission-list/permission-list.component';
import { PermissionFormComponent } from './role-management/permission-form/permission-form.component';
import { RoleUpdateComponent } from './role-management/role-update/role-update.component';
import { PermissionUpdateComponent } from './role-management/permission-update/permission-update.component';
import { PaymentListComponent } from './payment-management/payment-list/payment-list.component';
import { PaymentCreateComponent } from './payment-management/payment-create/payment-create.component';
import { PaymentUpdateComponent } from './payment-management/payment-update/payment-update.component';import { ProductAttributeComponent } from './attribute_management/product-attribute/product-attribute.component';
import { BrandDialogComponent } from './attribute_management/brand-dialog/brand-dialog.component';
import { CategoryDialogComponent } from './attribute_management/category-dialog/category-dialog.component';
import { OptionDialogComponent } from './attribute_management/option-dialog/option-dialog.component';
import { OptionValueDialogComponent } from './attribute_management/option-value-dialog/option-value-dialog.component';
import { CategoryOptionsDialogComponent } from './attribute_management/category-options-dialog/category-options-dialog.component';
import { PriceDisplayInputComponent } from './product_management/price-display-input/price-display-input.component';


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
    ProductAttributeComponent,
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
    RoleListComponent,
    RoleFormComponent,
    PermissionListComponent,
    PermissionFormComponent,
    RoleUpdateComponent,
    PermissionUpdateComponent,
    PaymentListComponent,
    PaymentCreateComponent,
    PaymentUpdateComponent,
    BrandDialogComponent,
    CategoryDialogComponent,
    OptionDialogComponent,
    OptionValueDialogComponent,
    CategoryOptionsDialogComponent,
    PriceDisplayInputComponent,
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
    FormsModule,
    NgxMaskModule.forRoot(),
  ]
})
export class AdminModule { }