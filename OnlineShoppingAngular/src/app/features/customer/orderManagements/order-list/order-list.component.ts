import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { OrderService } from '@app/core/services/order.service';

export interface OrderDTO {
  id: number;
  userId?: number;
  trackingNumber?: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending' | string;
  delFg?: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  paymentProofPath?: string | null;
  shippingFee?: number;
  totalAmount: number;
  deliveryMethodId?: number;
  userAddressId?: number;
}

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})

export class OrderListComponent implements OnInit {
  orders: OrderDTO[] = [];

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (userId != null) {
      this.orderService.getOrdersByUserId(userId).subscribe({
        next: (orders) => this.orders = orders,
        error: (err) => {
          console.error('Failed to load orders', err);
        }
      });
    } else {
      // handle case if user is not logged in
      this.orders = [];
    }
  }

  goToRefund(): void {
    this.router.navigate(['/refund']);
  }
}