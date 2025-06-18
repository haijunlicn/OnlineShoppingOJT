import { Component, OnInit } from '@angular/core';
import { PaymentMethodDTO } from '@app/core/models/payment';
import { PaymentMethodService } from '@app/core/services/paymentmethod.service';

@Component({
  selector: 'app-payment-list',
  standalone: false,
  templateUrl: './payment-list.component.html',
    styleUrl: './payment-list.component.css'

})
export class PaymentListComponent implements OnInit {
  payments: PaymentMethodDTO[] = [];
  message = '';

  constructor(private paymentmethodService: PaymentMethodService) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.paymentmethodService.getAllPaymentMethods().subscribe({
      next: (data) => {
        this.payments = data;
      },
      error: (err) => {
        this.message = 'Failed to load payment methods: ' + err.message;
      },
    });
  }

  deletePayment(id: number) {
    this.paymentmethodService.deletePaymentMethod(id).subscribe({
      next: () => {
        this.message = 'Payment method deleted.';
        this.loadPayments();
      },
      error: (err) => {
        this.message = 'Delete failed: ' + err.message;
      },
    });
  }
}
