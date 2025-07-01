import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
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
        this.error = 'Failed to load order details. Please try again.';
        this.loading = false;
      }
    });
    this.subscriptions.push(orderSub);
  }

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
}
