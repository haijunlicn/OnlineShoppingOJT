import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';

// Define all possible order statuses for user
export type OrderStatus = 'pending' | 'order_confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId: number = 0;
  order: OrderDetail | null = null;
  loading = true;
  error = '';
  currentUserId = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize user ID
    // this.authService.initializeUserFromToken();
    // const user = this.authService.getCurrentUser();
    // this.currentUserId = user ? user.id : 0;

        const sub = this.authService.user$.subscribe(user => {
      this.currentUserId = user ? user.id : 0;
      console.log('Current userId from subscription:', this.currentUserId);
    });
    this.subscriptions.push(sub);

    // Get order ID from route parameters
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      if (this.orderId) {
        this.loadOrderDetails();
      } else {
        this.error = 'Invalid order ID';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadOrderDetails(): void {
    this.loading = true;
    this.error = '';

    const orderSub = this.orderService.getOrderDetails(this.orderId).subscribe({
      next: (order: OrderDetail) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.error = 'Failed to load order details. Please try again.';
        this.loading = false;
      }
    });

    this.subscriptions.push(orderSub);
  }

  getOrderStatusClass(status: string | null | undefined): string {
    if (!status) return 'badge-primary';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'payment failed':
        return 'badge-danger';
      case 'shipped':
        return 'badge-info';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  }

  getOrderStatusIcon(status: string | null | undefined): string {
    if (!status) return 'fas fa-info-circle';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'fas fa-check-circle';
      case 'pending':
        return 'fas fa-clock';
      case 'payment failed':
        return 'fas fa-times-circle';
      case 'shipped':
        return 'fas fa-shipping-fast';
      case 'delivered':
        return 'fas fa-box-open';
      case 'cancelled':
        return 'fas fa-ban';
      default:
        return 'fas fa-info-circle';
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch (error) {
      return '';
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0 MMK';
    try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
    } catch (error) {
      return '0 MMK';
    }
  }

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

  calculateItemTotal(item: any): number {
    if (!item || !item.quantity || !item.price) return 0;
    try {
      return (item.quantity || 0) * (item.price || 0);
    } catch (error) {
      return 0;
    }
  }

  getEstimatedDeliveryDate(): string {
    if (!this.order?.createdDate) return '';
    
    try {
    const orderDate = new Date(this.order.createdDate);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from order date
    
    return deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    } catch (error) {
      return '';
    }
  }

  goBackToOrders(): void {
    this.router.navigate(['/customer/orders']);
  }

  downloadInvoice(): void {
    // TODO: Implement invoice download functionality
    console.log('Download invoice for order:', this.orderId);
  }

  trackOrder(): void {
    // TODO: Implement order tracking functionality
    console.log('Track order:', this.order?.trackingNumber);
  }

  contactSupport(): void {
    // TODO: Implement contact support functionality
    console.log('Contact support for order:', this.orderId);
  }

  getTotalItems(): number {
    if (!this.order?.items) return 0;
    try {
      return this.order.items.reduce((total, item) => total + (item?.quantity || 0), 0);
    } catch (error) {
      return 0;
    }
  }

  getSubtotal(): number {
    if (!this.order?.items) return 0;
    try {
    return this.order.items.reduce((total, item) => total + this.calculateItemTotal(item), 0);
    } catch (error) {
      return 0;
    }
  }

  // Method to handle image errors safely
  onImageError(event: Event): void {
    try {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/img/default-product.jpg';
    }
    } catch (error) {
      console.error('Error handling image error:', error);
    }
  }

  // --- ORDER STATUS STEPPER/PROGRESS BAR LOGIC (copied and adapted from AdminOrdersDetailComponent) ---
  allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['order_confirmed'],
    order_confirmed: ['packed'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: []
  };

  statusList: OrderStatus[] = [
    'pending',
    'order_confirmed',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  statusMap: Record<OrderStatus, number> = {
    pending: 0,
    order_confirmed: 1,
    packed: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: 5
  };

  statusIdToCode: Record<number, string> = {
    0: 'PENDING',
    1: 'ORDER_CONFIRMED',
    2: 'PACKED',
    3: 'OUT_FOR_DELIVERY',
    4: 'DELIVERED',
    5: 'CANCELLED'
  };

  dbToUiStatus: Record<string, OrderStatus> = {
    PENDING: 'pending',
    ORDER_CONFIRMED: 'order_confirmed',
    PACKED: 'packed',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  };

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

  // --- Payment method display methods (for payment info card) ---
  getPaymentMethodName(): string {
    return this.order?.paymentMethod?.methodName || this.order?.paymentType || 'Not specified';
  }

  getPaymentMethodType(): string {
    return this.order?.paymentMethod?.type || this.order?.paymentType || 'Unknown';
  }

  getPaymentMethodIcon(): string {
    const type = this.getPaymentMethodType().toLowerCase();
    if (type === 'qr' || type === 'mobile wallet') {
      return 'fas fa-qrcode';
    } else if (type === 'credit' || type === 'credit card') {
      return 'fas fa-credit-card';
    }
    return 'fas fa-money-bill-wave';
  }

  getPaymentMethodClass(): string {
    const type = this.getPaymentMethodType().toLowerCase();
    if (type === 'qr' || type === 'mobile wallet') {
      return 'payment-qr';
    } else if (type === 'credit' || type === 'credit card') {
      return 'payment-credit';
    }
    return 'payment-default';
  }
}
