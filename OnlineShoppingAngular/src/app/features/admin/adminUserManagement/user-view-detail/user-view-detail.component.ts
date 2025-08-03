import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '@app/core/services/order.service';
import { RefundRequestService } from '@app/core/services/refundRequestService';
import { User } from '@app/core/models/User';
import { OrderDetail, ORDER_STATUS, OrderItemDetail } from '@app/core/models/order.dto';
import { RefundRequestDTO, RefundStatus, RefundItemDTO } from '@app/core/models/refund.model';
import { AdminAccountService } from '@app/core/services/admin-account.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import { PdfExportService } from '@app/core/services/pdf-export.service';

@Component({
  selector: 'app-user-view-detail',
  standalone:false,
  templateUrl: './user-view-detail.component.html',
  styleUrl: './user-view-detail.component.css'
})
export class UserViewDetailComponent implements OnInit {
  userId: number = 0;
  user: User | null = null;
  isLoading = true;
  errorMessage = '';

  // Orders
  orders: OrderDetail[] = [];
  filteredOrders: OrderDetail[] = [];
  orderFilter = { status: '', dateFrom: '', dateTo: '', search: '' };
  orderStatuses = Object.values(ORDER_STATUS);

  // Refunds
  refunds: RefundRequestDTO[] = [];
  filteredRefunds: RefundRequestDTO[] = [];
  refundFilter = { status: '', dateFrom: '', dateTo: '', search: '' };
  refundStatuses = Object.values(RefundStatus);

  // UI State
  activeTab: 'orders' | 'refunds' = 'orders';
  isExporting = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private refundRequestService: RefundRequestService,
    private adminAccountService: AdminAccountService,
    private excelExportService: ExcelExportService,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      if (this.userId) {
        this.loadData();
      } else {
        this.errorMessage = 'Invalid user ID';
        this.isLoading = false;
      }
    });
  }

  private async loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      // Fetch orders and refunds in parallel
      const [orders, allRefunds] = await Promise.all([
        this.orderService.getOrdersByUserId(this.userId).toPromise(),
        this.refundRequestService.getRefundRequestList().toPromise()
      ]);
      this.orders = orders || [];
      this.filteredOrders = [...this.orders];
      this.refunds = (allRefunds || []).filter(r => r.userId === this.userId);
      this.filteredRefunds = [...this.refunds];
      // Set user from first order if available
      if (this.orders.length > 0) {
        this.user = this.orders[0].user;
      } else {
        // Fallback: fetch user from admin account service
        this.adminAccountService.getUserById(this.userId).subscribe({
          next: (user: User) => { this.user = user; },
          error: () => { this.user = null; }
        });
      }
      this.isLoading = false;
    } catch (err) {
      this.errorMessage = 'Failed to load user details.';
      this.isLoading = false;
    }
  }

  // --- Export Functions ---

  /**
   * Export comprehensive user report to Excel
   */
  async exportUserReportToExcel(): Promise<void> {
    if (!this.user) return;
    
    this.isExporting = true;
    try {
      const filename = `user-report-${this.user.name}-${this.userId}.xlsx`;
      
      // Check if filters are applied
      const hasOrderFilters = this.orderFilter.status || this.orderFilter.dateFrom || this.orderFilter.dateTo || this.orderFilter.search;
      const hasRefundFilters = this.refundFilter.status || this.refundFilter.dateFrom || this.refundFilter.dateTo || this.refundFilter.search;
      
      // Use filtered data if filters are applied, otherwise use all data
      const ordersData = hasOrderFilters ? this.filteredOrders : this.orders;
      const refundsData = hasRefundFilters ? this.filteredRefunds : this.refunds;
      
      // Prepare sheets data
      const sheets = [
        {
          name: 'User Information',
          data: [this.prepareUserDataForExport()],
          columns: [
            { header: 'User ID', field: 'id', width: 15 },
            { header: 'Name', field: 'name', width: 30 },
            { header: 'Email', field: 'email', width: 35 },
            { header: 'Phone', field: 'phone', width: 20 },
            { header: 'Address', field: 'address', width: 50 },
            { header: 'City', field: 'city', width: 20 },
            { header: 'Country', field: 'country', width: 20 },
            { header: 'Total Orders', field: 'totalOrders', width: 15 },
            { header: 'Total Spent', field: 'totalSpent', width: 20 },
            { header: 'Total Refunds', field: 'totalRefunds', width: 15 },
            { header: 'Member Since', field: 'memberSince', width: 20 }
          ]
        },
        {
          name: 'Orders',
          data: this.prepareOrdersDataForExport(ordersData),
          columns: [
            { header: 'Tracking Number', field: 'trackingNumber', width: 20 },
            { header: 'Order Date', field: 'orderDate', width: 20 },
            { header: 'Status', field: 'status', width: 25 },
            { header: 'Total Amount', field: 'totalAmount', width: 25 },
            { header: 'Payment Status', field: 'paymentStatus', width: 20 },
            { header: 'Items Count', field: 'itemsCount', width: 15 },
            { header: 'Products', field: 'products', width: 50 },
            { header: 'Shipping Address', field: 'shippingAddress', width: 40 }
          ]
        },
        {
          name: 'Refunds',
          data: this.prepareRefundsDataForExport(refundsData),
          columns: [
            { header: 'Refund ID', field: 'id', width: 15 },
            { header: 'Order ID', field: 'orderId', width: 15 },
            { header: 'Created Date', field: 'createdDate', width: 20 },
            { header: 'Status', field: 'status', width: 20 },
            { header: 'Total Amount', field: 'totalAmount', width: 20 },
            { header: 'Reason', field: 'reason', width: 30 },
            { header: 'Products', field: 'products', width: 50 },
            { header: 'Notes', field: 'notes', width: 30 }
          ]
        }
      ];

      await this.excelExportService.exportMultipleSheets(sheets, filename);
    } catch (error) {
      console.error('Error exporting user report to Excel:', error);
      this.errorMessage = 'Failed to export Excel report.';
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Export comprehensive user report to PDF
   */
  async exportUserReportToPdf(): Promise<void> {
    if (!this.user) return;
    
    this.isExporting = true;
    try {
      const filename = `user-report-${this.user.name}-${this.userId}.pdf`;
      
      // Check if filters are applied
      const hasOrderFilters = this.orderFilter.status || this.orderFilter.dateFrom || this.orderFilter.dateTo || this.orderFilter.search;
      const hasRefundFilters = this.refundFilter.status || this.refundFilter.dateFrom || this.refundFilter.dateTo || this.refundFilter.search;
      
      // Use filtered data if filters are applied, otherwise use all data
      const ordersData = hasOrderFilters ? this.filteredOrders : this.orders;
      const refundsData = hasRefundFilters ? this.filteredRefunds : this.refunds;
      
      // Create comprehensive user report data
      const reportData = {
        user: this.prepareUserDataForExport(),
        orders: this.prepareOrdersDataForExport(ordersData),
        refunds: this.prepareRefundsDataForExport(refundsData),
        summary: this.calculateUserSummary()
      };

      await this.pdfExportService.exportUserDetailReport(reportData, filename);
    } catch (error) {
      console.error('Error exporting user report to PDF:', error);
      this.errorMessage = 'Failed to export PDF report.';
    } finally {
      this.isExporting = false;
    }
  }

  // Remove the individual export functions as they are no longer needed

  // --- Data Preparation Methods ---

  private prepareUserDataForExport(): any {
    if (!this.user) return {};
    
    const firstOrder = this.orders[0];
    const totalSpent = this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const memberSince = firstOrder ? new Date(firstOrder.createdDate).toLocaleDateString() : 'N/A';
    
    return {
      id: this.user.id,
      name: this.user.name,
      email: this.user.email,
      phone: firstOrder?.shippingAddress?.phoneNumber || 'N/A',
      address: firstOrder?.shippingAddress?.address || 'N/A',
      city: firstOrder?.shippingAddress?.city || 'N/A',
      country: firstOrder?.shippingAddress?.country || 'N/A',
      totalOrders: this.orders.length,
      totalSpent: totalSpent.toLocaleString() + ' MMK',
      totalRefunds: this.refunds.length,
      memberSince: memberSince
    };
  }

  private prepareOrdersDataForExport(orders: OrderDetail[]): any[] {
    return orders.map(order => {
      const products = order.items?.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join(', ') || 'N/A';
      
      const shippingAddress = order.shippingAddress ? 
        `${order.shippingAddress.address}, ${order.shippingAddress.township || ''}, ${order.shippingAddress.city}, ${order.shippingAddress.country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '') :
        'N/A';

      return {
        id: order.id,
        trackingNumber: order.trackingNumber,
        orderDate: this.formatDate(order.createdDate),
        status: order.currentOrderStatus,
        totalAmount: (order.totalAmount || 0).toLocaleString() + ' MMK',
        paymentStatus: order.paymentStatus || 'N/A',
        itemsCount: order.items?.length || 0,
        products: products,
        shippingAddress: shippingAddress
      };
    });
  }

  private prepareRefundsDataForExport(refunds: RefundRequestDTO[]): any[] {
    return refunds.map(refund => {
      const products = refund.items?.map(item => 
        `${item.productName || 'Product'} (x${item.quantity})`
      ).join(', ') || 'N/A';

      // Get reason from first item if available
      const reason = refund.items && refund.items.length > 0 && refund.items[0].customReasonText 
        ? refund.items[0].customReasonText 
        : 'N/A';

      return {
        id: refund.id,
        orderId: refund.orderId,
        createdDate: this.formatDate(refund.createdAt),
        status: refund.status,
        totalAmount: this.getRefundTotal(refund).toLocaleString() + ' MMK',
        reason: reason,
        products: products,
        notes: refund.adminComment || 'N/A'
      };
    });
  }

  private calculateUserSummary(): any {
    const totalSpent = this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalRefunded = this.refunds.reduce((sum, refund) => sum + this.getRefundTotal(refund), 0);
    const netSpent = totalSpent - totalRefunded;
    
    const statusCounts = this.orders.reduce((acc, order) => {
      const status = order.currentOrderStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const refundStatusCounts = this.refunds.reduce((acc, refund) => {
      const status = refund.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalOrders: this.orders.length,
      totalSpent: totalSpent,
      totalRefunded: totalRefunded,
      netSpent: netSpent,
      totalRefunds: this.refunds.length,
      orderStatusDistribution: statusCounts,
      refundStatusDistribution: refundStatusCounts,
      averageOrderValue: this.orders.length > 0 ? totalSpent / this.orders.length : 0
    };
  }

  // --- Orders Filtering ---
  onOrderFilterChange() {
    let filtered = [...this.orders];
    if (this.orderFilter.status) {
      filtered = filtered.filter(o => o.currentOrderStatus === this.orderFilter.status);
    }
    if (this.orderFilter.dateFrom) {
      const from = new Date(this.orderFilter.dateFrom);
      filtered = filtered.filter(o => new Date(o.createdDate) >= from);
    }
    if (this.orderFilter.dateTo) {
      const to = new Date(this.orderFilter.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.createdDate) <= to);
    }
    if (this.orderFilter.search.trim()) {
      const term = this.orderFilter.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toString().includes(term) ||
        (o.items && o.items.some(item => item.product.name.toLowerCase().includes(term))) ||
        (o.currentOrderStatus && o.currentOrderStatus.toLowerCase().includes(term))
      );
    }
    this.filteredOrders = filtered;
  }

  clearOrderFilters() {
    this.orderFilter = { status: '', dateFrom: '', dateTo: '', search: '' };
    this.onOrderFilterChange();
  }

  clearRefundFilters() {
    this.refundFilter = { status: '', dateFrom: '', dateTo: '', search: '' };
    this.onRefundFilterChange();
  }

  // --- Refunds Filtering ---
  onRefundFilterChange() {
    let filtered = [...this.refunds];
    if (this.refundFilter.status) {
      filtered = filtered.filter(r => r.status === this.refundFilter.status);
    }
    if (this.refundFilter.dateFrom) {
      const from = new Date(this.refundFilter.dateFrom);
      filtered = filtered.filter(r => new Date(r.createdAt || 0) >= from);
    }
    if (this.refundFilter.dateTo) {
      const to = new Date(this.refundFilter.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.createdAt || 0) <= to);
    }
    if (this.refundFilter.search.trim()) {
      const term = this.refundFilter.search.toLowerCase();
      filtered = filtered.filter(r =>
        (r.id && r.id.toString().includes(term)) ||
        (r.orderId && r.orderId.toString().includes(term)) ||
        (r.items && r.items.some(item => (item.productName || '').toLowerCase().includes(term))) ||
        (r.status && r.status.toLowerCase().includes(term))
      );
    }
    this.filteredRefunds = filtered;
  }

  // --- Helpers for UI ---
  getOrderStatusClass(status: string): string {
    switch (status) {
      case ORDER_STATUS.ORDER_PENDING:
        return 'badge bg-warning text-dark';
      case ORDER_STATUS.ORDER_CONFIRMED:
        return 'badge bg-info';
      case ORDER_STATUS.PACKED:
      case ORDER_STATUS.SHIPPED:
        return 'badge bg-primary';
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        return 'badge bg-info';
      case ORDER_STATUS.DELIVERED:
        return 'badge bg-success';
      case ORDER_STATUS.ORDER_CANCELLED:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
  getRefundStatusClass(status: string): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return 'badge bg-primary';
      case RefundStatus.IN_PROGRESS:
        return 'badge bg-warning text-dark';
      case RefundStatus.COMPLETED:
        return 'badge bg-success';
      case RefundStatus.REJECTED:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
  getOrderProductSummary(order: OrderDetail): string {
    if (!order.items || order.items.length === 0) return '—';
    return order.items.map(item => `${item.product.name} (x${item.quantity})`).join(', ');
  }
  getRefundProductSummary(refund: RefundRequestDTO): string {
    if (!refund.items || refund.items.length === 0) return '—';
    return refund.items.map(item => `${item.productName || 'Product'} (x${item.quantity})`).join(', ');
  }
  getRefundItemPrice(item: RefundItemDTO, order: OrderDetail | undefined): number {
    // Try to get price from order item
    if (!order) return 0;
    const orderItem = order.items.find(oi => oi.id === item.orderItemId);
    return orderItem?.price || 0;
  }
  getRefundTotal(refund: RefundRequestDTO): number {
    // Find the order for this refund
    const order = this.orders.find(o => o.id === refund.orderId);
    if (!refund.items || refund.items.length === 0) return 0;
    return refund.items.reduce((sum, item) => sum + (item.quantity * this.getRefundItemPrice(item, order)), 0);
  }
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  formatDateTime(date: string | Date | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // For navigation to detail pages
  goToOrderDetail(orderId: number) {
    // Implement navigation logic as needed
  }
  goToRefundDetail(refundId: number) {
    // Implement navigation logic as needed
  }
}
