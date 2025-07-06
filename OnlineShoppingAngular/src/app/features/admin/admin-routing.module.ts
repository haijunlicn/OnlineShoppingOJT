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
import { RoleListComponent } from './roleAndPermission/role-list/role-list.component';
import { RoleFormComponent } from './roleAndPermission/role-form/role-form.component';
import { RoleUpdateComponent } from './roleAndPermission/role-update/role-update.component';
import { PermissionFormComponent } from './roleAndPermission/permission-form/permission-form.component';
import { PermissionListComponent } from './roleAndPermission/permission-list/permission-list.component';
import { PermissionUpdateComponent } from './roleAndPermission/permission-update/permission-update.component';
import { PaymentCreateComponent } from './payment-management/payment-create/payment-create.component';
import { PaymentListComponent } from './payment-management/payment-list/payment-list.component';
import { PaymentUpdateComponent } from './payment-management/payment-update/payment-update.component';
import { AdminNoAuthGuard } from '../../core/guards/admin-no-auth.guard';
import { AdminAuthGuard } from '../../core/guards/admin-auth.guard';
import { ProductAttributeComponent } from './attribute_management/product-attribute/product-attribute.component';
import { StoreAddressComponent } from './storeManagement/store-address/store-address.component';
import { AdminOrdersControlComponent } from './adminOrderManagement/admin-orders-control/admin-orders-control.component';
import { AdminOrdersDetailComponent } from './adminOrderManagement/admin-orders-detail/admin-orders-detail.component';
import { ProductDetailComponent } from './product_management/product-detail/product-detail.component';
import { ProductEditComponent } from './product_management/product-edit/product-edit.component';
import { PermissionGuard } from '@app/core/guards/permission.guard';
import { AdminAccountCreateComponent } from './roleAndPermission/admin-account-create/admin-account-create.component';


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
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['PRODUCT_READ'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
    path: 'productCreate',
    component: ProductCreateComponent,
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['PRODUCT_CREATE'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
    path: 'group',
    component: DiscountGroupComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/policy-create',
    component: PolicyCreateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/policy-list',
    component: PolicyListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-create',
    component: FaqCreateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-list',
    component: FaqListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'policy/faq-update',
    component: FaqUpdateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-list',
    component: RoleListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-form',
    component: RoleFormComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'role-update/:id',
    component: RoleUpdateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-form', component:
      PermissionFormComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-list', component:
      PermissionListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-update/:id',
    component: PermissionUpdateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'payment-create', component:
      PaymentCreateComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'payment-list',
    component: PaymentListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'payment-update/:id',
    component: PaymentUpdateComponent,
    canActivate: [AdminAuthGuard]
  },
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
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['PRODUCT_CREATE'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['PRODUCT_READ'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
    path: 'product/edit/:id',
    component: ProductEditComponent,
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['PRODUCT_UPDATE'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
    path: 'account/create',
    component: AdminAccountCreateComponent,
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['ADMIN_USER_MANAGE'],
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },

{path:'storelocation',component:StoreAddressComponent},

  {path:'AdminOrder',component:AdminOrdersControlComponent,
    canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['SUPERADMIN_PERMISSION']
      ]
    }
  },
  {
  path: 'orderDetailAdmin/:id',
  component: AdminOrdersDetailComponent,
  canActivate: [AdminAuthGuard, PermissionGuard],
    data: {
      permissionGroups: [
        ['SUPERADMIN_PERMISSION']
      ]
    }
}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
