import { NgModule } from '@angular/core';
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
    component: ProductBulkUploadComponent, canActivate: [NoAuthGuard],
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
