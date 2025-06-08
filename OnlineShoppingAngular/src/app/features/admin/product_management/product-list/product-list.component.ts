import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-premium-products',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  products: any[] = [];
  categories: any[] = [];
  brands: any[] = [];
  statuses: any[] = [
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Out of Stock', value: 'Out of Stock' }
  ];
  priceRange: number[] = [0, 1000];
  maxPrice: number = 1000;
  filters: any = {};
  showFilters = false;

  constructor(private productService: ProductService) { }

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadStatuses();

    this.filters = {
      'product.basePrice': { value: this.priceRange, matchMode: 'between' }
    };
  }

  loadProducts() {
    this.productService.getProductList().subscribe({
      next: (products) => {
        console.log("product list : ", products);

        this.products = products;
        this.maxPrice = Math.max(...products.map(p => p.product.basePrice));
        this.priceRange = [0, this.maxPrice];
      },
      error: (err) => {
        console.error('Failed to load products', err);
      }
    });
  }

  loadCategories() {
    // Use unique categories from products, or predefined list
    this.categories = [
      { label: 'Luxury Handbag', value: 'Luxury Handbag' },
      { label: 'Watches', value: 'Watches' },
    ];
  }

  loadStatuses() {
    this.statuses = [
      { label: 'In Stock', value: true },
      { label: 'Out of Stock', value: false },
    ];
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      // Reset all filters on hide
      this.dt.clear();
      this.priceRange = [0, this.maxPrice];
    }
  }

  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
  }

  onFilterInput(event: Event, field: string) {
    const input = event.target as HTMLInputElement;  // Cast target here
    this.dt.filter(input.value, field, 'contains');
  }

  onPriceChange(event: any) {
    this.filters['product.basePrice'] = { value: this.priceRange, matchMode: 'between' };
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dt.filterGlobal(input.value, 'contains');
  }

  // Add these methods to your component class if they don't exist already

  viewProduct(product: any): void {
    // Implement view product details logic
    console.log('View product details:', product);
    // You could navigate to a details page or open a modal
    // this.router.navigate(['/admin/products', product.id]);
  }

  editProduct(product: any): void {
    // Implement edit product logic
    console.log('Edit product:', product);
    // You could navigate to an edit page
    // this.router.navigate(['/admin/productEdit', product.id]);
  }

  deleteProduct(product: any): void {
    // Implement delete product logic with confirmation
    // You could use PrimeNG's ConfirmDialog here
    if (confirm('Are you sure you want to delete this product?')) {
      console.log('Delete product:', product);
      // this.productService.deleteProduct(product.id).subscribe(() => {
      //   this.products = this.products.filter(p => p.id !== product.id);
      //   this.messageService.add({severity:'success', summary: 'Success', detail: 'Product deleted'});
      // });
    }
  }

}
