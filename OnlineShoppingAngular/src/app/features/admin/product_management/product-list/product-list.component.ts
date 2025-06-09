import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryDTO } from '../../../../core/models/category-dto';
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

@Component({
  selector: 'app-premium-products',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  products: ProductListItemDTO[] = [];
=======
  products: any[] = [];
>>>>>>> Stashed changes
=======
  products: any[] = [];
>>>>>>> Stashed changes
  categories: any[] = [];
  brands: any[] = [];
  statuses: any[] = [
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Out of Stock', value: 'Out of Stock' }
  ];
<<<<<<< Updated upstream
<<<<<<< Updated upstream

  priceRange: number[] = [0, 1000];
  maxPrice: number = 1000;
  minPrice: number = 0;

  // Filter values
  selectedCategory: any = null;
  selectedBrand: any = null;
  selectedStatus: any = null;
  globalFilterValue: string = '';

  showFilters = false;

  constructor(private productService: ProductService,
    private categoryService: CategoryService
  ) { }
=======
  priceRange: number[] = [0, 1000];
  maxPrice: number = 1000;
  filters: any = {};
  showFilters = false;

  constructor(private productService: ProductService) { }
>>>>>>> Stashed changes
=======
  priceRange: number[] = [0, 1000];
  maxPrice: number = 1000;
  filters: any = {};
  showFilters = false;

  constructor(private productService: ProductService) { }
>>>>>>> Stashed changes

  ngOnInit() {
    this.loadCategories();
<<<<<<< Updated upstream
    this.loadBrands();
    this.loadProducts();
=======
    this.loadStatuses();

    this.filters = {
      'product.basePrice': { value: this.priceRange, matchMode: 'between' }
    };
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  }

  loadProducts() {
    this.productService.getProductList().subscribe({
      next: (products) => {
        console.log("product list : ", products);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        this.products = products.map(product => ({
          ...product,
          status: this.getStockStatus(product)
        }));

        if (products.length > 0) {
          const prices = products.map(p => p.product.basePrice);
          this.minPrice = Math.min(...prices);
          this.maxPrice = Math.max(...prices);
          this.priceRange = [this.minPrice, this.maxPrice];
        }
=======
        this.products = products;
        this.maxPrice = Math.max(...products.map(p => p.product.basePrice));
        this.priceRange = [0, this.maxPrice];
>>>>>>> Stashed changes
=======
        this.products = products;
        this.maxPrice = Math.max(...products.map(p => p.product.basePrice));
        this.priceRange = [0, this.maxPrice];
>>>>>>> Stashed changes
      },
      error: (err) => {
        console.error('Failed to load products', err);
      }
    });
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        this.categories = categories.map(cat => ({
          label: cat.name,
          value: cat.name
        }));
      },
      error: (error) => {
        console.error("Error loading categories:", error);
      }
    });
  }


  loadBrands() {
    this.brands = [
      { label: 'Louis Vuitton', value: 'Louis Vuitton' },
      { label: 'Gucci', value: 'Gucci' },
      { label: 'Chanel', value: 'Chanel' },
      { label: 'Hermès', value: 'Hermès' },
      { label: 'Prada', value: 'Prada' },
      { label: 'Rolex', value: 'Rolex' },
      { label: 'Cartier', value: 'Cartier' },
      { label: 'Tiffany & Co.', value: 'Tiffany & Co.' }
    ];
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.clearAllFilters();
    }
  }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  clearAllFilters() {
    this.dt.clear();
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.selectedStatus = null;
    this.globalFilterValue = '';
    this.priceRange = [this.minPrice, this.maxPrice];
  }

  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
  }

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.globalFilterValue = input.value;
    this.dt.filterGlobal(input.value, 'contains');
  }

  selectCategory(category: any) {
    this.selectedCategory = category;
    this.dt.filter(category?.value ?? null, 'category.name', 'equals');
  }

  selectBrand(brand: any) {
    this.selectedBrand = brand;
    this.dt.filter(brand?.value ?? null, 'brand.name', 'equals');
  }

  selectStatus(status: any) {
    this.selectedStatus = status;
    this.dt.filter(status?.value ?? null, 'status', 'equals');
  }

  // ✅ Use built-in 'between' match mode for range filter
  onPriceChange() {
    this.dt.filter(this.priceRange, 'product.basePrice', 'between');
  }

  onPriceInputChange() {
    // Prevent invalid range
    if (this.priceRange[0] > this.priceRange[1]) {
      this.priceRange[1] = this.priceRange[0];
    }
    this.onPriceChange();
  }

  getSelectedCategoryName(): string {
    return this.selectedCategory ? this.selectedCategory.label : '';
  }

  getSelectedBrandName(): string {
    return this.selectedBrand ? this.selectedBrand.label : '';
  }

  getSelectedStatusName(): string {
    return this.selectedStatus ? this.selectedStatus.label : '';
  }

  viewProduct(product: any): void {
    console.log('View product details:', product);
  }

  editProduct(product: any): void {
    console.log('Edit product:', product);
  }

  deleteProduct(product: any): void {
    if (confirm('Are you sure you want to delete this product?')) {
      console.log('Delete product:', product);
    }
  }

  // Add this method for Option 4 preset buttons
  setPresetRange(min: number, max: number) {
    this.priceRange = [min, max];
    this.onPriceChange();
=======
  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
>>>>>>> Stashed changes
  }

=======
  getStockStatus(product: ProductListItemDTO): string {
    return product.variants.some(v => v.stock > 0) ? 'In Stock' : 'Out of Stock';
  }

>>>>>>> Stashed changes
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
