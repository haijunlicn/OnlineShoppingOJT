import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './layout/admin-dashboard/admin-dashboard.component';
import { ProductListComponent } from './product_management/product-list/product-list.component';
import { NoAuthGuard } from '../../core/guards/no-auth.guard';
import { ProductAttributesComponent } from './product_management/product-attributes/product-attributes.component';
import { AttributeManagementComponent } from './product_management/attribute-management/attribute-management.component';
import { OptionManagementComponent } from './product_management/option-management/option-management.component';
import { CategoryManagementComponent } from './product_management/category-management/category-management.component';
import { BrandManagementComponent } from './product_management/brand-management/brand-management.component';
import { PolicyCreateComponent } from './policy-management/policy-create/policy-create.component';
import { PolicyListComponent } from './policy-management/policy-list/policy-list.component';
import { FaqCreateComponent } from './policy-management/faq-create/faq-create.component';
import { FaqListComponent } from './policy-management/faq-list/faq-list.component';
import { FaqUpdateComponent } from './policy-management/faq-update/faq-update.component';
import { DiscountGroupComponent } from './discount_management/discount-group/discount-group.component';
import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { ProductBulkUploadComponent } from './product_management/product-bulk-upload/product-bulk-upload.component';
import { RoleListComponent } from './role-management/role-list/role-list.component';
import { RoleFormComponent } from './role-management/role-form/role-form.component';
import { RoleUpdateComponent } from './role-management/role-update/role-update.component';
import { PermissionFormComponent } from './role-management/permission-form/permission-form.component';
import { PermissionListComponent } from './role-management/permission-list/permission-list.component';
import { PermissionUpdateComponent } from './role-management/permission-update/permission-update.component';
import { PaymentCreateComponent } from './payment-management/payment-create/payment-create.component';
import { PaymentListComponent } from './payment-management/payment-list/payment-list.component';
import { PaymentUpdateComponent } from './payment-management/payment-update/payment-update.component';


const routes: Routes = [
  {
    path: 'login',
    component: AdminLoginComponent, 
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'productList',
    component: ProductListComponent, 
  },
  {
    path: 'productCreate',
    component: ProductCreateComponent, 
  },
   {
    path: 'group',
    component: DiscountGroupComponent,
  },
  {
    path: 'policy/policy-create' , component: PolicyCreateComponent, canActivate: [NoAuthGuard]
  },
   {
    path: 'policy/policy-list' , component: PolicyListComponent, canActivate: [NoAuthGuard]
  },
  {
    path: 'policy/faq-create' , component: FaqCreateComponent, canActivate: [NoAuthGuard]
  },
   {
    path: 'policy/faq-list' , component: FaqListComponent, canActivate: [NoAuthGuard]
  },
  {
    path: 'policy/faq-update' , component: FaqUpdateComponent, canActivate: [NoAuthGuard]
  },
  {
    path: 'role-list' , component: RoleListComponent
  },
  {
    path: 'role-form' , component: RoleFormComponent
  },
  {
    path: 'role-update/:id' , component: RoleUpdateComponent
  },
  {
    path: 'permission-form' , component: PermissionFormComponent
  },
  {
    path: 'permission-list' , component: PermissionListComponent
  },
  { path: 'permission-update/:id', component: PermissionUpdateComponent },
    { path: 'payment-create', component: PaymentCreateComponent },
      { path: 'payment-list', component: PaymentListComponent },
{ path: 'payment-update/:id', component: PaymentUpdateComponent },


  {
    path: 'productAttributes',
    component: AttributeManagementComponent,
    
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: 'options', component: OptionManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'brands', component: BrandManagementComponent }
    ]
  },
  {
    path: 'bulkUploadProduct',
    component: ProductBulkUploadComponent,
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
