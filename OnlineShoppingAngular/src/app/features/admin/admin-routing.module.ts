import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductListComponent } from './product_management/product-list/product-list.component';
import { OptionManagementComponent } from './attribute_management/option-management/option-management.component';
import { CategoryManagementComponent } from './attribute_management/category-management/category-management.component';
import { BrandManagementComponent } from './attribute_management/brand-management/brand-management.component';
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
import { AdminNoAuthGuard } from '../../core/guards/admin-no-auth.guard';
import { AdminAuthGuard } from '../../core/guards/admin-auth.guard';
import { ProductAttributeComponent } from './attribute_management/product-attribute/product-attribute.component';


const routes: Routes = [
  {
    path: 'login',
    component: AdminLoginComponent,
    canActivate: [AdminNoAuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'productList',
    component: ProductListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'productCreate',
    component: ProductCreateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'group',
    component: DiscountGroupComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/policy-create', component: PolicyCreateComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/policy-list', component: PolicyListComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-create', component: FaqCreateComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-list', component: FaqListComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-update', component: FaqUpdateComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-list', component: RoleListComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-form', component: RoleFormComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-update/:id', component: RoleUpdateComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-form', component: PermissionFormComponent, canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-list', component: PermissionListComponent, canActivate: [AdminAuthGuard]
  },
  { path: 'permission-update/:id', component: PermissionUpdateComponent, canActivate: [AdminAuthGuard] },
  { path: 'payment-create', component: PaymentCreateComponent, canActivate: [AdminAuthGuard] },
  { path: 'payment-list', component: PaymentListComponent, canActivate: [AdminAuthGuard] },
  { path: 'payment-update/:id', component: PaymentUpdateComponent, canActivate: [AdminAuthGuard] },


  {
    path: 'productAttributes',
    component: ProductAttributeComponent,
    canActivate: [AdminAuthGuard],
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      { path: 'options', component: OptionManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'brands', component: BrandManagementComponent }
    ],
  },
  {
    path: 'bulkUploadProduct',
    component: ProductBulkUploadComponent,
    canActivate: [AdminAuthGuard]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
