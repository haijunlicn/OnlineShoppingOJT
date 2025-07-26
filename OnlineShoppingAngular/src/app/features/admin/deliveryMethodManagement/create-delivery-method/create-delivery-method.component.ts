import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-delivery-method',
  standalone:false,
  templateUrl: './create-delivery-method.component.html',
  styleUrls: ['./create-delivery-method.component.css']
})
export class CreateDeliveryMethodComponent {
  method: Partial<DeliveryMethod> = {};
  isLoading = false;
  error = '';
  iconPreview: string | null = null;
  selectedIconFile: File | null = null;
  sampleDistance: number | null = null;
  calculatedSampleFee: number | null = null;
  sampleFeeError: string | null = null;
  feeCalculationType: 'inCity' | 'outCity' = 'inCity'; // New property for fee type selection

  constructor(private deliveryMethodService: DeliveryMethodService, private router: Router) {}

  onIconSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedIconFile = file;
      const reader = new FileReader();
      reader.onload = e => this.iconPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  calculateSampleFee() {
    this.sampleFeeError = null;
    this.calculatedSampleFee = null;

    const distance = typeof this.sampleDistance === 'string'
      ? Number(this.sampleDistance)
      : this.sampleDistance;

    if (
      distance == null ||
      isNaN(distance) ||
      distance === 0
    ) {
      Swal.fire('Please enter a sample distance.', '', 'warning');
      return;
    }

    // Always check for negative or less than minDistance
    const min = this.method.minDistance != null ? this.method.minDistance : 0;
    if (distance < min) {
      Swal.fire(`Sample distance must not be less than the minimum (${min} km).`, '', 'warning');
      return;
    }

    if (
      this.method.maxDistance != null &&
      distance > this.method.maxDistance
    ) {
      Swal.fire(`Sample distance must not exceed the maximum (${this.method.maxDistance} km).`, '', 'warning');
      return;
    }

    // Check if required fields are filled based on fee calculation type
    if (this.feeCalculationType === 'inCity') {
      if (
        this.method.baseFee != null &&
        this.method.feePerKm != null
      ) {
        this.calculatedSampleFee =
          this.method.baseFee + this.method.feePerKm * distance;
        Swal.fire(
          `Delivery fee for ${distance} km (In City)`,
          `<b>${this.calculatedSampleFee}</b> MMK`,
          'info'
        );
      } else {
        Swal.fire('Please fill in both Base Fee and Fee Per Km (In City).', '', 'warning');
      }
    } else {
      if (
        this.method.baseFee != null &&
        this.method.feePerKmOutCity != null
      ) {
        this.calculatedSampleFee =
          this.method.baseFee + this.method.feePerKmOutCity * distance;
        Swal.fire(
          `Delivery fee for ${distance} km (Out of City)`,
          `<b>${this.calculatedSampleFee}</b> MMK`,
          'info'
        );
      } else {
        Swal.fire('Please fill in both Base Fee and Fee Per Km (Out of City).', '', 'warning');
      }
    }
  }

  save() {
    this.isLoading = true;
    // If an icon file is selected, set the icon field to the base64 string for now
    if (this.iconPreview) {
      this.method.icon = this.iconPreview;
    }
    this.deliveryMethodService.create(this.method as DeliveryMethod).subscribe({
      next: () => {
        this.router.navigate(['/admin/delivery-method-list']);
      },
      error: () => {
        this.error = 'Failed to create delivery method';
        this.isLoading = false;
      }
    });
  }
}
