import { Component } from '@angular/core';
import { DiscountEA_A, MechanismType } from '@app/core/models/discount';
import { DiscountService } from '@app/core/services/discount.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductDTO } from '@app/core/models/product.model';

@Component({
  selector: 'app-discount-list',
  standalone: false,
  templateUrl: './discount-list.component.html',
  styleUrl: './discount-list.component.css'
})
export class DiscountListComponent {
  discounts: DiscountEA_A[] = []
  filteredDiscounts: DiscountEA_A[] = []
  searchTerm = ""
  loading = false

  // Stats
  activeDiscounts = 0
  totalDiscounts = 0 // Changed from totalRedemptions
  totalMechanisms = 0 // Changed from revenueImpact
  averageDiscount = 0

  // Add filter properties
  currentFilter = "all"
  filterOptions = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "expired", label: "Expired" },
  ]

  showEditPopup = false;
  editForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  editingDiscountId: number | null = null;
  // Product selection modal state
  showProductSelectionModal = false;
  allProducts: ProductDTO[] = [];
  selectedProducts: number[] = [];
  selectedProductDTOs: ProductDTO[] = [];
  // For offer section
  offerMechanism: any = null;
  offerTypes = [
    { key: MechanismType.DISCOUNT, label: 'Percentage/Amount Discount', icon: '💰' },
    { key: MechanismType.FREE_GIFT, label: 'Free Gift', icon: '🎁' },
    { key: MechanismType.B2B, label: 'Business to Business', icon: '🤝' }
  ];
  discountTypes = [
    { key: 'PERCENTAGE', label: 'Percentage (%)' },
    { key: 'FIXED', label: 'Fixed Amount (MMK)' }
  ];
  activeTab: 'info' | 'mechanisms' = 'info';
  mechanisms: any[] = [];
  accordionOpenIndex: number | null = null;
  mechanismProductSelectionIndex: number | null = null;

  constructor(
    private discountService: DiscountService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      usageLimit: [0, [Validators.min(0)]],
      perUserLimit: [0, [Validators.min(0)]],
      // Offer section fields
      offerType: [{ value: '', disabled: true }],
      discountType: [{ value: '', disabled: true }],
      value: ['', [Validators.required]],
      maxDiscountAmount: [{ value: '', disabled: true }],
      products: [[]]
    });
  }

  ngOnInit(): void {
    this.loadDiscounts()
  }

  loadDiscounts(): void {
    this.loading = true
    this.discountService.getAllDiscounts().subscribe({
      next: (data) => {
        this.discounts = data
        this.filteredDiscounts = data
        this.calculateStats()
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading discounts:", error)
        this.loading = false
      },
    })
  }

  calculateStats(): void {
    this.activeDiscounts = this.discounts.filter((d) => d.isActive && !this.isExpired(d)).length
    this.totalDiscounts = this.discounts.length // Total discount count

    // Calculate total mechanisms across all discounts
    this.totalMechanisms = this.discounts.reduce((sum, d) => {
      return sum + (d.discountMechanisms?.length || 0)
    }, 0)

    // Calculate average discount percentage
    const discountsWithMechanisms = this.discounts.filter(
      (d) => d.discountMechanisms && d.discountMechanisms.length > 0,
    )
    if (discountsWithMechanisms.length > 0) {
      const totalDiscount = discountsWithMechanisms.reduce((sum, d) => sum + this.getMechanismAveragePercent(d), 0)
      this.averageDiscount = Math.round(totalDiscount / discountsWithMechanisms.length)
    } else {
      this.averageDiscount = 0
    }
  }
  createDiscount(): void {
    console.log("HI");
    this.router.navigate(['/admin/createDiscount']);
  }
  setFilter(filter: string): void {
    this.currentFilter = filter
    this.applyFilters()
  }

  applyFilters(): void {
    let filtered = this.discounts

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(
        (discount) =>
          discount.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (discount.code && discount.code.toLowerCase().includes(this.searchTerm.toLowerCase())),
      )
    }

    // Apply status filter
    switch (this.currentFilter) {
      case "active":
        filtered = filtered.filter((d) => d.isActive && !this.isExpired(d))
        break
      case "inactive":
        filtered = filtered.filter((d) => !d.isActive && !this.isExpired(d))
        break
      case "expired":
        filtered = filtered.filter((d) => this.isExpired(d))
        break
      default:
        // 'all' - no additional filtering
        break
    }

    this.filteredDiscounts = filtered
  }

  onSearch(): void {
    this.applyFilters()
  }

  toggleDiscountStatus(discount: DiscountEA_A): void {
    const payload = { isActive: !discount.isActive };
    this.discountService.updateDiscountStatus(discount.id, payload).subscribe({
      next: () => {
        discount.isActive = !discount.isActive;
        this.calculateStats();
      },
      error: (error) => {
        console.error("Error updating discount status:", error);
      },
    });
  }

  deleteDiscount(discountId: number): void {
    if (confirm("Are you sure you want to delete this discount?")) {
      this.discountService.deleteDiscount(discountId).subscribe({
        next: () => {
          this.discounts = this.discounts.filter((d) => d.id !== discountId)
          this.onSearch()
          this.calculateStats()
        },
        error: (error) => {
          console.error("Error deleting discount:", error)
        },
      })
    }
  }

  // Manual code generate logic (like create-discount)
  generateCouponCode(): void {
    const name = this.editForm.get('name')?.value || 'DISCOUNT';
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}_${randomSuffix}`;
    this.editForm.get('code')?.setValue(code);
  }

  // Open edit popup and bind data
  editDiscount(discount: DiscountEA_A): void {
    this.editingDiscountId = discount.id;
    this.offerMechanism = discount.discountMechanisms && discount.discountMechanisms.length > 0 ? discount.discountMechanisms[0] : null;
    this.selectedProducts = this.offerMechanism && this.offerMechanism.discountProducts
      ? this.offerMechanism.discountProducts.map((p: any) => p.productId).filter((id: number | undefined): id is number => id !== undefined)
      : [];
    if (this.allProducts.length === 0) {
      this.discountService.getAllProducts().subscribe(products => {
        this.allProducts = products;
        this.selectedProductDTOs = this.allProducts.filter(p => this.selectedProducts.includes(p.id!));
        this.setEditFormValues(discount);
        this.mechanisms = discount.discountMechanisms ? JSON.parse(JSON.stringify(discount.discountMechanisms)) : [];
        this.activeTab = 'info';
        this.accordionOpenIndex = null;
        this.showEditPopup = true;
      });
    } else {
      this.selectedProductDTOs = this.allProducts.filter(p => this.selectedProducts.includes(p.id!));
      this.setEditFormValues(discount);
      this.mechanisms = discount.discountMechanisms ? JSON.parse(JSON.stringify(discount.discountMechanisms)) : [];
      this.activeTab = 'info';
      this.accordionOpenIndex = null;
      this.showEditPopup = true;
    }
  }

  toggleAccordion(i: number) {
    this.accordionOpenIndex = this.accordionOpenIndex === i ? null : i;
  }

  saveMechanism(i: number) {
    // Optionally validate mechanism here
    this.accordionOpenIndex = null;
  }

  setEditFormValues(discount: DiscountEA_A) {
    this.editForm.setValue({
      name: discount.name || '',
      description: discount.description || '',
      code: discount.code || '',
      startDate: discount.startDate ? this.formatDateForInput(discount.startDate) : '',
      endDate: discount.endDate ? this.formatDateForInput(discount.endDate) : '',
      usageLimit: discount.usageLimit ?? 0,
      perUserLimit: discount.perUserLimit ?? 0,
      offerType: { value: this.offerMechanism ? this.offerMechanism.mechanismType : '', disabled: true },
      discountType: { value: this.offerMechanism ? this.offerMechanism.discountType : '', disabled: true },
      value: this.offerMechanism ? this.offerMechanism.value : '',
      maxDiscountAmount: { value: this.offerMechanism && this.offerMechanism.maxDiscountAmount ? this.offerMechanism.maxDiscountAmount : '', disabled: !this.offerMechanism || !this.offerMechanism.maxDiscountAmount },
      products: this.selectedProducts
    });
  }

  // Format date for input[type=date]
  formatDateForInput(dateString: string): string {
    const d = new Date(dateString);
    // yyyy-MM-ddTHH:mm for datetime-local
    return d.toISOString().slice(0, 16);
  }

  closeEditPopup(): void {
    this.showEditPopup = false;
    this.editingDiscountId = null;
    this.offerMechanism = null;
    this.selectedProducts = [];
  }

  // Product selection modal logic
  openProductSelection(): void {
    this.showEditPopup = false;
    this.showProductSelectionModal = true;
    if (this.allProducts.length === 0) {
      this.discountService.getAllProducts().subscribe((products) => {
        this.allProducts = products;
      });
    }
  }
  closeProductSelection(): void {
    this.showProductSelectionModal = false;
  }
  toggleProductSelection(productId: number): void {
    if (productId === undefined) return;
    if (this.selectedProducts.includes(productId)) {
      this.selectedProducts = this.selectedProducts.filter(id => id !== productId);
    } else {
      this.selectedProducts.push(productId);
    }
  }
  saveProductSelection(): void {
    this.editForm.get('products')?.setValue(this.selectedProducts);
    this.closeProductSelection();
  }

  openMechanismProductSelection(i: number) {
    this.mechanismProductSelectionIndex = i;
    this.showProductSelectionModal = true;
    this.showEditPopup = false;
  }

  // When products are selected from ProductSelectionComponent
  onProductsSelected(selected: ProductDTO[]): void {
    if (this.mechanismProductSelectionIndex !== null) {
      // For mechanism product selection
      this.mechanisms[this.mechanismProductSelectionIndex].selectedProducts = selected.map(p => p.id).filter((id): id is number => id !== undefined);
      this.mechanisms[this.mechanismProductSelectionIndex].selectedProductNames = selected.map(p => p.name);
      this.mechanismProductSelectionIndex = null;
      this.showProductSelectionModal = false;
      this.showEditPopup = true;
    } else {
      // For main discount product selection (legacy)
      this.selectedProducts = selected.map(p => p.id).filter((id): id is number => id !== undefined);
      this.selectedProductDTOs = selected;
      this.editForm.get('products')?.setValue(this.selectedProducts);
      this.showProductSelectionModal = false;
      this.showEditPopup = true;
    }
  }

  onProductSelectionBack(): void {
    this.showProductSelectionModal = false;
    this.showEditPopup = true;
    this.mechanismProductSelectionIndex = null;
  }

  // Save logic
  saveEditDiscount(): void {
    if (!this.editForm.valid || this.editingDiscountId == null) return;
    const formValue = { ...this.editForm.value };
    // Prepare payload for backend
    const payload: any = {
      ...formValue,
      id: this.editingDiscountId,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      discountMechanisms: [
        {
          ...this.offerMechanism,
          mechanismType: this.offerMechanism.mechanismType,
          discountType: this.offerMechanism.discountType,
          value: formValue.value,
          maxDiscountAmount: formValue.maxDiscountAmount,
          discountProducts: this.selectedProducts.map(productId => ({ productId }))
        }
      ]
    };
    this.discountService.updateDiscount(this.editingDiscountId, payload).subscribe({
      next: (updated: DiscountEA_A) => {
        const idx = this.discounts.findIndex(d => d.id === updated.id);
        if (idx > -1) this.discounts[idx] = updated;
        this.applyFilters();
        this.calculateStats();
        this.closeEditPopup();
      },
      error: (err: any) => {
        alert('Failed to update discount!');
      }
    });
  }

  viewDiscountDetails(discount: DiscountEA_A): void {
    this.router.navigate(["/admin/discount-details", discount.id])
  }

  isExpired(discount: DiscountEA_A): boolean {
    if (!discount.endDate) return false
    return new Date(discount.endDate) < new Date()
  }

  isActive(discount: DiscountEA_A): boolean {
    return discount.isActive && !this.isExpired(discount)
  }

  getDiscountValue(discount: DiscountEA_A): string {
    if (!discount.discountMechanisms || discount.discountMechanisms.length === 0) {
      return "N/A"
    }

    const mechanism = discount.discountMechanisms[0]
    const value = mechanism.value

        if (mechanism.discountType === "PERCENTAGE") {
      return `${value}%`
    } else {
      return `${value} MMK`
    }
  }

  getMechanismCount(discount: DiscountEA_A): number {
    return discount.discountMechanisms?.length || 0
  }

  getConditionCount(discount: DiscountEA_A): number {
    if (!discount.discountMechanisms) return 0

    return discount.discountMechanisms.reduce((count, mechanism) => {
      return count + (mechanism.discountConditionGroup?.length || 0)
    }, 0)
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString()
  }

  showActionMenu(event: Event, discountId: number): void {
    event.stopPropagation()
    // Toggle menu visibility logic here
    const menu = document.getElementById(`menu-${discountId}`)
    if (menu) {
      menu.style.display = menu.style.display === "block" ? "none" : "block"
    }
  }

  hideAllMenus(): void {
    const menus = document.querySelectorAll(".action-menu")
    menus.forEach((menu) => {
      ;(menu as HTMLElement).style.display = "none"
    })
  }

  getMechanismTypes(discount: DiscountEA_A): string[] {
    if (!discount.discountMechanisms) return []
    return discount.discountMechanisms.map((m) => m.mechanismType || "N/A")
  }

  getDiscountTypes(discount: DiscountEA_A): string[] {
    if (!discount.discountMechanisms) return []
    return discount.discountMechanisms.map((m) => m.discountType || "N/A")
  }

  toggleDropdown(event: Event, discountId: number): void {
    event.stopPropagation()
    const dropdown = document.getElementById(`dropdown-${discountId}`)
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block"
    }
  }

  hideAllDropdowns(): void {
    const dropdowns = document.querySelectorAll(".mechanism-dropdown")
    dropdowns.forEach((dropdown) => {
      ;(dropdown as HTMLElement).style.display = "none"
    })
  }

  getMechanismAveragePercent(discount: DiscountEA_A): number {
    if (!discount.discountMechanisms || discount.discountMechanisms.length === 0) {
      return 0
    }
    let totalPercentage = 0
    let count = 0
    discount.discountMechanisms.forEach((mechanism) => {
      const value = Number.parseFloat(mechanism.value) || 0
      if (mechanism.discountType === "PERCENTAGE") {
        totalPercentage += value
        count++
      }
    })
    return count > 0 ? Math.round(totalPercentage / count) : 0
  }

  // Mechanism-wise percent (average) for a discount
  getMechanismWisePercent(discount: DiscountEA_A): number {
    return this.getMechanismAveragePercent(discount)
  }

  // Utility to get selected products for mechanism or main selection
  getSelectedProductsForProductSelection(): ProductDTO[] {
    if (this.mechanismProductSelectionIndex !== null) {
      const mechanism = this.mechanisms[this.mechanismProductSelectionIndex];
      if (mechanism && mechanism.selectedProducts) {
        return this.allProducts.filter(p => mechanism.selectedProducts.includes(p.id));
      }
      return [];
    }
    return this.selectedProductDTOs || [];
  }
}
