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
    logo: '',
    status: 1,
  };

  selectedQRFile?: File;
  selectedLogoFile?: File;
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

  updateAndSave() {
    if (!this.paymentMethod.methodName) {
      this.message = 'Please enter a payment method name.';
      return;
    }

    this.uploading = true;

    // Upload QR and Logo in parallel if needed
    const uploadQR = this.selectedQRFile
      ? this.paymentmethodService.uploadImage(this.selectedQRFile)
      : null;

    const uploadLogo = this.selectedLogoFile
      ? this.paymentmethodService.uploadImage(this.selectedLogoFile)
      : null;

    if (uploadQR && uploadLogo) {
      uploadQR.subscribe({
        next: (qrUrl) => {
          this.paymentMethod.qrPath = qrUrl;
          uploadLogo!.subscribe({
            next: (logoUrl) => {
              this.paymentMethod.logo = logoUrl;
              this.saveUpdatedMethod();
            },
            error: (err) => {
              this.message = 'Logo upload failed: ' + err.message;
              this.uploading = false;
            }
          });
        },
        error: (err) => {
          this.message = 'QR code upload failed: ' + err.message;
          this.uploading = false;
        }
      });
    } else if (uploadQR) {
      uploadQR.subscribe({
        next: (qrUrl) => {
          this.paymentMethod.qrPath = qrUrl;
          this.saveUpdatedMethod();
        },
        error: (err) => {
          this.message = 'QR code upload failed: ' + err.message;
          this.uploading = false;
        }
      });
    } else if (uploadLogo) {
      uploadLogo.subscribe({
        next: (logoUrl) => {
          this.paymentMethod.logo = logoUrl;
          this.saveUpdatedMethod();
        },
        error: (err) => {
          this.message = 'Logo upload failed: ' + err.message;
          this.uploading = false;
        }
      });
    } else {
      this.saveUpdatedMethod();
    }
  }

  private saveUpdatedMethod(): void {
this.paymentMethod.updatedDate = new Date().toISOString();

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
