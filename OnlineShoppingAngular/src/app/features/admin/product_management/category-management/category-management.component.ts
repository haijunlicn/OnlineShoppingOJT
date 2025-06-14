import { Component, OnInit, ViewChild } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MenuItem, TreeNode } from "primeng/api"
import { Menu } from "primeng/menu"
import { CategoryDTO } from "../../../../core/models/category-dto"
import { CategoryService } from "../../../../core/services/category.service"
import { log } from "node:console"
import { CloudinaryService } from "../../../../core/services/cloudinary.service"
import { Observable } from "rxjs"

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
  expandedCategories: Set<number> = new Set() // Track expanded categories

  // Category image handling
  categoryImagePreview: string | null = null
  selectedImage: File | null = null
  defaultCategoryImage = "/assets/default-category.png" // Default placeholder image path

  @ViewChild("categoryMenu") categoryMenu!: Menu

  categoryMenuItems: MenuItem[] = []
  selectedCategoryForMenu: CategoryDTO | null = null

  // Loading state
  loadingCategories = false

  // Dialog visibility
  categoryDialogVisible = false

  // Edit states
  editingCategory: CategoryDTO | null = null
  parentCategoryForNew: CategoryDTO | null = null

  // Form
  categoryForm: FormGroup
  viewMode: "grid" | "list" = "grid"

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private cloudinaryService: CloudinaryService
  ) {
    this.categoryForm = this.fb.group({
      id: [null],
      name: ["", Validators.required],
      parentCategoryId: [null],
      imagePath: [null], // For future use
    })
  }

  ngOnInit(): void {
    this.loadCategories()
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
        console.log(`Category at index ${i} is missing an ID:`, category);
      }
      categoryMap.set(category.id!, {
        key: category.id?.toString(),
        label: category.name!,
        data: category,
        children: [],
      });
    });


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


  subcategoryCounts: Map<number, number> = new Map();

  recomputeSubcategoryCounts(): void {
    this.subcategoryCounts.clear();
    this.categories.forEach(category => {
      this.subcategoryCounts.set(category.id!, this.countSubcategories(category.id!));
    });
  }

  private countSubcategories(categoryId: number, visited = new Set<number>()): number {
    if (visited.has(categoryId)) {
      console.warn(`Cycle detected at category ${categoryId}`)
      return 0; // or throw error
    }
    visited.add(categoryId);

    const directChildren = this.categories.filter(c => c.parentCategoryId === categoryId);
    let total = directChildren.length;

    for (const child of directChildren) {
      total += this.countSubcategories(child.id!, visited);
    }

    visited.delete(categoryId);
    return total;
  }

  getTotalSubcategoryCount(categoryId: number): number {
    return this.subcategoryCounts.get(categoryId) || 0;
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
    return category.imgPath || this.defaultCategoryImage
  }

  // Image handling for future use
  onImageSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {
      this.selectedImage = file

      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.categoryImagePreview = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  removeCategoryImage(): void {
    this.selectedImage = null
    this.categoryImagePreview = null
    this.categoryForm.patchValue({
      imagePath: null,
    })
  }

  // Get selected category name for display in dropdown
  getSelectedCategoryName(): string | null {
    const parentId = this.categoryForm.get("parentCategoryId")?.value
    if (!parentId) return null

    const category = this.categoryDropdown.find((cat) => cat.value === parentId)
    return category ? category.label : null
  }

  // Handle manual selection from Bootstrap dropdown
  selectParentCategory(categoryId: number | null): void {
    this.categoryForm.patchValue({
      parentCategoryId: categoryId,
    })
  }

  openCategoryDialog(category?: CategoryDTO, parent?: CategoryDTO): void {
    // Reset image state
    this.selectedImage = null
    this.categoryImagePreview = null

    this.editingCategory = category || null
    this.parentCategoryForNew = parent || null
    this.isAddingSubcategory = !!parent // Set flag if parent is provided

    console.log("img path : ", category?.imgPath);


    // Set dropdown options for subcategory case
    if (parent) {
      this.selectedParentDropdown = [
        {
          label: parent.name,
          value: parent.id,
        },
      ]
    }

    if (category) {
      // Editing existing category
      this.categoryForm.patchValue({
        id: category.id,
        name: category.name,
        parentCategoryId: category.parentCategoryId,
        imagePath: category.imgPath || null,
      })

      // If category has an image, show its preview (for future implementation)
      if (category.imgPath) {
        this.categoryImagePreview = this.getCategoryImage(category)
      }
    } else {
      // Adding new category
      this.categoryForm.reset({
        parentCategoryId: parent ? parent.id : null, // Pre-select parent if adding subcategory
      })
    }

    this.categoryDialogVisible = true
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const formValue = this.categoryForm.value;

    const handleAfterSave = (savedCategory: CategoryDTO) => {
      const index = this.categories.findIndex(c => c.id === savedCategory.id);
      if (index !== -1) {
        this.categories[index] = savedCategory;
      } else {
        this.categories.push(savedCategory);
      }

      this.buildCategoryTree();
      this.updateCategoryDropdowns();
      this.recomputeSubcategoryCounts?.();
      this.categoryDialogVisible = false;
      this.selectedImage = null;
    };

    const saveWithImage = (imageUrl?: string) => {
      const categoryDTO = this.buildCategoryDTO(formValue, imageUrl);

      const save$ = this.editingCategory
        ? this.categoryService.updateCategory(categoryDTO)
        : this.categoryService.createCategory(categoryDTO);

      save$.subscribe({
        next: (savedCategory) => handleAfterSave(savedCategory),
        error: (err) =>
          console.error(
            this.editingCategory
              ? "Error updating category:"
              : "Error creating category:",
            err
          ),
      });
    };

    if (this.selectedImage) {
      this.uploadImage(this.selectedImage).subscribe({
        next: (imageUrl) => saveWithImage(imageUrl),
        error: (err) => console.error("Image upload failed", err),
      });
    } else {
      saveWithImage(formValue.imagePath);
    }
  }

  private buildCategoryDTO(formValue: any, imagePath?: string): CategoryDTO {
    return {
      id: this.editingCategory?.id,
      name: formValue.name,
      parentCategoryId: formValue.parentCategoryId || undefined,
      imgPath: imagePath || '',
    };
  }

  private uploadImage(file: File): Observable<string> {
    return this.cloudinaryService.uploadImage(file);
  }

  addSubcategory(category: CategoryDTO): void {
    // Pre-select the clicked category as parent
    this.openCategoryDialog(undefined, category)
  }

  editCategory(category: CategoryDTO): void {
    this.openCategoryDialog(category)
  }

  deleteCategory(category: CategoryDTO): void {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id!).subscribe({
        next: () => {
          this.categories = this.categories.filter((c) => c.id !== category.id)
          this.buildCategoryTree()
          this.updateCategoryDropdowns()
        },
        error: (error) => {
          console.error("Error deleting category:", error)
          if (error.status === 400) {
            alert("Cannot delete category. It may have subcategories or products associated with it.")
          }
        },
      })
    }
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
