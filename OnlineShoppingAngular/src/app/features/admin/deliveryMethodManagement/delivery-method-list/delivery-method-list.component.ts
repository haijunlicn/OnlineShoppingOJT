import { Component, OnInit } from '@angular/core';
import { DeliveryMethodService } from '@app/core/services/delivery-method.service';
import { DeliveryMethod } from '@app/core/models/delivery-method.model';

@Component({
  selector: 'app-delivery-method-list',
  standalone: false,
  templateUrl: './delivery-method-list.component.html',
  styleUrls: ['./delivery-method-list.component.css']
})
export class DeliveryMethodListComponent implements OnInit {
  deliveryMethods: DeliveryMethod[] = [];
  isLoading = false;
  error = '';
  searchTerm = '';
  selectedMethod: DeliveryMethod | null = null;

  constructor(private deliveryMethodService: DeliveryMethodService) {}

  ngOnInit() {
    this.loadMethods();
  }

  loadMethods() {
    this.isLoading = true;
    this.deliveryMethodService.getAll().subscribe({
      next: (methods) => {
        this.deliveryMethods = methods;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load delivery methods';
        this.isLoading = false;
      }
    });
  }

  search() {
    // No need to implement, filtering is handled by the getter below
  }

  confirmDelete(method: DeliveryMethod) {
    this.selectedMethod = method;
  }

  deleteMethod() {
    if (!this.selectedMethod) return;
    this.deliveryMethodService.delete(this.selectedMethod.id).subscribe({
      next: () => {
        this.loadMethods();
        this.selectedMethod = null;
      },
      error: () => {
        this.error = 'Failed to delete delivery method';
      }
    });
  }

  // Filtering logic for the template
  get filteredDeliveryMethods(): DeliveryMethod[] {
    if (!this.searchTerm.trim()) return this.deliveryMethods;
    const term = this.searchTerm.trim().toLowerCase();
    return this.deliveryMethods.filter(method =>
      method.name.toLowerCase().includes(term)
    );
  }
}
