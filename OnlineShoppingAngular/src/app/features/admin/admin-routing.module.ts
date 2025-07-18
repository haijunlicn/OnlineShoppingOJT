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
import { CreateDiscountComponent } from './discount_management/create-discount/create-discount.component';
import { CreateDiscountGroupComponent } from './discount_management/create-discount-group/create-discount-group.component';
import { ProductSelectionComponent } from './discount_management/product-selection/product-selection.component';
import { SaleAnalysisComponent } from './policy-management/sale-analysis/sale-analysis.component';
import { PermissionGuard } from '@app/core/guards/permission.guard';
import { AdminAccountCreateComponent } from './roleAndPermission/admin-account-create/admin-account-create.component';
import { RefundReasonListComponent } from './policy-management/refund-reason-list/refund-reason-list.component';
import { RefundReasonFormComponent } from './policy-management/refund-reason-form/refund-reason.component';
import { RejectionReasonListComponent } from './policy-management/rejection-reason-list/rejection-reason-list.component';
import { RejectionReasonFormComponent } from './policy-management/rejection-reason-form/rejection-reason-form.component';
import { RefundRequestListComponent } from './RefundManagement/refund-request-list/refund-request-list.component';
import { RefundRequestDetailComponent } from './RefundManagement/refund-request-detail/refund-request-detail.component';
import { PolicyUpdateComponent } from './policy-management/policy-update/policy-update.component';
import { ChartTestingComponent } from './SaleAnalysis/chart-testing/chart-testing.component';
import { AdminLayoutComponent } from './common/admin-layout/admin-layout.component';
import { NotificationCreateComponent } from './notificationManagement/notification-create/notification-create.component';
import { AdminNotificationListComponent } from './notificationManagement/admin-notification-list/admin-notification-list.component';
import { AdminNotiTypesComponent } from './notificationManagement/admin-noti-types/admin-noti-types.component';
import { AdminSentNotisComponent } from './notificationManagement/admin-sent-notis/admin-sent-notis.component';
import { DeliveryMethodListComponent } from './deliveryMethodManagement/delivery-method-list/delivery-method-list.component';
import { CreateDeliveryMethodComponent } from './deliveryMethodManagement/create-delivery-method/create-delivery-method.component';
import { EditDeliveryMethodComponent } from './deliveryMethodManagement/edit-delivery-method/edit-delivery-method.component';


const routes: Routes = [
  {
    path: 'login',
    component: AdminLoginComponent,
    canActivate: [AdminNoAuthGuard]
  },

  // All admin pages will use this layout
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminAuthGuard], // shared guard
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'productList', component: ProductListComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['PRODUCT_READ'], ['SUPERADMIN_PERMISSION']] } },
      { path: 'productCreate', component: ProductCreateComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['PRODUCT_CREATE'], ['SUPERADMIN_PERMISSION']] } },
      // { path: 'group', component: DiscountGroupComponent },
      { path: 'policy/policy-create', component: PolicyCreateComponent },
      { path: 'policy/policy-list', component: PolicyListComponent },
      { path: 'policy/policy-update', component: PolicyUpdateComponent },
      { path: 'policy/faq-create', component: FaqCreateComponent },
      { path: 'policy/faq-list', component: FaqListComponent },
      { path: 'policy/faq-update', component: FaqUpdateComponent },
      { path: 'role-list', component: RoleListComponent },
      { path: 'role-form', component: RoleFormComponent },
      { path: 'role-update/:id', component: RoleUpdateComponent },
      { path: 'permission-form', component: PermissionFormComponent },
      { path: 'permission-list', component: PermissionListComponent },
      { path: 'permission-update/:id', component: PermissionUpdateComponent },
      { path: 'payment-create', component: PaymentCreateComponent },
      { path: 'payment-list', component: PaymentListComponent },
      { path: 'payment-update/:id', component: PaymentUpdateComponent },
      {
  path: 'delivery-method-list',
  component: DeliveryMethodListComponent
},
{
  path: 'delivery-method-create',
  component: CreateDeliveryMethodComponent
},
{
  path: 'delivery-method-edit/:id',
  component: EditDeliveryMethodComponent
},
      { path: 'sale-analysis', component: SaleAnalysisComponent },
      { path: 'refund-reason/list', component: RefundReasonListComponent },
      { path: 'refund-reason/create', component: RefundReasonFormComponent },
      { path: 'rejection-reason/list', component: RejectionReasonListComponent },
      { path: 'rejection-reason/create', component: RejectionReasonFormComponent },
      { path: 'bulkUploadProduct', component: ProductBulkUploadComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['PRODUCT_CREATE'], ['SUPERADMIN_PERMISSION']] } },
      { path: 'product/:id', component: ProductDetailComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['PRODUCT_READ'], ['SUPERADMIN_PERMISSION']] } },
      { path: 'product/edit/:id', component: ProductEditComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['PRODUCT_UPDATE'], ['SUPERADMIN_PERMISSION']] } },
      { path: 'account/create', component: AdminAccountCreateComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['ADMIN_USER_MANAGE'], ['SUPERADMIN_PERMISSION']] } },
      { path: 'storelocation', component: StoreAddressComponent },
      { path: 'AdminOrder', component: AdminOrdersControlComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'orderDetailAdmin/:id', component: AdminOrdersDetailComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'refundRequestList', component: RefundRequestListComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'refundRequestDetail/:id', component: RefundRequestDetailComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'chartTesting', component: ChartTestingComponent },
      {
        path: 'productAttributes',
        component: ProductAttributeComponent,
        children: [
          { path: '', redirectTo: 'categories', pathMatch: 'full' },
          { path: 'options', component: OptionManagementComponent },
          { path: 'categories', component: CategoryManagementComponent },
          { path: 'brands', component: BrandManagementComponent },
        ]
      },
      // Optional default redirect
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'notificationCreate', component: NotificationCreateComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'notifications', component: AdminNotificationListComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'notificationTypes', component: AdminNotiTypesComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'sentNotifications', component: AdminSentNotisComponent, canActivate: [PermissionGuard], data: { permissionGroups: [['SUPERADMIN_PERMISSION']] } },
      { path: 'createGroup', component: CreateDiscountGroupComponent },
      { path: 'createDiscount', component: CreateDiscountComponent },
      {
        path: 'sale-analysis', component
        :SaleAnalysisComponent, canActivate: [AdminAuthGuard]
      },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }