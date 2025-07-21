import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';

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
