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
