import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentMethodDTO } from '@app/core/models/payment';
import { PaymentMethodService } from '@app/core/services/paymentmethod.service';

@Component({
  selector: 'app-payment-update',
  standalone: false,
  templateUrl: './payment-update.component.html',
  styleUrls: ['./payment-update.component.css']
})
export class PaymentUpdateComponent implements OnInit {
  paymentMethod: PaymentMethodDTO = {
    id: 0,
    methodName: '',
    qrPath: '',
    status: 1,
    createdDate: new Date(),
    updatedDate: new Date(),
  };

  selectedFile?: File;
  uploading = false;
  message = '';

  constructor(
    private paymentmethodService: PaymentMethodService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.paymentmethodService.getById(id).subscribe({
        next: (data) => {
          this.paymentMethod = data;
        },
        error: () => {
          this.message = 'Failed to load payment method.';
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  updateAndSave() {
    if (!this.paymentMethod.methodName) {
      this.message = 'Please enter a payment method name.';
      return;
    }

    this.uploading = true;

    if (this.selectedFile) {
      this.paymentmethodService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl: string) => {
          this.paymentMethod.qrPath = imageUrl;
          this.saveUpdatedMethod();
        },
        error: (err) => {
          this.message = 'Image upload failed: ' + err.message;
          this.uploading = false;
        }
      });
    } else {
      this.saveUpdatedMethod();
    }
  }

  private saveUpdatedMethod(): void {
    this.paymentMethod.updatedDate = new Date();

    this.paymentmethodService.updatePaymentMethod(this.paymentMethod).subscribe({
      next: () => {
        this.uploading = false;
        this.router.navigate(['/admin/payment-list']);
      },
      error: (err) => {
        this.uploading = false;
        this.message = 'Failed to update payment method: ' + err.message;
      }
    });
  }
}
