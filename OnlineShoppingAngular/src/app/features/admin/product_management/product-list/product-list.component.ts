import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  status: boolean;
  image?: string;
}

interface DropdownOption {
  label: string;
  value: string | boolean;
}

@Component({
  selector: 'app-premium-products',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  products: Product[] = [];
  categories: DropdownOption[] = [];
  statuses: DropdownOption[] = [];

  maxPrice = 1000;
  priceRange: [number, number] = [0, this.maxPrice];

  showFilters = false;

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadStatuses();
  }

  loadProducts() {
    this.products = [
      {
        id: 1,
        name: 'Luxury Handbag Classic',
        sku: 'LH-001',
        category: 'Luxury Handbag',
        price: 499,
        status: true,
        image: 'https://via.placeholder.com/60x60?text=LH1',
      },
      {
        id: 2,
        name: 'Elegant Watch 2025',
        sku: 'W-2025',
        category: 'Watches',
        price: 799,
        status: false,
        image: 'https://via.placeholder.com/60x60?text=W2',
      },
      {
        id: 3,
        name: 'Designer Bag Premium',
        sku: 'DB-003',
        category: 'Luxury Handbag',
        price: 650,
        status: true,
      },
      {
        id: 4,
        name: 'Classic Watch Silver',
        sku: 'W-004',
        category: 'Watches',
        price: 299,
        status: true,
      },
      {
        id: 5,
        name: 'Luxury Bag Limited',
        sku: 'LB-005',
        category: 'Luxury Handbag',
        price: 1200,
        status: false,
      },
      {
        id: 6,
        name: 'Luxury Handbag Classic',
        sku: 'LH-001',
        category: 'Luxury Handbag',
        price: 499,
        status: true,
        image: 'https://via.placeholder.com/60x60?text=LH1',
      },
      {
        id: 7,
        name: 'Elegant Watch 2025',
        sku: 'W-2025',
        category: 'Watches',
        price: 799,
        status: false,
        image: 'https://via.placeholder.com/60x60?text=W2',
      },
      {
        id: 8,
        name: 'Designer Bag Premium',
        sku: 'DB-003',
        category: 'Luxury Handbag',
        price: 650,
        status: true,
      },
      {
        id: 9,
        name: 'Luxury Handbag Classic',
        sku: 'LH-001',
        category: 'Luxury Handbag',
        price: 499,
        status: true,
        image: 'https://via.placeholder.com/60x60?text=LH1',
      },
      {
        id: 10,
        name: 'Elegant Watch 2025',
        sku: 'W-2025',
        category: 'Watches',
        price: 799,
        status: false,
        image: 'https://via.placeholder.com/60x60?text=W2',
      },
      {
        id: 11,
        name: 'Designer Bag Premium',
        sku: 'DB-003',
        category: 'Luxury Handbag',
        price: 650,
        status: true,
      },
    ];

    // Update maxPrice based on products
    this.maxPrice = Math.max(...this.products.map((p) => p.price)) + 50;
    this.priceRange = [0, this.maxPrice];
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

  onPriceChange(event: any) {
    this.priceRange = event.values;
    this.dt.filter(this.priceRange, 'price', 'between');
  }
}
