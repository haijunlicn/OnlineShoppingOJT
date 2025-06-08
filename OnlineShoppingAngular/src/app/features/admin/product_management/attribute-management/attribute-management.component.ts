import { Component, OnInit, ViewChild } from "@angular/core"
import { TreeNode } from "primeng/api"
import { Menu } from "primeng/menu"
import { MenuItem } from "primeng/api"
import { OptionTypeDTO, OptionValueDTO } from "../../../../core/models/option.model"
import { BrandDTO } from "../../../../core/models/product.model"
import { CategoryDTO } from "../../../../core/models/category-dto"

@Component({
  selector: "app-attribute-management",
  standalone: false,
  templateUrl: "./attribute-management.component.html",
  styleUrls: ["./attribute-management.component.css"],
})
export class AttributeManagementComponent implements OnInit {
  options: OptionTypeDTO[] = []
  filteredOptions: OptionTypeDTO[] = []
  optionFilter = ""

  brands: BrandDTO[] = []
  filteredBrands: BrandDTO[] = []
  brandFilter = ""

  categories: CategoryDTO[] = []
  categoryTree: TreeNode[] = []
  filteredCategoryTree: TreeNode[] = []
  categoryDropdown: any[] = []
  categoryFilter = ""

  @ViewChild("valueMenu") valueMenu!: Menu
  @ViewChild("categoryMenu") categoryMenu!: Menu

  valueMenuItems: MenuItem[] = []
  categoryMenuItems: MenuItem[] = []
  selectedValueForMenu: OptionValueDTO | null = null
  selectedOptionForMenu: OptionTypeDTO | null = null
  selectedCategoryForMenu: CategoryDTO | null = null

  constructor() {}

  ngOnInit(): void {
    // The main component is now just a container for the tab components
  }

  private setupFilterWatchers(): void {
    // Watch for option filter changes
    this.optionFilter = ""
    this.brandFilter = ""
    this.categoryFilter = ""
  }

  // Update the updateFilters method to be called when filter values change
  updateFilters(): void {
    // Filter options
    this.filteredOptions = this.options.filter((option) =>
      option.name.toLowerCase().includes(this.optionFilter.toLowerCase()),
    )

    // Filter brands
    this.filteredBrands = this.brands.filter((brand) =>
      brand.name.toLowerCase().includes(this.brandFilter.toLowerCase()),
    )

    // Filter categories
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
    this.categories.forEach((category) => {
      categoryMap.set(category.id!, {
        key: category.id!.toString(),
        label: category.name!,
        data: category,
        children: [],
      })
    })

    // Build hierarchy
    this.categoryTree = []
    this.categories.forEach((category) => {
      const node = categoryMap.get(category.id!)!
      if (category.parentCategoryId) {
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

  addOption(): void {
    // Logic to add a new option
  }

  editOption(option: OptionTypeDTO): void {
    // Logic to edit an existing option
  }

  deleteOption(option: OptionTypeDTO): void {
    // Logic to delete an option
  }

  addOptionValue(option: OptionTypeDTO): void {
    // Logic to add a new option value
  }

  editOptionValue(value: OptionValueDTO, option: OptionTypeDTO): void {
    // Logic to edit an existing option value
  }

  deleteOptionValue(value: OptionValueDTO, option: OptionTypeDTO): void {
    // Logic to delete an option value
  }

  addBrand(): void {
    // Logic to add a new brand
  }

  editBrand(brand: BrandDTO): void {
    // Logic to edit an existing brand
  }

  deleteBrand(brand: BrandDTO): void {
    // Logic to delete a brand
  }

  addCategory(): void {
    // Logic to add a new category
  }

  addSubcategory(category: CategoryDTO): void {
    // Logic to add a subcategory
  }

  editCategory(category: CategoryDTO): void {
    // Logic to edit an existing category
  }

  deleteCategory(category: CategoryDTO): void {
    // Logic to delete a category
  }

  showValueMenu(event: Event, value: OptionValueDTO, option: OptionTypeDTO): void {
    this.selectedValueForMenu = value
    this.selectedOptionForMenu = option

    this.valueMenuItems = [
      {
        label: "Edit",
        icon: "pi pi-pencil",
        command: () => this.editOptionValue(value, option),
      },
      {
        label: "Delete",
        icon: "pi pi-trash",
        command: () => this.deleteOptionValue(value, option),
      },
    ]

    this.valueMenu.toggle(event)
  }

  showCategoryMenu(event: Event, category: CategoryDTO): void {
    this.selectedCategoryForMenu = category

    this.categoryMenuItems = [
      {
        label: "Add Subcategory",
        icon: "pi pi-plus",
        command: () => this.addSubcategory(category),
      },
      {
        label: "Edit",
        icon: "pi pi-pencil",
        command: () => this.editCategory(category),
      },
      {
        label: "Delete",
        icon: "pi pi-trash",
        command: () => this.deleteCategory(category),
      },
    ]

    this.categoryMenu.toggle(event)
  }

  loadAllData(): void {
    // Your existing loadAllData method implementation here
    // This is a placeholder, replace with your actual data loading logic
    this.options = [] // Replace with your actual data loading
    this.filteredOptions = [...this.options]
    this.brands = [] // Replace with your actual data loading
    this.filteredBrands = [...this.brands]
    this.categories = [] // Replace with your actual data loading
    this.buildCategoryTree()
  }
}
