import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateProductRequestDTO, ProductCardItem } from '@app/core/models/product.model';
import { AlertService } from '@app/core/services/alert.service';
import { ProductService } from '@app/core/services/product.service';

@Component({
  selector: 'app-stock-update-modal',
  standalone: false,
  templateUrl: './stock-update-modal.component.html',
  styleUrl: './stock-update-modal.component.css'
})

export class StockUpdateModalComponent {
  @Input() show = false;
  @Input() product?: ProductCardItem;

  @Output() closeModal = new EventEmitter<void>();
  @Output() stockUpdated = new EventEmitter<void>();

  stockForm!: FormGroup;
  isUpdatingStock = false;

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    private productService: ProductService,
  ) { }

  ngOnInit(): void {
    this.initStockForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.initStockForm();
    }
  }

  private initStockForm(): void {
    if (!this.product) return;

    const formControls: { [key: string]: any } = {};
    this.product.variants.forEach(variant => {
      formControls[`stock_${variant.id}`] = [variant.stock, [Validators.required, Validators.min(0)]];
    });

    this.stockForm = this.fb.group(formControls);
  }

  // Helper methods to show variant info
  getOptionName(optionId: number): string {
    if (!this.product) return '';
    const option = this.product.options.find(o => o.id === optionId);
    return option?.name || '';
  }

  getOptionValue(optionId: number, optionValueId: number): string {
    if (!this.product) return '';
    const option = this.product.options.find(o => o.id === optionId);
    if (!option) return '';
    const value = option.optionValues.find(v => v.id === optionValueId);
    return value?.value || '';
  }

  getVariantStockClass(stock: number): string {
    if (stock === 0) return 'text-danger';
    if (stock <= 5) return 'text-warning';
    return 'text-success';
  }

  close(): void {
    this.closeModal.emit();
    this.isUpdatingStock = false;
  }

  submit(): void {
    if (!this.product || this.stockForm.invalid) return;

    this.isUpdatingStock = true;

    const stockUpdates: { variantId: number; newStock: number }[] = [];

    this.product.variants.forEach(variant => {
      const newStock = this.stockForm.get(`stock_${variant.id}`)?.value;
      if (newStock !== variant.stock) {
        stockUpdates.push({
          variantId: variant.id!,
          newStock: newStock
        });
      }
    });

    if (stockUpdates.length === 0) {
      this.isUpdatingStock = false;
      this.alertService.toast('No stock changes were made.', 'info');
      return;
    }

    this.productService.updateStock(this.product.product.id!, stockUpdates).subscribe({
      next: (res) => {
        // Update local product data after success
        stockUpdates.forEach(update => {
          const variant = this.product!.variants.find(v => v.id === update.variantId);
          if (variant) {
            variant.stock = update.newStock;
          }
        });

        this.alertService.toast(`Stock updated for ${stockUpdates.length} variant(s).`, 'success');
        this.stockUpdated.emit();
        this.close();
        this.initStockForm(); // Optional: to reset form values
        this.isUpdatingStock = false;
      },
      error: (err) => {
        this.alertService.toast('Failed to update stock.', 'error');
        console.error('Stock update error:', err);
        this.isUpdatingStock = false;
      }
    });
  }


  // submit(): void {
  //   if (!this.product || this.stockForm.invalid) return;

  //   this.isUpdatingStock = true;
  //   const stockUpdates: { variantId: number; newStock: number }[] = [];

  //   this.product.variants.forEach(variant => {
  //     const newStock = this.stockForm.get(`stock_${variant.id}`)?.value;
  //     if (newStock !== variant.stock) {
  //       stockUpdates.push({
  //         variantId: variant.id!,
  //         newStock: newStock
  //       });
  //     }
  //   });

  //   if (stockUpdates.length === 0) {
  //     this.isUpdatingStock = false;
  //     this.alertService.toast('No stock changes were made.', 'info');
  //     return;
  //   }


  //   // Simulate API call or replace with actual service call
  //   setTimeout(() => {
  //     // Update local data (optional, or handle in parent)
  //     stockUpdates.forEach(update => {
  //       const variant = this.product!.variants.find(v => v.id === update.variantId);
  //       if (variant) {
  //         variant.stock = update.newStock;
  //       }
  //     });

  //     this.isUpdatingStock = false;
  //     this.close();
  //     this.stockUpdated.emit();
  //     this.alertService.toast(`Stock updated for ${stockUpdates.length} variant(s)`, 'success');

  //     // Refresh form with new values
  //     this.initStockForm();
  //   }, 1500);
  // }
}
