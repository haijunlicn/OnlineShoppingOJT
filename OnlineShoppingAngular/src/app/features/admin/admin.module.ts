import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { ProductEditComponent } from './product_management/product-edit/product-edit.component';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminHeaderComponent } from './common/admin-header/admin-header.component';
import { AdminSidebarComponent } from './common/admin-sidebar/admin-sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
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
import { NgxChartsModule } from '@swimlane/ngx-charts';

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

import { ProductCreateComponent } from './product_management/product-create/product-create.component';
import { ProductBulkUploadComponent } from './product_management/product-bulk-upload/product-bulk-upload.component';
import { RoleListComponent } from './roleAndPermission/role-list/role-list.component';
import { RoleFormComponent } from './roleAndPermission/role-form/role-form.component';
import { PermissionListComponent } from './roleAndPermission/permission-list/permission-list.component';
import { PermissionFormComponent } from './roleAndPermission/permission-form/permission-form.component';
import { RoleUpdateComponent } from './roleAndPermission/role-update/role-update.component';
import { PermissionUpdateComponent } from './roleAndPermission/permission-update/permission-update.component';
import { PaymentListComponent } from './payment-management/payment-list/payment-list.component';
import { PaymentCreateComponent } from './payment-management/payment-create/payment-create.component';
import { PaymentUpdateComponent } from './payment-management/payment-update/payment-update.component';
import { ProductAttributeComponent } from './attribute_management/product-attribute/product-attribute.component';
import { BrandDialogComponent } from './attribute_management/brand-dialog/brand-dialog.component';
import { CategoryDialogComponent } from './attribute_management/category-dialog/category-dialog.component';
import { OptionDialogComponent } from './attribute_management/option-dialog/option-dialog.component';
import { OptionValueDialogComponent } from './attribute_management/option-value-dialog/option-value-dialog.component';
import { CategoryOptionsDialogComponent } from './attribute_management/category-options-dialog/category-options-dialog.component';
import { PriceDisplayInputComponent } from './product_management/price-display-input/price-display-input.component';
import { StoreAddressComponent } from './storeManagement/store-address/store-address.component';
import { AdminOrdersControlComponent } from './adminOrderManagement/admin-orders-control/admin-orders-control.component';

import { ProductDetailComponent } from './product_management/product-detail/product-detail.component';
import { StockUpdateModalComponent } from './product_management/stock-update-modal/stock-update-modal.component';
import { CreateDiscountComponent } from './discount_management/create-discount/create-discount.component';
import { DiscountRulesComponent } from './discount_management/discount-rules/discount-rules.component';
import { CreateDiscountGroupComponent } from './discount_management/create-discount-group/create-discount-group.component';
import { ProductSelectionComponent } from './discount_management/product-selection/product-selection.component';
import { SaleAnalysisComponent } from './policy-management/sale-analysis/sale-analysis.component';
import { AdminAccountCreateComponent } from './roleAndPermission/admin-account-create/admin-account-create.component';
import { RefundReasonFormComponent } from './policy-management/refund-reason-form/refund-reason.component';
import { RejectionReasonFormComponent } from './policy-management/rejection-reason-form/rejection-reason-form.component';
import { RejectionReasonListComponent } from './policy-management/rejection-reason-list/rejection-reason-list.component';
import { RefundReasonListComponent } from './policy-management/refund-reason-list/refund-reason-list.component';
import { RefundRequestListComponent } from './RefundManagement/refund-request-list/refund-request-list.component';
import { RefundRequestDetailComponent } from './RefundManagement/refund-request-detail/refund-request-detail.component';
import { PolicyUpdateComponent } from './policy-management/policy-update/policy-update.component';
import { ChartTestingComponent } from './SaleAnalysis/chart-testing/chart-testing.component';
import { AdminLayoutComponent } from './common/admin-layout/admin-layout.component';
import { NotificationCreateComponent } from './notificationManagement/notification-create/notification-create.component';
import { AdminNotificationBellComponent } from './notificationManagement/admin-notification-bell/admin-notification-bell.component';
import { AdminNotificationListComponent } from './notificationManagement/admin-notification-list/admin-notification-list.component';
import { AdminNotificationDetailComponent } from './notificationManagement/admin-notification-detail/admin-notification-detail.component';
import { AdminNotiTypesComponent } from './notificationManagement/admin-noti-types/admin-noti-types.component';
import { AdminSentNotisComponent } from './notificationManagement/admin-sent-notis/admin-sent-notis.component';
import { AuditLogComponent } from './policy-management/audit-log/audit-log.component';
import { VlogCreateComponent } from './vlog-management/vlogcreate/vlogcreate.component';
import { VlogListComponent } from './vlog-management/vloglist/vloglist.component';
import { CreateDeliveryMethodComponent } from './deliveryMethodManagement/create-delivery-method/create-delivery-method.component';
import { DeliveryMethodListComponent } from './deliveryMethodManagement/delivery-method-list/delivery-method-list.component';
import { EditDeliveryMethodComponent } from './deliveryMethodManagement/edit-delivery-method/edit-delivery-method.component';
import { DiscountListComponent } from './discount_management/discount-list/discount-list.component';
import { NewCreateDiscountComponent } from './discount_management/new-create-discount/new-create-discount.component';
import { NewDiscountRulesComponent } from './discount_management/new-discount-rules/new-discount-rules.component';
import { NewProductSelectionComponent } from './discount_management/new-product-selection/new-product-selection.component';
import { QuestionComponent } from './QuestionManagement/question/question.component';
import { NewEditDiscountComponent } from './discount_management/new-edit-discount/new-edit-discount.component';
import { AdminAccountListComponent } from './roleAndPermission/admin-account-list/admin-account-list.component';
import { UserViewDetailComponent } from './adminUserManagement/user-view-detail/user-view-detail.component';
import { AdminOrdersDetailComponent } from './adminOrderManagement/admin-orders-detail/admin-orders-detail.component';
import { UserDetailListComponent } from './adminUserManagement/user-detail-list/user-detail-list.component';


@NgModule({
  declarations: [
    ProductEditComponent,
    AdminLoginComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    DashboardComponent,
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
    StoreAddressComponent,
    AdminOrdersControlComponent,
    AdminOrdersDetailComponent,
    ProductDetailComponent,
    StockUpdateModalComponent,
    CreateDiscountComponent,
    ProductSelectionComponent,
    DiscountRulesComponent,
    CreateDiscountGroupComponent,
    SaleAnalysisComponent,
    AdminAccountCreateComponent,
    RefundReasonFormComponent,
    RejectionReasonFormComponent,
    RejectionReasonListComponent,
    RefundReasonListComponent,
    RefundRequestListComponent,
    RefundRequestDetailComponent,
    PolicyUpdateComponent,
    ChartTestingComponent,
    AdminLayoutComponent,
    NotificationCreateComponent,
    AdminNotificationBellComponent,
    AdminNotificationDetailComponent,
    AdminNotificationListComponent,
    AdminNotiTypesComponent,
    AdminSentNotisComponent,
    AuditLogComponent,
    VlogListComponent,
    VlogCreateComponent,
    CreateDeliveryMethodComponent,
    DeliveryMethodListComponent,
    EditDeliveryMethodComponent,
    DiscountListComponent,
    NewCreateDiscountComponent,
    NewDiscountRulesComponent,
    NewProductSelectionComponent,
    QuestionComponent,
    NewEditDiscountComponent,
    AdminAccountListComponent,
    UserViewDetailComponent,
    UserDetailListComponent,
   

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
    NgxChartsModule,
    NgxMaskModule.forRoot(),

  ]
})
export class AdminModule { }