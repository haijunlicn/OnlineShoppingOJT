import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';

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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0 MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
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
    return item.quantity * item.price;
  }

  getEstimatedDeliveryDate(): string {
    if (!this.order?.createdDate) return '';
    
    const orderDate = new Date(this.order.createdDate);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from order date
    
    return deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    return this.order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  getSubtotal(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }

  // Method to handle image errors safely
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/img/default-product.jpg';
    }
  }

  // Timeline Methods
  getTimelineItems(): any[] {
    const timelineItems = [];
    const currentStatus = this.getCurrentOrderStatus();
    
    // Step 1: Order Placed (Always completed)
    timelineItems.push({
      id: 'order-placed',
      title: 'Order Placed',
      description: 'Your order has been successfully placed',
      date: this.order?.createdDate,
      icon: 'fas fa-shopping-cart',
      status: 'completed',
      isFirst: true
    });

    // Step 2: Order Confirmed
    const confirmedStatus = currentStatus === 'pending' || currentStatus === 'paid' || 
                           currentStatus === 'shipped' || currentStatus === 'delivered' ? 'completed' : 'pending';
    timelineItems.push({
      id: 'order-confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and is being prepared',
      date: this.order?.createdDate,
      icon: 'fas fa-check-circle',
      status: confirmedStatus
    });

    // Step 3: Packed
    const packedStatus = currentStatus === 'paid' || currentStatus === 'shipped' || 
                        currentStatus === 'delivered' ? 'completed' : 'pending';
    timelineItems.push({
      id: 'order-packed',
      title: 'Packed',
      description: 'Your order has been packed and is ready for shipping',
      date: this.order?.updatedDate || this.order?.createdDate,
      icon: 'fas fa-box',
      status: packedStatus
    });

    // Step 4: Out for Delivery
    const outForDeliveryStatus = currentStatus === 'shipped' || currentStatus === 'delivered' ? 'completed' : 'pending';
    timelineItems.push({
      id: 'out-for-delivery',
      title: 'Out for Delivery',
      description: 'Your order is out for delivery',
      date: this.order?.updatedDate || this.order?.createdDate,
      icon: 'fas fa-truck',
      status: outForDeliveryStatus
    });

    // Step 5: Delivered
    const deliveredStatus = currentStatus === 'delivered' ? 'completed' : 'pending';
    timelineItems.push({
      id: 'order-delivered',
      title: 'Delivered',
      description: 'Your order has been successfully delivered',
      date: this.order?.updatedDate || this.getEstimatedDeliveryDate(),
      icon: 'fas fa-home',
      status: deliveredStatus,
      isLast: true
    });

    return timelineItems;
  }

  getCurrentOrderStatus(): string {
    return this.order?.paymentStatus?.toLowerCase() || 'pending';
  }

  getStatusLabelFromPaymentStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Order Confirmed',
      'paid': 'Payment Received',
      'shipped': 'Order Shipped',
      'delivered': 'Order Delivered',
      'cancelled': 'Order Cancelled',
      'payment failed': 'Payment Failed'
    };
    return statusMap[status] || 'Order Status Updated';
  }

  getStatusDescriptionFromPaymentStatus(status: string): string {
    const descriptionMap: { [key: string]: string } = {
      'pending': 'Your order has been confirmed and is awaiting payment',
      'paid': 'Payment has been successfully received and order is being processed',
      'shipped': 'Your order has been shipped and is on its way',
      'delivered': 'Your order has been successfully delivered',
      'cancelled': 'Your order has been cancelled',
      'payment failed': 'Payment processing failed. Please try again.'
    };
    return descriptionMap[status] || 'Order status has been updated';
  }

  getStatusIconFromPaymentStatus(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'fas fa-clock',
      'paid': 'fas fa-credit-card',
      'shipped': 'fas fa-shipping-fast',
      'delivered': 'fas fa-box-open',
      'cancelled': 'fas fa-ban',
      'payment failed': 'fas fa-times-circle'
    };
    return iconMap[status] || 'fas fa-info-circle';
  }

  getStatusClassFromPaymentStatus(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'processing',
      'paid': 'completed',
      'shipped': 'completed',
      'delivered': 'completed',
      'cancelled': 'cancelled',
      'payment failed': 'failed'
    };
    return classMap[status] || 'pending';
  }

  getStatusLabel(statusId: number): string {
    // Map status IDs to human-readable labels
    const statusMap: { [key: number]: string } = {
      1: 'Order Confirmed',
      2: 'Payment Received',
      3: 'Processing',
      4: 'Shipped',
      5: 'Out for Delivery',
      6: 'Delivered',
      7: 'Cancelled',
      8: 'Payment Failed'
    };
    return statusMap[statusId] || 'Status Updated';
  }

  getStatusDescription(statusId: number): string {
    // Map status IDs to descriptions
    const descriptionMap: { [key: number]: string } = {
      1: 'Your order has been confirmed and is being prepared',
      2: 'Payment has been successfully received',
      3: 'Your order is being processed and prepared for shipping',
      4: 'Your order has been shipped and is on its way',
      5: 'Your order is out for delivery',
      6: 'Your order has been successfully delivered',
      7: 'Your order has been cancelled',
      8: 'Payment processing failed'
    };
    return descriptionMap[statusId] || 'Order status has been updated';
  }

  getStatusIcon(statusId: number): string {
    // Map status IDs to icons
    const iconMap: { [key: number]: string } = {
      1: 'fas fa-check-circle',
      2: 'fas fa-credit-card',
      3: 'fas fa-cog',
      4: 'fas fa-shipping-fast',
      5: 'fas fa-truck',
      6: 'fas fa-box-open',
      7: 'fas fa-ban',
      8: 'fas fa-times-circle'
    };
    return iconMap[statusId] || 'fas fa-info-circle';
  }

  getStatusClass(statusId: number): string {
    // Map status IDs to CSS classes
    const classMap: { [key: number]: string } = {
      1: 'completed',
      2: 'completed',
      3: 'processing',
      4: 'completed',
      5: 'processing',
      6: 'completed',
      7: 'cancelled',
      8: 'failed'
    };
    return classMap[statusId] || 'pending';
  }

  isTimelineItemCompleted(item: any): boolean {
    return item.status === 'completed';
  }

  isTimelineItemProcessing(item: any): boolean {
    return item.status === 'processing';
  }

  isTimelineItemFailed(item: any): boolean {
    return item.status === 'failed' || item.status === 'cancelled';
  }

  getTimelineItemClass(item: any): string {
    let classes = 'timeline-item';
    if (this.isTimelineItemCompleted(item)) {
      classes += ' completed';
    } else if (this.isTimelineItemProcessing(item)) {
      classes += ' processing';
    } else if (this.isTimelineItemFailed(item)) {
      classes += ' failed';
    }
    return classes;
  }

  getTimelineIconClass(item: any): string {
    let classes = 'timeline-icon';
    if (this.isTimelineItemCompleted(item)) {
      classes += ' completed';
    } else if (this.isTimelineItemProcessing(item)) {
      classes += ' processing';
    } else if (this.isTimelineItemFailed(item)) {
      classes += ' failed';
    }
    return classes;
  }

  trackByTimelineItem(index: number, item: any): string {
    return item.id;
  }

  getProgressSteps() {
    // Example, adjust logic for your real statuses
    return [
      { label: 'Confirmed', icon: 'fas fa-check', completed: true, active: false },
      { label: 'Packed', icon: 'fas fa-box', completed: true, active: false },
      { label: 'Shipped', icon: 'fas fa-truck', completed: false, active: true },
      { label: 'Delivered', icon: 'fas fa-home', completed: false, active: false }
    ];
  }
  getProgressPercent() {
    const currentStatus = this.getCurrentOrderStatus();
    
    // Calculate progress based on the 5-step timeline
    switch (currentStatus) {
      case 'pending':
        return 40; // Order Placed (100%) + Order Confirmed (40%) = 40%
      case 'paid':
        return 60; // Order Placed (100%) + Order Confirmed (100%) + Packed (60%) = 60%
      case 'shipped':
        return 80; // Order Placed (100%) + Order Confirmed (100%) + Packed (100%) + Out for Delivery (80%) = 80%
      case 'delivered':
        return 100; // All steps completed
      case 'cancelled':
      case 'payment failed':
        return 20; // Only Order Placed completed
      default:
        return 20; // Default to Order Placed only
    }
  }
}
