import { Component, OnInit, ViewChild } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MenuItem, TreeNode } from "primeng/api"
import { Menu } from "primeng/menu"
import { CategoryDTO } from "../../../../core/models/category-dto"
import { CategoryService } from "../../../../core/services/category.service"
import { log } from "node:console"
import { CloudinaryService } from "../../../../core/services/cloudinary.service"
import { Observable } from "rxjs"
import { AlertService } from "@app/core/services/alert.service"
import { CategoryOptionService } from "@app/core/services/category-option.service"

@Component({
  selector: "app-category-management",
  standalone: false,
  templateUrl: "./category-management.component.html",
  styleUrls: ["./category-management.component.css"],
})
export class CategoryManagementComponent implements OnInit {
  categories: CategoryDTO[] = []
  categoryTree: TreeNode[] = []
  filteredCategoryTree: TreeNode[] = []
  categoryDropdown: any[] = []
  categoryFilter = ""
  statusFilter: number | null = null
  isAddingSubcategory = false
  selectedParentDropdown: any[] = []
  expandedCategories: Set<number> = new Set()

  // Category image handling
  categoryDialogVisible = false
  editingCategory: CategoryDTO | null = null
  parentCategoryForNew: CategoryDTO | null = null

  // Category options assignment
  categoryOptionsDialogVisible = false
  selectedCategoryForOptions: CategoryDTO | null = null

  // Track categories with assigned options
  categoriesWithOptions: Set<number> = new Set()

  @ViewChild("categoryMenu") categoryMenu!: Menu
  categoryMenuItems: MenuItem[] = []
  selectedCategoryForMenu: CategoryDTO | null = null

  // Loading state
  loadingCategories = false

  constructor(
    private categoryService: CategoryService,
    private cloudinaryService: CloudinaryService,
    private categoryOptionService: CategoryOptionService,
  ) { }

  ngOnInit(): void {
    this.loadCategories()
  }

  ngOnChanges() {
    this.buildSubcategoryMap();
  } 

  // Track by function for better performance
  trackByCategory(index: number, category: CategoryDTO): number {
    return category.id || index
  }

  updateFilters(): void {
    // First filter by status
    let statusFilteredCategories = this.categories;
    if (this.statusFilter !== null) {
      statusFilteredCategories = this.categories.filter(category => 
        (category.delFg ?? 1) === this.statusFilter
      );
    }

    // Then filter by search text
    if (this.categoryFilter.trim() === "") {
      this.filteredCategoryTree = this.buildFilteredTree(statusFilteredCategories);
    } else {
      this.filteredCategoryTree = this.filterCategoryTree(
        this.buildFilteredTree(statusFilteredCategories), 
        this.categoryFilter.toLowerCase()
      );
    }
  }

  filterCategoryTree(nodes: TreeNode[], filter: string): TreeNode[] {
    return nodes
      .filter((node) => {
        const matchesFilter = node.label?.toLowerCase().includes(filter)
        const hasMatchingChildren = node.children && this.filterCategoryTree(node.children, filter).length > 0

        return matchesFilter || hasMatchingChildren
      })
      .map((node) => {
        if (node.children) {
          return {
            ...node,
            children: this.filterCategoryTree(node.children, filter),
          }
        }
        return node
      })
  }

  buildFilteredTree(categories: CategoryDTO[]): TreeNode[] {
    const categoryMap = new Map<number, TreeNode>()

    // Create tree nodes
    categories.forEach((category, i) => {
      if (!category.id) {
        console.log(`Category at index ${i} is missing an ID:`, category)
      }
      categoryMap.set(category.id!, {
        key: category.id?.toString(),
        label: category.name!,
        data: category,
        children: [],
      })
    })

    // Build hierarchy
    const tree: TreeNode[] = []
    categories.forEach((category) => {
      const node = categoryMap.get(category.id!)!
      if (category.parentCategoryId != null) {
        const parent = categoryMap.get(category.parentCategoryId)
        if (parent) {
          parent.children!.push(node)
        }
      } else {
        tree.push(node)
      }
    })

    return tree
  }

  buildCategoryTree(): void {
    this.categoryTree = this.buildFilteredTree(this.categories);
    this.updateFilters();
    console.log("categories : ", this.categories)
  }

  loadCategories(): void {
    this.loadingCategories = true;

    this.categoryService.getAllCategoriesWithStatus().subscribe({
      next: (categories: CategoryDTO[]) => {
        this.categories = categories;

        this.categoriesWithOptions = new Set(
          categories
            .filter((cat) => cat.optionTypes && cat.optionTypes.length > 0)
            .map((cat) => cat.id!)
        );

        this.buildCategoryTree();
        this.updateCategoryDropdowns();
        this.recomputeSubcategoryCounts();
        this.buildSubcategoryMap();

        this.loadingCategories = false;

        console.log("categoriessssss : ", this.categories);

      },
      error: (error) => {
        console.error("Error loading categories with status:", error);
        this.loadingCategories = false;
      }
    });
  }

  hasAssignedOptions(categoryId: number): boolean {
    return this.categoriesWithOptions.has(categoryId)
  }

  getAssignedOptionsCount(categoryId: number): number {
    // This would need to be implemented based on your service
    // For now, return a placeholder
    return this.hasAssignedOptions(categoryId) ? 1 : 0
  }

  updateCategoryDropdowns(): void {
    // Only root categories for the main "Add Category" button
    this.categoryDropdown = this.categories
      .filter((cat) => !cat.parentCategoryId) // Only root categories
      .map((cat) => ({
        label: cat.name,
        value: cat.id,
      }))
  }

  // Helper methods for the new compact view
  getRootCategories(): CategoryDTO[] {
    let filtered = this.categories.filter((cat) => !cat.parentCategoryId)
    
    // Apply status filter
    if (this.statusFilter !== null) {
      filtered = filtered.filter(category => (category.delFg ?? 1) === this.statusFilter);
    }
    
    if (this.categoryFilter.trim() === "") {
      return filtered
    }
    return filtered.filter((cat) => this.categoryMatchesFilter(cat))
  }

  subcategoryMap: Map<number, CategoryDTO[]> = new Map();

  buildSubcategoryMap(): void {
    this.subcategoryMap.clear();

    for (const category of this.categories) {
      if (this.statusFilter !== null && (category.delFg ?? 1) !== this.statusFilter) {
        continue;
      }

      const parentId = category.parentCategoryId ?? 0;
      if (!this.subcategoryMap.has(parentId)) {
        this.subcategoryMap.set(parentId, []);
      }
      this.subcategoryMap.get(parentId)!.push(category);
    }

    // Optional: filter based on category name if needed
    if (this.categoryFilter.trim() !== "") {
      for (const [key, list] of this.subcategoryMap) {
        this.subcategoryMap.set(key, list.filter(cat => this.categoryMatchesFilter(cat)));
      }
    }
  }


  // getDirectSubcategories(parentId: number): CategoryDTO[] {
  //   let subcategories = this.categories.filter((cat) => cat.parentCategoryId === parentId)
    
  //   // Apply status filter
  //   if (this.statusFilter !== null) {
  //     subcategories = subcategories.filter(category => (category.delFg ?? 1) === this.statusFilter);
  //   }
    
  //   if (this.categoryFilter.trim() === "") {
  //     console.log("subs for id " + parentId + " are : ", subcategories)
  //     return subcategories
  //   }
  //   return subcategories.filter((cat) => this.categoryMatchesFilter(cat))
  // }

  categoryMatchesFilter(category: CategoryDTO): boolean {
    if (!this.categoryFilter.trim()) return true

    // Check if category name matches
    if (category.name?.toLowerCase().includes(this.categoryFilter.toLowerCase())) {
      return true
    }

    // Check if any descendant matches
    return this.hasMatchingDescendant(category.id!)
  }

  hasMatchingDescendant(categoryId: number): boolean {
    const children = this.categories.filter((cat) => cat.parentCategoryId === categoryId)
    return children.some(
      (child) =>
        child.name?.toLowerCase().includes(this.categoryFilter.toLowerCase()) || this.hasMatchingDescendant(child.id!),
    )
  }

  hasSubcategories(categoryId: number): boolean {
    return this.categories.some((cat) => cat.parentCategoryId === categoryId)
  }

  subcategoryCounts: Map<number, number> = new Map()

  recomputeSubcategoryCounts(): void {
    this.subcategoryCounts.clear()
    this.categories.forEach((category) => {
      this.subcategoryCounts.set(category.id!, this.countSubcategories(category.id!))
    })
  }

  private countSubcategories(categoryId: number, visited = new Set<number>()): number {
    if (visited.has(categoryId)) {
      console.warn(`Cycle detected at category ${categoryId}`)
      return 0 // or throw error
    }
    visited.add(categoryId)

    const directChildren = this.categories.filter((c) => c.parentCategoryId === categoryId)
    let total = directChildren.length

    for (const child of directChildren) {
      total += this.countSubcategories(child.id!, visited)
    }

    visited.delete(categoryId)
    return total
  }

  getTotalSubcategoryCount(categoryId: number): number {
    return this.subcategoryCounts.get(categoryId) || 0
  }

  // Expand/Collapse functionality
  isExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId)
  }

  toggleExpanded(categoryId: number): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId)
    } else {
      this.expandedCategories.add(categoryId)
    }
  }

  // Get category image (for now returns default, later will use actual image)
  getCategoryImage(category: CategoryDTO): string {
    return category.imgPath || "/assets/default-category.png"
  }

  openCategoryDialog(category?: CategoryDTO, parent?: CategoryDTO): void {
    this.editingCategory = category || null
    this.parentCategoryForNew = parent || null
    this.categoryDialogVisible = true
  }

  onCategorySaved(savedCategory: CategoryDTO): void {
    const index = this.categories.findIndex((c) => c.id === savedCategory.id)
    if (index !== -1) {
      this.categories[index] = savedCategory
    } else {
      this.categories.push(savedCategory)
    }

    this.buildCategoryTree()
    this.updateCategoryDropdowns()
    this.recomputeSubcategoryCounts()
    this.categoryDialogVisible = false
  }

  addSubcategory(category: CategoryDTO): void {
    // Pre-select the clicked category as parent
    this.openCategoryDialog(undefined, category)
  }

  editCategory(category: CategoryDTO): void {
    this.openCategoryDialog(category)
  }

  deleteCategory(category: CategoryDTO): void {
    const isCurrentlyActive = (category.delFg ?? 1) === 1;
    const actionText = isCurrentlyActive ? 'deactivate' : 'restore';
    const confirmMessage = isCurrentlyActive 
      ? `Are you sure you want to deactivate the category "${category.name}"?`
      : `Are you sure you want to restore the category "${category.name}" to active status?`;

    if (confirm(confirmMessage)) {
      this.categoryService.deleteCategory(category.id!).subscribe({
        next: () => {
          const successMessage = isCurrentlyActive 
            ? `"${category.name}" has been deactivated.`
            : `"${category.name}" has been restored to active status.`;
          alert(successMessage);
          
          // Update the local category status
          category.delFg = isCurrentlyActive ? 0 : 1;
          
          // Rebuild the tree to reflect the status change
          this.buildCategoryTree();
          this.updateCategoryDropdowns();
        },
        error: (error) => {
          console.error("Error updating category status:", error);
          if (error.status === 400) {
            alert("Cannot update category. It may have subcategories or products associated with it.");
          } else {
            alert("Failed to update category status.");
          }
        },
      })
    }
  }

  // New method for opening category options dialog
  setCategoryOptions(category: CategoryDTO): void {
    this.selectedCategoryForOptions = {
      ...category,
      optionTypes: category.optionTypes ?? [],
    };
    this.categoryOptionsDialogVisible = true;
  }

  // Handle options assignment save
  onCategoryOptionsAssigned(): void {
    this.categoryOptionsDialogVisible = false
    this.selectedCategoryForOptions = null
    this.loadCategories()
  }

  showCategoryMenu(event: MouseEvent, category: CategoryDTO): void {
    this.selectedCategoryForMenu = category

    const isCurrentlyActive = (category.delFg ?? 1) === 1;
    const statusActionLabel = isCurrentlyActive ? 'Deactivate' : 'Restore';
    const statusActionIcon = isCurrentlyActive ? 'pi pi-times' : 'pi pi-refresh';

    this.categoryMenuItems = [
      {
        label: "Add Subcategory",
        icon: "pi pi-plus",
        command: () => this.addSubcategory(category),
        styleClass: "menu-item menu-item-addSubcategory",
      },
      {
        label: "Set Options",
        icon: "pi pi-cog",
        command: () => this.setCategoryOptions(category),
        styleClass: "menu-item menu-item-setOptions",
      },
      {
        label: "Edit",
        icon: "pi pi-pencil",
        command: () => this.editCategory(category),
        styleClass: "menu-item menu-item-editCategory",
      },
      {
        label: statusActionLabel,
        icon: statusActionIcon,
        command: () => this.deleteCategory(category),
        styleClass: "menu-item menu-item-deleteCategory",
      },
    ]

    // Pass the event to toggle to position the menu near the clicked button
    this.categoryMenu.toggle(event)
  }
}
