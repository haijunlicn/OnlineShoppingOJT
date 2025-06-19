import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentMethodDTO } from '@app/core/models/payment';
import { PaymentMethodService } from '@app/core/services/paymentmethod.service';

@Component({
  selector: 'app-payment-create',
  standalone: false,
  templateUrl: './payment-create.component.html',
  styleUrls: ['./payment-create.component.css'] // ✅ fixed typo (was `styleUrl`)
})
export class PaymentCreateComponent {
  methodName = '';
  qrPath = '';
  logoPath = '';
  selectedQRFile?: File;
  selectedLogoFile?: File;
  uploading = false;
  message = '';

  constructor(
    private paymentmethodService: PaymentMethodService,
    private router: Router
  ) {}

  onQRFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedQRFile = file;
    }
  }

  onLogoFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
    }
  }

  uploadAndSave() {
    if (!this.methodName) {
      this.message = 'Please enter a payment method name.';
      return;
    }
    if (!this.selectedQRFile) {
      this.message = 'Please select a QR code image to upload.';
      return;
    }
    if (!this.selectedLogoFile) {
      this.message = 'Please select a Logo image to upload.';
      return;
    }

    this.uploading = true;

    // Upload both QR and Logo in parallel
    const uploadQR$ = this.paymentmethodService.uploadImage(this.selectedQRFile);
    const uploadLogo$ = this.paymentmethodService.uploadImage(this.selectedLogoFile);

    uploadQR$.subscribe({
      next: (qrUrl: string) => {
        this.qrPath = qrUrl;

        uploadLogo$.subscribe({
          next: (logoUrl: string) => {
            this.logoPath = logoUrl;

            // Build DTO
            const dto: PaymentMethodDTO = {
              id: 0,
              methodName: this.methodName,
              qrPath: this.qrPath,
              logo: this.logoPath,
              status: 1
            
            };

            // Save DTO
            this.paymentmethodService.createPaymentMethod(dto).subscribe({
              next: () => {
                this.uploading = false;
                this.router.navigate(['/admin/payment-list']);
              },
              error: (err) => {
                this.uploading = false;
                this.message = 'Failed to save payment method: ' + err.message;
              }
            });
          },
          error: (err) => {
            this.uploading = false;
            this.message = 'Logo upload failed: ' + err.message;
          }
        });
      },
      error: (err) => {
        this.uploading = false;
        this.message = 'QR code upload failed: ' + err.message;
      }
    });
  }
}
