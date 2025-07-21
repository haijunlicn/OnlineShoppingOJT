import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';

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
}
