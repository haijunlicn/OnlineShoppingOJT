import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '@app/core/services/order.service';
import { RefundRequestService } from '@app/core/services/refundRequestService';
import { User } from '@app/core/models/User';
import { OrderDetail, ORDER_STATUS, OrderItemDetail } from '@app/core/models/order.dto';
import { RefundRequestDTO, RefundStatus, RefundItemDTO } from '@app/core/models/refund.model';
import { AdminAccountService } from '@app/core/services/admin-account.service';

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

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private refundRequestService: RefundRequestService,
    private adminAccountService: AdminAccountService
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
