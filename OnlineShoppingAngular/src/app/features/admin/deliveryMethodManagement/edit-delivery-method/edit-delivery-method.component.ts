import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-delivery-method',
  standalone:false,
  templateUrl: './edit-delivery-method.component.html',
  styleUrls: ['./edit-delivery-method.component.css']
})
export class EditDeliveryMethodComponent implements OnInit {
  method: DeliveryMethod | null = null;
  isLoading = false;
  error = '';
  iconPreview: string | null = null;
  selectedIconFile: File | null = null;
  sampleDistance: number | null = null;
  calculatedSampleFee: number | null = null;
  feeCalculationType: 'inCity' | 'outCity' = 'inCity'; // New property for fee type selection

  constructor(
    private deliveryMethodService: DeliveryMethodService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isLoading = true;
      this.deliveryMethodService.getById(id).subscribe({
        next: (method) => {
          this.method = method;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load delivery method';
          this.isLoading = false;
        }
      });
    }
  }

  onIconSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedIconFile = file;
      const reader = new FileReader();
      reader.onload = e => this.iconPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (!this.method) return;
    this.isLoading = true;
    if (this.selectedIconFile) {
      this.deliveryMethodService.updateWithIcon(this.method.id, this.method, this.selectedIconFile).subscribe({
        next: () => {
          this.router.navigate(['/admin/delivery-method-list']);
        },
        error: () => {
          this.error = 'Failed to update delivery method';
          this.isLoading = false;
        }
      });
    } else {
      this.deliveryMethodService.update(this.method).subscribe({
        next: () => {
          this.router.navigate(['/admin/delivery-method-list']);
        },
        error: () => {
          this.error = 'Failed to update delivery method';
          this.isLoading = false;
        }
      });
    }
  }

  calculateSampleFee() {
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

    const min = this.method && this.method.minDistance != null ? this.method.minDistance : 0;
    if (distance < min) {
      Swal.fire(`Sample distance must not be less than the minimum (${min} km).`, '', 'warning');
      return;
    }

    if (
      this.method &&
      this.method.maxDistance != null &&
      distance > this.method.maxDistance
    ) {
      Swal.fire(`Sample distance must not exceed the maximum (${this.method.maxDistance} km).`, '', 'warning');
      return;
    }

    // Check if required fields are filled based on fee calculation type
    if (this.feeCalculationType === 'inCity') {
      if (
        this.method &&
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
        this.method &&
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
}
