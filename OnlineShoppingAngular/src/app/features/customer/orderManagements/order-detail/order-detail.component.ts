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
  ) { }

  ngOnInit(): void {

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
        console.log("order details:", this.order);
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

  goToRefundForm(): void {
    if (!this.order?.id) return; // Safety check
    this.router.navigate(['/customer/refundRequest', this.order.id]);
  }

  copyTrackingNumber(): void {
    if (this.order?.trackingNumber) {
      navigator.clipboard.writeText(this.order.trackingNumber).then(() => {
        console.log('Tracking number copied to clipboard');
      });
    }
  }

  formatShortDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
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

  onPaymentLogoError(event: Event): void {
    try {
      const target = event.target as HTMLImageElement;
      if (target) {
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = '<i class="fas fa-credit-card"></i>';
        }
      }
    } catch (error) {
      console.error('Error handling payment logo error:', error);
    }
  }

  viewPaymentProof(): void {
    if (this.order?.paymentProofPath) {
      window.open(this.order.paymentProofPath, '_blank');
    }
  }

  // Status bar methods
  getStatusSteps(): any[] {
    const currentStatus = this.order?.paymentStatus || 'PENDING';
    const steps = [
      { label: 'Order Placed', icon: 'fas fa-shopping-cart', status: 'PENDING' },
      { label: 'Payment Confirmed', icon: 'fas fa-credit-card', status: 'PAID' },
      { label: 'Processing', icon: 'fas fa-cog', status: 'PROCESSING' },
      { label: 'Shipped', icon: 'fas fa-truck', status: 'SHIPPED' },
      { label: 'Delivered', icon: 'fas fa-check-circle', status: 'DELIVERED' }
    ];

    const statusOrder = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      let stepClass = 'pending';
      let connectorClass = 'pending';

      if (index < currentIndex) {
        stepClass = 'completed';
        connectorClass = 'completed';
      } else if (index === currentIndex) {
        stepClass = 'current';
        connectorClass = 'pending';
      }

      if (currentStatus === 'CANCELLED') {
        stepClass = index === 0 ? 'completed' : 'cancelled';
        connectorClass = 'cancelled';
      }

      return {
        ...step,
        class: stepClass,
        connectorClass: connectorClass
      };
    });
  }

  getProgressPercent(): number {
    const currentStatus = this.order?.paymentStatus || 'PENDING';
    const statusOrder = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (currentStatus === 'CANCELLED') return 0;
    if (currentIndex === -1) return 0;
    
    return ((currentIndex + 1) / statusOrder.length) * 100;
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'fas fa-clock';
      case 'PAID':
        return 'fas fa-check-circle';
      case 'PROCESSING':
        return 'fas fa-cog';
      case 'SHIPPED':
        return 'fas fa-truck';
      case 'DELIVERED':
        return 'fas fa-box-open';
      case 'CANCELLED':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  getStatusMessage(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Order is being processed';
      case 'PAID':
        return 'Payment confirmed, preparing your order';
      case 'PROCESSING':
        return 'Your order is being prepared';
      case 'SHIPPED':
        return 'Your order is on the way!';
      case 'DELIVERED':
        return 'Order delivered successfully';
      case 'CANCELLED':
        return 'Order has been cancelled';
      default:
        return 'Order status unknown';
    }
  }
}