import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './layout/admin-dashboard/admin-dashboard.component';
import { ProductListComponent } from './product_management/product-list/product-list.component';
import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { NoAuthGuard } from '../../core/guards/no-auth.guard';
import { ProductAttributesComponent } from './product_management/product-attributes/product-attributes.component';
import { AttributeManagementComponent } from './product_management/attribute-management/attribute-management.component';
import { OptionManagementComponent } from './product_management/option-management/option-management.component';
import { CategoryManagementComponent } from './product_management/category-management/category-management.component';
import { BrandManagementComponent } from './product_management/brand-management/brand-management.component';

const routes: Routes = [
  {
    path: 'login',
    component: AdminLoginComponent, canActivate: [NoAuthGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent, canActivate: [NoAuthGuard],
  },
  {
    path: 'productList',
    component: ProductListComponent, canActivate: [NoAuthGuard],
  },
  {
    path: 'productCreate',
    component: ProductCreateComponent, canActivate: [NoAuthGuard],
  },
  {
    path: 'productAttributes',
    component: AttributeManagementComponent,
    canActivate: [NoAuthGuard],
    children: [
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
=======
      { path: '', redirectTo: 'options', pathMatch: 'full' },
>>>>>>> Stashed changes
=======
      { path: '', redirectTo: 'options', pathMatch: 'full' },
>>>>>>> Stashed changes
=======
      { path: '', redirectTo: 'options', pathMatch: 'full' },
>>>>>>> Stashed changes
      { path: 'options', component: OptionManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'brands', component: BrandManagementComponent }
    ]
  }

  // {
  //   path: 'productAttributes',
  //   component: AttributeManagementComponent, canActivate: [NoAuthGuard],
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
