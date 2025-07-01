import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: OrderDetail[] = [];
  filteredOrders: OrderDetail[] = [];
  loading = true;
  error = '';
  currentUserId = 0;
  selectedFilter = 'all';
  searchTerm = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.initializeUserFromToken();
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.id : 0;

    if (this.currentUserId) {
      this.loadOrders();
    } else {
      this.error = 'User not authenticated';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';

    const ordersSub = this.orderService.getOrdersByUserId(this.currentUserId).subscribe({
      next: (orders: OrderDetail[]) => {
        this.orders = orders.sort((a, b) => 
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
        this.filteredOrders = [...this.orders];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = 'Failed to load orders. Please try again.';
        this.loading = false;
      }
    });

    this.subscriptions.push(ordersSub);
  }

  filterOrders(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.paymentStatus?.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(order => 
        order.trackingNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }

    this.filteredOrders = filtered;
  }

  viewOrderDetail(orderId: number): void {
    this.router.navigate(['/customer/orderDetail', orderId]);
  }

  getOrderStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'payment failed':
        return 'status-failed';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getOrderStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getTotalItems(order: OrderDetail): number {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  goBackToHome(): void {
    this.router.navigate(['/customer/home']);
  }

  trackByOrderId(index: number, order: OrderDetail): number {
    return order.id;
  }

  getPendingOrders(): number {
    return this.orders.filter(order => 
      order.paymentStatus?.toLowerCase() === 'pending' || 
      order.paymentStatus?.toLowerCase() === 'payment failed'
    ).length;
  }

  getCompletedOrders(): number {
    return this.orders.filter(order => 
      order.paymentStatus?.toLowerCase() === 'paid' || 
      order.paymentStatus?.toLowerCase() === 'delivered'
    ).length;
  }

  getSubtotal(order: OrderDetail): number {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  onImageError(event: any): void {
    event.target.src = 'assets/img/error-404-monochrome.svg';
  }

  getFilteredOrdersCount(status: string): number {
    if (status === 'all') return this.orders.length;
    return this.orders.filter(order => 
      order.paymentStatus?.toLowerCase() === status.toLowerCase()
    ).length;
  }

  // Additional statistics methods
  getShippedOrders(): number {
    return this.orders.filter(order => 
      order.paymentStatus?.toLowerCase() === 'shipped'
    ).length;
  }

  getCancelledOrders(): number {
    return this.orders.filter(order => 
      order.paymentStatus?.toLowerCase() === 'cancelled'
    ).length;
  }

  getTotalAmount(): number {
    return this.orders.reduce((total, order) => total + order.totalAmount, 0);
  }
}