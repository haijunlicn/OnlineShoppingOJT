import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentMethodDTO } from '@app/core/models/payment';
import { PaymentMethodService } from '@app/core/services/paymentmethod.service';


@Component({
  selector: 'app-payment-create',
  standalone: false,
  templateUrl: './payment-create.component.html',
  styleUrl: './payment-create.component.css'
})
export class PaymentCreateComponent {
  methodName = '';
  qrPath = '';
  selectedFile?: File;
  uploading = false;
  message = '';

  constructor(private paymentmethodService: PaymentMethodService,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadAndSave() {
    if (!this.methodName) {
      this.message = 'Please enter a payment method name.';
      return;
    }
    if (!this.selectedFile) {
      this.message = 'Please select a QR code image to upload.';
      return;
    }

    this.uploading = true;
    this.paymentmethodService.uploadImage(this.selectedFile).subscribe({
      next: (imageUrl: string) => {
        this.qrPath = imageUrl;

        // Create PaymentMethodDTO
        const dto: PaymentMethodDTO = {
          id: 0,
          methodName: this.methodName,
          qrPath: this.qrPath,
          status: 1,
          createdDate: new Date(),
          updatedDate: new Date(),
        };

        // Save Payment Method
       this.paymentmethodService.createPaymentMethod(dto).subscribe({
          next: () => {
            this.uploading = false;
            this.router.navigate(['/admin/payment-list']); // ✅ change path as needed
          },
          error: (err: any) => {
            this.uploading = false;
            this.message = 'Failed to save payment method: ' + err.message;
          },
        });
      },
      error: (err) => {
        this.message = 'Image upload failed: ' + err.message;
        this.uploading = false;
      },
    });
  }
}
