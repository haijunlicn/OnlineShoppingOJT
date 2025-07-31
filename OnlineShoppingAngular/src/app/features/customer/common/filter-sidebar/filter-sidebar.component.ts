import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CategoryDTO } from '@app/core/models/category-dto';
import { BrandDTO } from '@app/core/models/product.model';

export interface FilterState {
  categories: number[]
  brands: number[]
  priceRange: { min: number | null; max: number | null }
  inStock: boolean
  onSale: boolean
  isNew: boolean
  rating: number | null
}

export interface PriceRange {
  label: string
  min: number
  max: number
}

@Component({
  selector: "app-filter-sidebar",
  standalone: false,
  templateUrl: "./filter-sidebar.component.html",
  styleUrls: ["./filter-sidebar.component.css"],
})

export class FilterSidebarComponent implements OnInit {
  @Input() categories: CategoryDTO[] = []
  @Input() brands: BrandDTO[] = []
  @Input() isVisible = true
  @Output() filtersChanged = new EventEmitter<FilterState>()
  @Output() clearAllFilters = new EventEmitter<void>()

  // Filter state
  selectedCategories = new Set<number>()
  selectedBrands = new Set<number>()
  customPriceMin: number | null = null
  customPriceMax: number | null = null
  selectedPriceRange: PriceRange | null = null
  inStockOnly = false
  onSaleOnly = false
  newItemsOnly = false
  minRating: number | null = null

  // Search states
  categorySearchTerm = ""
  brandSearchTerm = ""

  // UI state
  expandedSections = {
    categories: true,
    brands: true,
    price: true,
    availability: true,
    rating: false,
  }

  // Predefined price ranges
  // priceRanges: PriceRange[] = [
  //   { label: "Under $25", min: 0, max: 25 },
  //   { label: "$25 - $50", min: 25, max: 50 },
  //   { label: "$50 - $100", min: 50, max: 100 },
  //   { label: "$100 - $200", min: 100, max: 200 },
  //   { label: "$200 - $500", min: 200, max: 500 },
  //   { label: "Over $500", min: 500, max: 999999 },
  // ]

  ngOnInit() {
    this.emitFilters()
  }

  // Public method to emit filters (called from parent)
  emitFilters() {
    const filters: FilterState = {
      categories: Array.from(this.selectedCategories),
      brands: Array.from(this.selectedBrands),
      priceRange: {
        min: this.customPriceMin,
        max: this.customPriceMax,
      },
      inStock: this.inStockOnly,
      onSale: this.onSaleOnly,
      isNew: this.newItemsOnly,
      rating: this.minRating,
    }
    this.filtersChanged.emit(filters)
  }

  // Add this method to your FilterSidebarComponent if it doesn't exist
  setCategoryFilter(categoryId: number) {
    this.selectedCategories.clear();
    this.selectedCategories.add(categoryId);

    // Also select all descendants
    const descendants = this.getAllDescendants(categoryId);
    descendants.forEach(desc => {
      this.selectedCategories.add(desc.id!);
    });

    // Expand categories section to show the selection
    this.expandedSections.categories = true;

    // Emit the updated filters
    this.emitFilters();
  }

  // FIXED: Improved category filtering with better parent-child handling
  toggleCategory(categoryId: number) {
    if (this.selectedCategories.has(categoryId)) {
      // Deselecting a category
      this.deselectCategoryAndDescendants(categoryId);

      // Also deselect any parent categories that were auto-selected
      // this.deselectParentsIfNeeded(categoryId);
    } else {
      // Selecting a category
      this.selectedCategories.add(categoryId);

      // Auto-select all descendants
      const descendants = this.getAllDescendants(categoryId);
      descendants.forEach((desc) => this.selectedCategories.add(desc.id!));
    }

    this.emitFilters();
  }

  // Helper method to deselect a category and all its descendants
  private deselectCategoryAndDescendants(categoryId: number) {
    this.selectedCategories.delete(categoryId);
    const descendants = this.getAllDescendants(categoryId);
    descendants.forEach((desc) => this.selectedCategories.delete(desc.id!));
  }

  // Helper method to deselect parent categories if no children are selected
  private deselectParentsIfNeeded(categoryId: number) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category || !category.parentCategoryId) return;

    const parent = this.categories.find(cat => cat.id === category.parentCategoryId);
    if (!parent) return;

    // Check if any siblings of this category are still selected
    const siblings = this.getDirectChildren(parent.id!);
    const hasSelectedSiblings = siblings.some(sibling =>
      sibling.id !== categoryId && this.selectedCategories.has(sibling.id!)
    );

    // If no siblings are selected, deselect the parent
    if (!hasSelectedSiblings) {
      this.selectedCategories.delete(parent.id!);
      // Recursively check grandparents
      this.deselectParentsIfNeeded(parent.id!);
    }
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategories.has(categoryId)
  }

  // Brand filtering
  toggleBrand(brandId: string) {
    if (this.selectedBrands.has(+brandId)) {
      this.selectedBrands.delete(+brandId)
    } else {
      this.selectedBrands.add(+brandId)
    }
    this.emitFilters()
  }

  isBrandSelected(brandId: string): boolean {
    return this.selectedBrands.has(+brandId)
  }

  // Price filtering
  selectPriceRange(range: PriceRange) {
    this.selectedPriceRange = range
    this.customPriceMin = range.min
    this.customPriceMax = range.max === 999999 ? null : range.max
    this.emitFilters()
  }

  onCustomPriceChange() {
    this.selectedPriceRange = null
    this.emitFilters()
  }

  // Other filters
  toggleInStock() {
    this.inStockOnly = !this.inStockOnly
    this.emitFilters()
  }

  toggleOnSale() {
    this.onSaleOnly = !this.onSaleOnly
    this.emitFilters()
  }

  toggleNewItems() {
    this.newItemsOnly = !this.newItemsOnly
    this.emitFilters()
  }

  setMinRating(rating: number) {
    this.minRating = this.minRating === rating ? null : rating
    this.emitFilters()
  }

  // Section expansion
  toggleSection(section: keyof typeof this.expandedSections) {
    this.expandedSections[section] = !this.expandedSections[section]
  }

  // Clear filters
  clearAllFiltersLocal() {
    this.selectedCategories.clear()
    this.selectedBrands.clear()
    this.customPriceMin = null
    this.customPriceMax = null
    this.selectedPriceRange = null
    this.inStockOnly = false
    this.onSaleOnly = false
    this.newItemsOnly = false
    this.minRating = null
    this.categorySearchTerm = ""
    this.brandSearchTerm = ""
    this.emitFilters()
    this.clearAllFilters.emit()
  }

  // Get active filter count
  get activeFilterCount(): number {
    let count = 0
    count += this.selectedCategories.size
    count += this.selectedBrands.size
    if (this.customPriceMin !== null || this.customPriceMax !== null) count++
    if (this.inStockOnly) count++
    if (this.onSaleOnly) count++
    if (this.newItemsOnly) count++
    if (this.minRating !== null) count++
    return count
  }

  // Get root categories for display
  get rootCategories(): CategoryDTO[] {
    return this.categories.filter((cat) => !cat.parentCategoryId)
  }

  // Get subcategories for a parent (including all deeper levels)
  getDirectChildren(parentId: number): CategoryDTO[] {
    return this.categories.filter((cat) => cat.parentCategoryId === parentId)
  }

  // Get all descendant categories recursively (for selection logic)
  getAllDescendants(parentId: number): CategoryDTO[] {
    const directChildren = this.categories.filter((cat) => cat.parentCategoryId === parentId)
    const allDescendants = [...directChildren]

    directChildren.forEach((child) => {
      allDescendants.push(...this.getAllDescendants(child.id!))
    })

    return allDescendants
  }

  // Check if category has any subcategories
  hasSubcategories(categoryId: number): boolean {
    return this.categories.some((cat) => cat.parentCategoryId === categoryId)
  }

  // Get filtered brands
  get filteredBrands(): BrandDTO[] {
    if (this.brandSearchTerm) {
      return this.brands.filter((brand) => brand.name.toLowerCase().includes(this.brandSearchTerm.toLowerCase()))
    }
    return this.brands
  }

  // Get parent category name for subcategory
  getParentCategoryName(parentId: number): string {
    const parent = this.categories.find((cat) => cat.id === parentId)
    return parent ? parent.name! : ""
  }

  // Calculate category depth for indentation
  getCategoryDepth(categoryId: number): number {
    const category = this.categories.find((cat) => cat.id === categoryId)
    if (!category || !category.parentCategoryId) return 0

    return 1 + this.getCategoryDepth(category.parentCategoryId)
  }

  // search helper method
  matchesSearch(category: CategoryDTO, term: string): boolean {
    term = term.toLowerCase();
    if (category.name!.toLowerCase().includes(term)) {
      return true;
    }
    const children = this.getDirectChildren(category.id!);
    return children.some(child => this.matchesSearch(child, term));
  }

}