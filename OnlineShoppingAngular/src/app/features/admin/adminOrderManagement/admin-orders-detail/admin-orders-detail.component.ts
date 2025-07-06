import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import Swal from 'sweetalert2';

// Define all possible order statuses
export type OrderStatus = 'pending' | 'order_confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-admin-order-detail',
  standalone: false,
  templateUrl: './admin-orders-detail.component.html',
  styleUrl: './admin-orders-detail.component.css'
})
export class AdminOrdersDetailComponent implements OnInit, OnDestroy {
  orderId: number = 0;
  order: OrderDetail | null = null;
  loading = true;
  error = '';
  updatingStatus = false;
  updateStatusError = '';
  private subscriptions: Subscription[] = [];
  selectedStatus: OrderStatus | null = null;

  // Allowed status transitions
  allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['order_confirmed', 'cancelled'],
    order_confirmed: ['packed'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: []
  };

  // List of all statuses
  statusList: OrderStatus[] = [
    'pending',
    'order_confirmed',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  // Map status to DB id
  statusMap: Record<OrderStatus, number> = {
    pending: 0, // if not in DB, just for UI
    order_confirmed: 1,
    packed: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: 5
  };

  // Map DB code to UI status
  dbToUiStatus: Record<string, OrderStatus> = {
    PENDING: 'pending',
    ORDER_CONFIRMED: 'order_confirmed',
    PACKED: 'packed',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  };

  // Map statusId to DB code
  statusIdToCode: Record<number, string> = {
    0: 'PENDING',
    1: 'ORDER_CONFIRMED',
    2: 'PACKED',
    3: 'OUT_FOR_DELIVERY',
    4: 'DELIVERED',
    5: 'CANCELLED'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.params.subscribe(params => {
        this.orderId = +params['id'];
        if (this.orderId) {
          this.loadOrderDetails();
        } else {
          this.error = 'Invalid order ID';
          this.loading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Load order details from the service
  loadOrderDetails(): void {
    this.loading = true;
    this.error = '';
    const orderSub = this.orderService.getOrderDetails(this.orderId).subscribe({
      next: (order: OrderDetail) => {
        this.order = order;
        this.loading = false;
        // Set selectedStatus to first allowed transition
        const allowed = this.allowedTransitions[this.getCurrentUiStatus()] || [];
        this.selectedStatus = allowed.length > 0 ? allowed[0] : null;
      },
      error: (err) => {
        this.error = 'Failed to load order details. Please try again.';
        this.loading = false;
      }
    });
    this.subscriptions.push(orderSub);
  }

  // Update the order status
  updateOrderStatus(newStatusId: number, note: string = 'Status updated by admin', updatedBy: number = 1): void {
    if (!this.order) return;
    this.updatingStatus = true;
    this.updateStatusError = '';
    this.orderService.bulkUpdateOrderStatus([this.order.id], newStatusId, note, updatedBy).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.loadOrderDetails(); // Refresh order details
      },
      error: () => {
        this.updatingStatus = false;
        this.updateStatusError = 'Failed to update order status.';
      }
    });
  }

  // Format date for display
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format currency for display
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0 MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Get CSS class for order status badge
  getOrderStatusClass(status: string | null | undefined): string {
    if (!status) return 'badge-primary';
    switch (status.toLowerCase()) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'payment failed': return 'badge-danger';
      case 'shipped': return 'badge-info';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-primary';
    }
  }

  // Get label for a given status
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'order_confirmed': return 'Order Confirmed';
      case 'packed': return 'Packed';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  // Get CSS class for a given status
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'order_confirmed': return 'badge-primary';
      case 'packed': return 'badge-info';
      case 'out_for_delivery': return 'badge-purple';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-primary';
    }
  }

  // Confirm and update status with validation
  confirmStatusUpdate(newStatus?: OrderStatus) {
    if (!this.order) return;
    const statusToUpdate = newStatus || this.selectedStatus;
    if (!statusToUpdate) return;
    const currentStatus = this.getCurrentUiStatus();
    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(statusToUpdate)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Status Change',
        text: `You can only change status from "${this.getStatusLabel(currentStatus)}" to "${allowed.map(s => this.getStatusLabel(s)).join(', ') || 'No further status'}".`,
      });
      return;
    }
    this.updateOrderStatus(this.statusMap[statusToUpdate]);
  }

  // Get CSS class for status by DB id
  getStatusClassById(statusId: number): string {
    const code = this.statusIdToCode[statusId];
    const uiStatus = this.dbToUiStatus[code];
    return this.getStatusClass(uiStatus);
  }

  // Get label for status by DB id
  getStatusLabelById(statusId: number): string {
    const code = this.statusIdToCode[statusId];
    const uiStatus = this.dbToUiStatus[code];
    return this.getStatusLabel(uiStatus);
  }

  // Get the current UI status from order history or payment status
  getCurrentUiStatus(): OrderStatus {
    let statusId = this.order?.statusHistory?.length
      ? this.order.statusHistory[this.order.statusHistory.length - 1].statusId
      : undefined;

    let code = statusId !== undefined
      ? this.statusIdToCode[statusId]
      : (this.order?.paymentStatus?.toUpperCase() || undefined);

    let uiStatus = code ? this.dbToUiStatus[code] : undefined;

    const validStatuses: OrderStatus[] = [
      'pending',
      'order_confirmed',
      'packed',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    if (uiStatus && validStatuses.includes(uiStatus)) {
      return uiStatus;
    }
    return 'pending';
  }

  // Calculate total for an item
  calculateItemTotal(item: any): number {
    if (!item || !item.quantity || !item.price) return 0;
    return item.quantity * item.price;
  }

  // Get total number of items in the order
  getTotalItems(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  // Get subtotal (sum of all item totals)
  getSubtotal(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }

  // Handle image error for product/variant images
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/img/default-product.jpg';
    }
  }

  // Get icon for delivery method
  getDeliveryMethodIcon(methodName: string | null | undefined): string {
    if (!methodName) return 'fas fa-shipping-fast';
    const name = methodName.toLowerCase();
    if (name.includes('bike') || name.includes('bicycle')) {
      return 'fas fa-bicycle';
    } else if (name.includes('car')) {
      return 'fas fa-car';
    } else if (name.includes('truck')) {
      return 'fas fa-truck';
    } else {
      return 'fas fa-shipping-fast';
    }
  }

  // --- TIMELINE/PROGRESS BAR METHODS (for modern UI) ---
  getTimelineItems(): any[] {
    const timelineItems = [];
    const currentStatus = this.getCurrentUiStatus();
    // Step 1: Pending
    timelineItems.push({
      id: 'pending',
      title: 'Pending',
      icon: 'fas fa-hourglass-start',
      status: ['pending','order_confirmed','packed','out_for_delivery','delivered'].includes(currentStatus) ? 'completed' : (currentStatus === 'cancelled' ? 'cancelled' : 'pending')
    });
    // Step 2: Order Confirmed
    timelineItems.push({
      id: 'order_confirmed',
      title: 'Order Confirmed',
      icon: 'fas fa-check-circle',
      status: ['order_confirmed','packed','out_for_delivery','delivered'].includes(currentStatus) ? 'completed' : (currentStatus === 'cancelled' ? 'cancelled' : 'pending')
    });
    // Step 3: Packed
    timelineItems.push({
      id: 'packed',
      title: 'Packed',
      icon: 'fas fa-box',
      status: ['packed','out_for_delivery','delivered'].includes(currentStatus) ? 'completed' : (currentStatus === 'cancelled' ? 'cancelled' : 'pending')
    });
    // Step 4: Out for Delivery
    timelineItems.push({
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      icon: 'fas fa-truck',
      status: ['out_for_delivery','delivered'].includes(currentStatus) ? 'completed' : (currentStatus === 'cancelled' ? 'cancelled' : 'pending')
    });
    // Step 5: Delivered
    timelineItems.push({
      id: 'delivered',
      title: 'Delivered',
      icon: 'fas fa-home',
      status: currentStatus === 'delivered' ? 'completed' : (currentStatus === 'cancelled' ? 'cancelled' : 'pending')
    });
    // If cancelled, mark all as cancelled after the current status
    if (currentStatus === 'cancelled') {
      let found = false;
      for (const item of timelineItems) {
        if (item.id === this.getCurrentUiStatus()) found = true;
        if (found) item.status = 'cancelled';
      }
    }
    return timelineItems;
  }

  getProgressPercent(): number {
    const currentStatus = this.getCurrentUiStatus();
    const steps = ['pending','order_confirmed','packed','out_for_delivery','delivered'];
    if (currentStatus === 'cancelled') return 0;
    const idx = steps.indexOf(currentStatus);
    if (idx === -1) return 0;
    return ((idx + 1) / steps.length) * 100;
  }

  // Get icon for order status badge
  getOrderStatusIcon(status: string | null | undefined): string {
    if (!status) return 'fas fa-info-circle';
    switch (status.toLowerCase()) {
      case 'paid': return 'fas fa-check-circle';
      case 'pending': return 'fas fa-clock';
      case 'payment failed': return 'fas fa-times-circle';
      case 'shipped': return 'fas fa-shipping-fast';
      case 'delivered': return 'fas fa-box-open';
      case 'cancelled': return 'fas fa-ban';
      default: return 'fas fa-info-circle';
    }
  }

  // Back to orders list
  goBack(): void {
    this.router.navigate(['/admin/AdminOrder']);
  }
}
