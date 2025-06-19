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
  isAddingSubcategory = false
  selectedParentDropdown: any[] = []
  expandedCategories: Set<number> = new Set()

  // Category image handling
  categoryDialogVisible = false
  editingCategory: CategoryDTO | null = null
  parentCategoryForNew: CategoryDTO | null = null

  @ViewChild("categoryMenu") categoryMenu!: Menu
  categoryMenuItems: MenuItem[] = []
  selectedCategoryForMenu: CategoryDTO | null = null

  // Loading state
  loadingCategories = false

  constructor(
    private categoryService: CategoryService,
    private cloudinaryService: CloudinaryService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadCategories()
  }

  // Track by function for better performance
  trackByCategory(index: number, category: CategoryDTO): number {
    return category.id || index
  }

  updateFilters(): void {
    if (this.categoryFilter.trim() === "") {
      this.filteredCategoryTree = [...this.categoryTree]
    } else {
      this.filteredCategoryTree = this.filterCategoryTree(this.categoryTree, this.categoryFilter.toLowerCase())
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

  buildCategoryTree(): void {
    const categoryMap = new Map<number, TreeNode>()

    // Create tree nodes
    this.categories.forEach((category, i) => {
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
    this.categoryTree = []
    this.categories.forEach((category) => {
      const node = categoryMap.get(category.id!)!
      if (category.parentCategoryId != null) {
        const parent = categoryMap.get(category.parentCategoryId)
        if (parent) {
          parent.children!.push(node)
        }
      } else {
        this.categoryTree.push(node)
      }
    })

    // Initialize filtered tree
    this.filteredCategoryTree = [...this.categoryTree]
    this.updateFilters()

    console.log("categories : ", this.categories)
  }

  loadCategories(): void {
    this.loadingCategories = true
    this.categoryService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        this.categories = categories
        this.buildCategoryTree()
        this.updateCategoryDropdowns()
        this.recomputeSubcategoryCounts()
        this.loadingCategories = false
      },
      error: (error) => {
        console.error("Error loading categories:", error)
        this.loadingCategories = false
      },
    })
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
    const filtered = this.categories.filter((cat) => !cat.parentCategoryId)
    if (this.categoryFilter.trim() === "") {
      return filtered
    }
    return filtered.filter((cat) => this.categoryMatchesFilter(cat))
  }

  getDirectSubcategories(parentId: number): CategoryDTO[] {
    const subcategories = this.categories.filter((cat) => cat.parentCategoryId === parentId)
    if (this.categoryFilter.trim() === "") {
      console.log("subs for id " + parentId + " are : ", subcategories)

      return subcategories
    }
    return subcategories.filter((cat) => this.categoryMatchesFilter(cat))
  }

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
    this.alertService
      .confirm(`Are you sure you want to delete the category "${category.name}"?`, 'Delete Category')
      .then((confirmed) => {
        if (confirmed) {
          this.categoryService.deleteCategory(category.id!).subscribe({
            next: () => {
              this.categories = this.categories.filter((c) => c.id !== category.id);
              this.buildCategoryTree();
              this.updateCategoryDropdowns();
              this.alertService.toast(`"${category.name}" has been deleted.`, 'success');
            },
            error: (error) => {
              console.error("Error deleting category:", error);
              if (error.status === 400) {
                this.alertService.toast("Cannot delete category. It may have subcategories or products associated with it.", 'error');
              } else {
                this.alertService.toast("Failed to delete the category.", 'error');
              }
            },
          });
        }
      });
  }


  showCategoryMenu(event: MouseEvent, category: CategoryDTO): void {
    this.selectedCategoryForMenu = category

    this.categoryMenuItems = [
      {
        label: "Add Subcategory",
        icon: "pi pi-plus",
        command: () => this.addSubcategory(category),
        styleClass: "menu-item menu-item-addSubcategory",
      },
      {
        label: "Edit",
        icon: "pi pi-pencil",
        command: () => this.editCategory(category),
        styleClass: "menu-item menu-item-editCategory",
      },
      {
        label: "Delete",
        icon: "pi pi-trash",
        command: () => this.deleteCategory(category),
        styleClass: "menu-item menu-item-deleteCategory",
      },
    ]

    // Pass the event to toggle to position the menu near the clicked button
    this.categoryMenu.toggle(event)
  }
}
