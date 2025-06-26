import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CategoryDTO, CategoryGroup } from '@app/core/models/category-dto';

@Component({
  selector: 'app-category-dropdown',
  standalone: false,
  templateUrl: './category-dropdown.component.html',
  styleUrl: './category-dropdown.component.css'
})
export class CategoryDropdownComponent {
  @Input() categories: CategoryDTO[] = []
  @Output() categorySelected = new EventEmitter<CategoryDTO>()
  @Output() viewAllCategories = new EventEmitter<void>()

  categoryGroups: CategoryGroup[] = []
  selectedRootCategory: CategoryDTO | null = null
  isDropdownOpen = false

  ngOnInit() {
    this.organizeCategoriesByRoot()
  }

  ngOnChanges() {
    this.organizeCategoriesByRoot()
  }

  private organizeCategoriesByRoot() {
    const rootCategories = this.categories.filter((cat) => !cat.parentCategoryId)

    this.categoryGroups = rootCategories.map((root) => ({
      root,
      subcategories: this.getSubcategoriesForRoot(root.id!),
    }))

    // Set first root as default selected
    if (this.categoryGroups.length > 0) {
      this.selectedRootCategory = this.categoryGroups[0].root
    }
  }

  private getSubcategoriesForRoot(rootId: number): CategoryDTO[] {
    // Get direct children and their children (2 levels deep max for UI simplicity)
    const directChildren = this.categories.filter((cat) => cat.parentCategoryId === rootId)
    const grandChildren = directChildren.flatMap((child) =>
      this.categories.filter((cat) => cat.parentCategoryId === child.id),
    )

    return [...directChildren, ...grandChildren]
  }

  onRootCategoryHover(rootCategory: CategoryDTO) {
    this.selectedRootCategory = rootCategory
  }

  onCategoryClick(category: CategoryDTO) {
    this.categorySelected.emit(category)
    this.closeDropdown()
  }

  openDropdown() {
    this.isDropdownOpen = true
  }

  closeDropdown() {
    this.isDropdownOpen = false
  }

  onViewAllCategories() {
    this.viewAllCategories.emit()
    this.closeDropdown()
  }

  get selectedSubcategories(): CategoryDTO[] {
    if (!this.selectedRootCategory) return []

    const group = this.categoryGroups.find((g) => g.root.id === this.selectedRootCategory!.id)
    return group ? group.subcategories : []
  }
}
