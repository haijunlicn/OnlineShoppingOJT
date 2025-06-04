import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BrandDTO, CreateProductRequestDTO, OptionTypeDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { CategoryDTO, CategoryNode } from '../../../../core/models/category-dto';
import { OptionTypeService } from '../../../../core/services/option-type.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { log } from 'console';

@Component({
  selector: 'app-product-create',
  standalone: false,
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css']
})
export class ProductCreateComponent implements OnInit {
  productForm: FormGroup;
  productVariants: ProductVariantDTO[] = [];
  bulkStockValue: number = 10;
  selectedCategory: CategoryDTO | null = null;
  flatCategories: CategoryDTO[] = [];

  brands: BrandDTO[] = [];
  categories: CategoryDTO[] = [];
  optionTypes: OptionTypeDTO[] = [];

  fetchCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        const map = new Map<number, CategoryNode>();

        // Build map
        res.forEach(cat => {
          map.set(cat.id!, { ...cat, children: [] });
        });

        // Assign children to parents
        const roots: CategoryNode[] = [];
        map.forEach(cat => {
          if (cat.parentCategoryId) {
            const parent = map.get(cat.parentCategoryId);
            if (parent) {
              parent.children?.push(cat);
            }
          } else {
            roots.push(cat);
          }
        });

        this.categories = roots;

        // THIS IS THE MISSING LINE - Call flattenCategories after building the tree
        this.flattenCategories();

        console.log('Categories tree:', this.categories);
        console.log('Flattened categories:', this.flatCategories);
      },
      error: (err) => console.error('Failed to fetch categories', err)
    });
  }

  fetchBrands(): void {
    this.brandService.getAllBrands().subscribe({
      next: (data) => this.brands = data,
      error: (err) => console.error('Failed to fetch brands', err)
    });
  }

  fetchOptionTypes(): void {
    this.optionTypeService.getAllOptionTypes().subscribe({
      next: (data) => this.optionTypes = data,
      error: (err) => console.error('Failed to fetch option types', err)
    });
  }

  // Flatten the hierarchical categories into a single array
  flattenCategories(): void {
    this.flatCategories = [];
    this.flattenCategoriesRecursive(this.categories);
  }

  private flattenCategoriesRecursive(categories: CategoryDTO[], level: number = 0): void {
    categories.forEach(category => {
      // Add level property if it doesn't exist
      (category as any).level = level;

      this.flatCategories.push(category);
      if (category.children && category.children.length > 0) {
        this.flattenCategoriesRecursive(category.children, level + 1);
      }
    });

    console.log('Flattened categories:', this.flatCategories);
  }

  // Category selection methods
  selectCategory(category: CategoryDTO, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedCategory = category;
    this.productForm.get('category')?.setValue(category.id);

    // Close the dropdown
    const dropdown = document.getElementById('categoryDropdown');
    if (dropdown) {
      const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(dropdown);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  }

  getSelectedCategoryPath(): string {
    if (!this.selectedCategory) return '';
    return this.getCategoryPath(this.selectedCategory.id);
  }

  getCategoryPath(categoryId: number | undefined): string {
    const category = this.flatCategories.find(cat => cat.id === categoryId);
    if (!category) return '';

    const path: string[] = [];
    let currentCategory: CategoryDTO | undefined = category;

    // Build path from current category up to root
    while (currentCategory) {
      path.unshift(currentCategory.name!);
      if (currentCategory.parentCategoryId) {
        currentCategory = this.flatCategories.find(cat => cat.id === currentCategory!.parentCategoryId);
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  // Get indentation class based on category level
  getCategoryIndentClass(level: number): string {
    return `category-level-${level}`;
  }

  constructor(private fb: FormBuilder,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private optionTypeService: OptionTypeService) {

    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      brand: ['', Validators.required],
      category: ['', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      options: this.fb.array([]),
      variants: this.fb.array([])
    });

    this.options.valueChanges.subscribe(() => this.generateProductVariants());
  }

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchBrands();
    this.fetchOptionTypes();
  }

  get options(): FormArray {
    return this.productForm.get('options') as FormArray;
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  addOption(): void {
    const optionGroup = this.fb.group({
      type: ['', Validators.required],
      values: [[], Validators.required]
    });
    this.options.push(optionGroup);
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  getOptionValues(optionType: string): string[] {
    const option = this.optionTypes.find(opt => opt.id === optionType);
    return option ? option.values : [];
  }

  getOptionTypeName(optionTypeId: string): string {
    const option = this.optionTypes.find(opt => opt.id === optionTypeId);
    return option ? option.name : optionTypeId;
  }

  onOptionTypeChange(index: number): void {
    // Reset values when option type changes
    this.options.at(index).get('values')?.setValue([]);
  }

  toggleOptionValue(optionIndex: number, value: string): void {
    const valuesControl = this.options.at(optionIndex).get('values');
    const currentValues = valuesControl?.value || [];

    if (currentValues.includes(value)) {
      const newValues = currentValues.filter((v: string) => v !== value);
      valuesControl?.setValue(newValues);
    } else {
      valuesControl?.setValue([...currentValues, value]);
    }
  }

  removeOptionValue(optionIndex: number, valueToRemove: string): void {
    const valuesControl = this.options.at(optionIndex).get('values');
    const currentValues = valuesControl?.value || [];
    const newValues = currentValues.filter((v: string) => v !== valueToRemove);
    valuesControl?.setValue(newValues);
  }

  isValueSelected(optionIndex: number, value: string): boolean {
    const values = this.options.at(optionIndex).get('values')?.value || [];
    return values.includes(value);
  }

  getSelectedValuesCount(optionIndex: number): number {
    const values = this.options.at(optionIndex).get('values')?.value || [];
    return values.length;
  }

  // Generate all possible combinations of product variants
  generateProductVariants(): void {
    // Clear existing variants
    while (this.variants.length) {
      this.variants.removeAt(0);
    }
    this.productVariants = [];

    // Get all options with their values
    const optionsWithValues: { type: string, typeName: string, values: string[] }[] = [];

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options.at(i).value;
      if (option.type && option.values && option.values.length > 0) {
        optionsWithValues.push({
          type: option.type,
          typeName: this.getOptionTypeName(option.type),
          values: option.values
        });
      }
    }

    // If no options with values, return
    if (optionsWithValues.length === 0) {
      return;
    }

    // Generate all combinations
    this.productVariants = this.generateCombinations(optionsWithValues);

    // Create form controls for each variant
    const basePrice = this.productForm.get('basePrice')?.value || 0;

    this.productVariants.forEach(variant => {
      this.variants.push(this.fb.group({
        price: [basePrice, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        sku: ['']
      }));
    });
  }

  // Generate all possible combinations of options
  generateCombinations(options: { type: string, typeName: string, values: string[] }[]): ProductVariantDTO[] {
    // Start with an empty array containing one empty combination
    let combinations: ProductVariantDTO[] = [{ options: [], price: 0, stock: 0, sku: '' }];

    // For each option
    options.forEach(option => {
      // Create a new list of combinations
      const newCombinations: ProductVariantDTO[] = [];

      // For each existing combination
      combinations.forEach(combination => {
        // For each value of the current option
        option.values.forEach(value => {
          // Create a new combination by adding the current value
          const newCombination = {
            options: [
              ...combination.options,
              {
                type: option.type,
                typeName: option.typeName,
                value
              }
            ],
            price: combination.price,
            stock: combination.stock,
            sku: combination.sku
          };

          // Add the new combination to our list
          newCombinations.push(newCombination);
        });
      });

      // Replace the old combinations with the new ones
      combinations = newCombinations;
    });

    return combinations;
  }

  // Apply base price to all variants
  applyBulkPrice(): void {
    const basePrice = this.productForm.get('basePrice')?.value || 0;

    for (let i = 0; i < this.variants.length; i++) {
      this.variants.at(i).get('price')?.setValue(basePrice);
    }
  }

  // Apply stock value to all variants
  applyBulkStock(): void {
    // In a real app, you might want to show a dialog to input the stock value
    const stockValue = 10; // Default value or from dialog

    for (let i = 0; i < this.variants.length; i++) {
      this.variants.at(i).get('stock')?.setValue(stockValue);
    }
  }

  // Generate SKU for a variant
  generateSku(variant: ProductVariantDTO): string {
    const productName = this.productForm.get('name')?.value || '';
    const skuBase = productName.substring(0, 3).toUpperCase();

    let skuOptions = '';
    variant.options.forEach(option => {
      skuOptions += `-${option.value.substring(0, 2).toUpperCase()}`;
    });

    return `${skuBase}${skuOptions}`;
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      // Generate SKUs for variants that don't have one
      for (let i = 0; i < this.variants.length; i++) {
        const sku = this.variants.at(i).get('sku')?.value;
        if (!sku) {
          const generatedSku = this.generateSku(this.productVariants[i]);
          this.variants.at(i).get('sku')?.setValue(generatedSku);
        }
      }

      const formValue = this.productForm.value;

      const requestDto: CreateProductRequestDTO = {
        product: {
          name: formValue.name,
          description: formValue.description,
          brandId: formValue.brand,
          categoryId: formValue.category,
          basePrice: formValue.basePrice
        },
        options: formValue.options.map((opt: any) => ({
          type: opt.type,
          values: opt.values
        })),
        variants: formValue.variants.map((variant: any, index: number) => ({
          options: this.productVariants[index].options,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku
        }))
      };

      console.log('CreateProductRequestDTO:', requestDto);

      // TODO: Send requestDto to your backend via a service
      alert('Product created successfully! (Check console for data)');
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }


  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if field has error
  hasError(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper method to get error message
  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }
}