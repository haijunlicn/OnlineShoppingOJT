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
  errorMessage: string = ''

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

  // Pagination
  page: number = 1
  pageSize: number = 10

  // Sorting
  sortField = "createdAt"
  sortDirection: { [key: string]: 'asc' | 'desc' } = {};

  // Expose Math for template use
  Math = Math

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
  mechanismProductSelectionProducts: ProductDTO[] = [];
  // Store basic info from the form when moving to mechanisms tab
  discountBasicInfo: any = {};
  showEditDiscount = false;
  editDiscountData: DiscountEA_A | null = null;

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
    this.errorMessage = ''
    this.discountService.getAllDiscounts().subscribe({
      next: (data) => {
        this.discounts = data
        this.filteredDiscounts = data
        this.calculateStats()
        this.loading = false
        console.log('Loaded discounts:', this.discounts);
      },
      error: (error) => {
        console.error("Error loading discounts:", error)
        this.errorMessage = 'Failed to load discounts. Please try again.'
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

  // Filter methods
  resetFilters(): void {
    this.searchTerm = '';
    this.currentFilter = 'all';
    this.sortField = "createdAt";
    this.sortDirection = {};
    this.applyFilters();
  }

  // Pagination methods
  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= Math.ceil(this.totalDiscounts / this.pageSize)) {
      this.page = pageNum;
      this.loadDiscounts();
    }
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadDiscounts();
    }
  }

  goToNextPage(): void {
    if (this.page < Math.ceil(this.totalDiscounts / this.pageSize)) {
      this.page++;
      this.loadDiscounts();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = Math.ceil(this.totalDiscounts / this.pageSize);
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, this.page - half);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadDiscounts();
  }

  // Sorting methods
  sortBy(column: string): void {
    // Toggle sort direction
    if (!this.sortDirection[column] || this.sortDirection[column] === 'desc') {
      this.sortDirection[column] = 'asc';
    } else {
      this.sortDirection[column] = 'desc';
    }
    const direction = this.sortDirection[column];

    this.filteredDiscounts.sort((a: any, b: any) => {
      let aValue = a[column];
      let bValue = b[column];

      // For nested or custom fields, handle here
      if (column === 'name') {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      }
      if (column === 'status') {
        // Active > Inactive > Expired
        const getStatusRank = (d: any) => this.isActive(d) ? 2 : this.isExpired(d) ? 0 : 1;
        aValue = getStatusRank(a);
        bValue = getStatusRank(b);
      }
      if (column === 'startDate') {
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.sortDirection[field] === 'asc') return "fa-sort-up";
    if (this.sortDirection[field] === 'desc') return "fa-sort-down";
    return "fa-sort";
  }

  // Status methods
  getStatusBadgeClass(discount: DiscountEA_A): string {
    if (this.isExpired(discount)) {
      return "badge status-expired";
    } else if (this.isActive(discount)) {
      return "badge status-active";
    } else {
      return "badge status-inactive";
    }
  }

  getStatusIcon(discount: DiscountEA_A): string {
    if (this.isExpired(discount)) {
      return 'bi bi-x-circle';
    } else if (this.isActive(discount)) {
      return 'bi bi-check-circle';
    } else {
      return 'bi bi-pause-circle';
    }
  }

  getStatusText(discount: DiscountEA_A): string {
    if (this.isExpired(discount)) {
      return 'EXPIRED';
    } else if (this.isActive(discount)) {
      return 'ACTIVE';
    } else {
      return 'INACTIVE';
    }
  }

  // Export methods
  exportToPdf(): void {
    // TODO: Implement PDF export
    console.log('Export to PDF functionality to be implemented');
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    console.log('Export to Excel functionality to be implemented');
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
        this.errorMessage = 'Failed to update discount status. Please try again.';
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
          this.errorMessage = 'Failed to delete discount. Please try again.';
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
    this.editDiscountData = discount;
    this.showEditDiscount = true;
  }

  onEditDiscountClose(updated?: boolean) {
    this.showEditDiscount = false;
    this.editDiscountData = null;
    if (updated) {
      this.loadDiscounts(); // reload list if updated
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
    this.mechanisms = []; // Clear mechanisms array when closing modal
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
    // Prepare selected products for the modal
    const mechanism = this.mechanisms[i];
    let selectedIds: number[] = [];
    if (mechanism.mechanismType === 'freeGift' && mechanism.freeGifts) {
      selectedIds = mechanism.freeGifts.map((gift: any) => gift.productId);
    } else if ((mechanism.mechanismType === 'Discount' || mechanism.mechanismType === 'Coupon' || mechanism.mechanismType === 'B2B') && mechanism.discountProducts) {
      selectedIds = mechanism.discountProducts.map((dp: any) => dp.productId);
    }
    this.mechanismProductSelectionProducts = this.allProducts.filter(p => selectedIds.includes(p.id!));
    this.showProductSelectionModal = true;
    this.showEditPopup = false;
  }

  // When products are selected from ProductSelectionComponent
  onProductsSelected(selected: ProductDTO[]): void {
    if (this.mechanismProductSelectionIndex !== null) {
      // For mechanism product selection
      const mechanism = this.mechanisms[this.mechanismProductSelectionIndex];
      mechanism.selectedProducts = selected.map(p => p.id).filter((id): id is number => id !== undefined);
      mechanism.selectedProductNames = selected.map(p => p.name);
      // Update discountProducts or freeGifts array for persistence
      if (mechanism.mechanismType === 'freeGift') {
        mechanism.freeGifts = selected.map(p => ({ productId: p.id }));
      } else {
        mechanism.discountProducts = selected.map(p => ({ productId: p.id }));
      }
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

  onNext(): void {
    const formValue = this.editForm.value;
    this.discountBasicInfo = {
      name: formValue.name,
      description: formValue.description,
      code: formValue.code,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      usageLimit: formValue.usageLimit,
      perUserLimit: formValue.perUserLimit
    };
    this.activeTab = 'mechanisms';
  }

  onTabChange(tab: 'info' | 'mechanisms'): void {
    // Save basic info when switching to mechanisms tab
    if (tab === 'mechanisms') {
      const formValue = this.editForm.value;
      this.discountBasicInfo = {
        name: formValue.name,
        description: formValue.description,
        code: formValue.code,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        usageLimit: formValue.usageLimit,
        perUserLimit: formValue.perUserLimit
      };
    }
    this.activeTab = tab;
  }
  // Save logic
 
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

  // Generate coupon code for mechanism
  generateMechanismCouponCode(i: number): void {
    const name = this.mechanisms[i].mechanismType || 'COUPON';
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}_${randomSuffix}`;
    this.mechanisms[i].couponcode = code;
  }

  // Delete a condition from a mechanism
  deleteMechanismCondition(mechIndex: number, groupIndex: number, condIndex: number): void {
    const group = this.mechanisms[mechIndex].discountConditionGroup?.[groupIndex];
    if (group && group.discountCondition) {
      group.discountCondition.splice(condIndex, 1);
    }
  }

  // Delete a whole condition group from a mechanism
  deleteConditionGroup(mechIndex: number, groupIndex: number): void {
    const mech = this.mechanisms[mechIndex];
    if (mech && mech.discountConditionGroup) {
      mech.discountConditionGroup.splice(groupIndex, 1);
    }
  }

  deleteMechanism(index: number): void {
    this.mechanisms.splice(index, 1);
  }

  // User-friendly condition display (inspired by create-discount-group)
  getConditionDisplay(cond: any): string {
    const operatorMap: { [key: string]: string } = {
      EQUAL: 'is equal to',
      GREATER_THAN: 'is greater than',
      LESS_THAN: 'is less than',
      GREATER_THAN_OR_EQUAL: 'is greater than or equal to',
      LESS_THAN_OR_EQUAL: 'is less than or equal to',
      IS_ONE_OF: 'is one of',
      equals: 'is equal to',
      greater_than: 'is greater than',
      less_than: 'is less than',
      greater_equal: 'is greater than or equal to',
      less_equal: 'is less than or equal to',
      one_of: 'is one of',
    };
    const fieldMap: { [key: string]: string } = {
      last_login_date: 'Last Login Date',
      days_since_signup: 'Days Since Signup',
      total_spent: 'Total Spent',
      days_since_last_purchase: 'Days Since Last Purchase',
      account_age_days: 'Account Age Days',
      // Add more as needed
    };
    const field = fieldMap[cond.conditionDetail] || cond.conditionDetail || cond.conditionType;
    const op = operatorMap[cond.operator] || cond.operator;
    const val = cond.value ? (Array.isArray(cond.value) ? cond.value.join(', ') : cond.value) : '';
    return `${field} ${op} ${val}`;
  }

  // Quantity increment/decrement for free gift
  incrementQuantity(mech: any): void {
    mech.quantity = (mech.quantity || 1) + 1;
  }
  decrementQuantity(mech: any): void {
    mech.quantity = Math.max(1, (mech.quantity || 1) - 1);
  }

  // --- Added for template compatibility ---
  trackByDiscountId(index: number, discount: DiscountEA_A): number {
    return discount.id;
  }

  getUsagePercentage(discount: DiscountEA_A): number {
    if (!discount.usageLimit || discount.usageLimit === 0) return 0;
    const current = discount.currentRedemptionCount || 0;
    return Math.min((current / discount.usageLimit) * 100, 100);
  }
}
