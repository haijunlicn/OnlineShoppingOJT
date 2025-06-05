import { Component, OnInit } from '@angular/core';
<<<<<<< Updated upstream
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { BrandDTO, CreateProductRequestDTO, ProductOptionDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { CategoryDTO, CategoryNode } from '../../../../core/models/category-dto';
import { OptionService } from '../../../../core/services/option.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { OptionTypeDTO, OptionValueDTO } from '../../../../core/models/option.model';
import { ProductService } from '../../../../core/services/product.service';
import { VariantGeneratorService } from '../../../../core/services/variant-generator.service';
=======
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BrandDTO, CreateProductRequestDTO, OptionTypeDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { CategoryDTO, CategoryNode } from '../../../../core/models/category-dto';
import { OptionTypeService } from '../../../../core/services/option-type.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { log } from 'console';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  brands: BrandDTO[] = [];
  categories: CategoryDTO[] = [];
  optionTypes: OptionTypeDTO[] = [];
  loading = {
    categories: false,
    brands: false,
    optionTypes: false,
    submission: false
  };

  fetchCategories(): void {
    this.loading.categories = true;
    this.categoryService.getCategoryTree().subscribe({
      next: (categoryTree) => {
        this.categories = categoryTree;
        this.flattenCategories();
        this.loading.categories = false;
      },
      error: (err) => {
        console.error('Failed to fetch categories', err);
        this.loading.categories = false;
      }
=======

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
>>>>>>> Stashed changes
    });
  }

  fetchBrands(): void {
<<<<<<< Updated upstream
    this.loading.brands = true;
    this.brandService.getAllBrands().subscribe({
      next: (data) => {
        this.brands = data;
        this.loading.brands = false;
      },
      error: (err) => {
        console.error('Failed to fetch brands', err);
        this.loading.brands = false;
      }
=======
    this.brandService.getAllBrands().subscribe({
      next: (data) => this.brands = data,
      error: (err) => console.error('Failed to fetch brands', err)
>>>>>>> Stashed changes
    });
  }

  fetchOptionTypes(): void {
<<<<<<< Updated upstream
    this.loading.optionTypes = true;
    this.optionService.getAllOptionTypes().subscribe({
      next: (data) => {
        this.optionTypes = data;
        console.log("Option types loaded:", this.optionTypes);
        this.loading.optionTypes = false;
      },
      error: (err) => {
        console.error('Failed to fetch option types', err);
        this.loading.optionTypes = false;
      }
=======
    this.optionTypeService.getAllOptionTypes().subscribe({
      next: (data) => this.optionTypes = data,
      error: (err) => console.error('Failed to fetch option types', err)
>>>>>>> Stashed changes
    });
  }

  // Flatten the hierarchical categories into a single array
  flattenCategories(): void {
    this.flatCategories = [];
<<<<<<< Updated upstream
    this.categoryService.flattenCategoriesRecursive(this.categories, this.flatCategories);
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    return `category-level-${Math.min(level, 4)}`;
=======
    return `category-level-${level}`;
>>>>>>> Stashed changes
  }

  constructor(private fb: FormBuilder,
    private categoryService: CategoryService,
    private brandService: BrandService,
<<<<<<< Updated upstream
    private optionService: OptionService,
    private productService: ProductService,
    private variantGeneratorService: VariantGeneratorService) {
=======
    private optionTypeService: OptionTypeService) {
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  // addOption(): void {
  //   const optionGroup = this.fb.group({
  //     id: ['', Validators.required],
  //     name: [''],
  //     values: [[], Validators.required]
  //   });

  //   this.options.push(optionGroup);
  // }
=======
  addOption(): void {
    const optionGroup = this.fb.group({
      type: ['', Validators.required],
      values: [[], Validators.required]
    });
    this.options.push(optionGroup);
  }
>>>>>>> Stashed changes

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

<<<<<<< Updated upstream
  // getOptionValues(optionId: string | number | null | undefined): OptionValueDTO[] {
  //   if (!optionId) {
  //     return [];
  //   }

  //   const option = this.optionTypes.find(opt => opt.id.toString() === optionId.toString());
  //   if (!option) {
  //     return [];
  //   }

  //   // Return full OptionValueDTO objects (filtering out deleted)
  //   return option.optionValues?.filter(ov => !ov.deleted) || [];
  // }

  onOptionTypeChange(index: number): void {
    console.log(`Option type changed for index ${index}`);

    // Get the selected option type ID
    const selectedTypeId = this.options.at(index).get('id')?.value;

    console.log("Selected option type ID:", selectedTypeId);

    if (!selectedTypeId) {
      console.log("No option type selected, clearing name and values");
      this.options.at(index).patchValue({
        name: '',
        values: []
      });
      return;
    }

    // Find the option type object
    // const selectedOptionType = this.optionTypes.find(ot => ot.id === selectedTypeId);
    const selectedOptionType = this.optionTypes.find(ot => ot.id.toString() === selectedTypeId);

    console.log("Found option type:", selectedOptionType);

    if (selectedOptionType) {
      // Update the form with the option name and clear values
      this.options.at(index).patchValue({
        name: selectedOptionType.name,
        values: []
      });

      console.log("Updated option form values:", this.options.at(index).value);
    } else {
      console.warn("Option type not found for ID:", selectedTypeId);
    }
  }

  // Also update your addOption method to ensure proper form structure
  addOption(): void {
    const optionGroup = this.fb.group({
      id: ['', Validators.required],
      name: [''], // This will be set automatically when type is selected
      values: [[], Validators.required]
    });

    this.options.push(optionGroup);
    console.log("Added new option group:", optionGroup.value);
  }

  // Update getOptionValues to use the id field
  getOptionValues(optionTypeId: string | number | null | undefined): OptionValueDTO[] {
    console.log("Getting values for optionTypeId:", optionTypeId);

    if (!optionTypeId) {
      return [];
    }

    const option = this.optionTypes.find(opt => opt.id.toString() === optionTypeId.toString());
    if (!option) {
      console.warn("No option type found for ID:", optionTypeId);
      return [];
    }

    const values = option.optionValues?.filter(ov => !ov.deleted) || [];
    console.log(`Found ${values.length} option values for ${option.name}`);
    return values;
  }

  // Update your submit method to not do any additional mapping
  onSubmit(): void {
    console.log("Form submitted, validity:", this.productForm.valid);

    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      console.log("Form value:", formValue);

      // Check if option names are properly set
      formValue.options.forEach((opt: any, index: number) => {
        console.log(`Option ${index}: id=${opt.id}, name='${opt.name}', values=${opt.values.length}`);
        if (!opt.name) {
          console.error(`Option ${index} has empty name! This will cause issues.`);
        }
      });

      const requestDto: CreateProductRequestDTO = {
        product: {
          name: formValue.name,
          description: formValue.description,
          brandId: formValue.brand,
          categoryId: formValue.category,
          basePrice: formValue.basePrice
        },
        // Use the form values directly - no additional mapping needed
        options: formValue.options,
        variants: formValue.variants.map((variant: any, index: number) => ({
          options: this.productVariants[index].options,
          price: variant.price,
          stock: variant.stock,
          sku: this.getSkuForVariant(index)
        }))
      };

      console.log('Creating product with request:', requestDto);

      this.productService.createProduct(requestDto).subscribe({
        next: (response) => {
          console.log('Product created successfully:', response);
          alert('Product created successfully!');
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          alert('Failed to create product. Check console for error.');
        }
      });
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched();
    }
  }

  // Add a method to reset the form
  resetForm(): void {
    this.productForm.reset();
    this.selectedCategory = null;
    this.productVariants = [];

    // Clear the options array
    while (this.options.length !== 0) {
      this.options.removeAt(0);
    }

    // Clear the variants array
    while (this.variants.length !== 0) {
      this.variants.removeAt(0);
    }
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    const optionsWithValues: {
      optionId: number;
      optionName: string;
      values: { optionValueId: number; valueName: string }[];
    }[] = [];

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options.at(i).value as { id: number; name: string; values: string[] };
      console.log("Processing option:", option);

      if (option.id && option.values && option.values.length > 0) {
        const optionType = this.optionTypes.find(ot => ot.id.toString() === option.id.toString());
        console.log("Found option type:", optionType);

        if (optionType) {
          const mappedValues = (option.values as string[])
            .map((valueString: string) => {
              const optionValueObj = optionType.optionValues?.find(ov => ov.value === valueString);

              if (optionValueObj && optionValueObj.id) {
                return {
                  optionValueId: Number(optionValueObj.id),
                  valueName: valueString
                };
              }
              return null;
            })
            .filter(value => value !== null) as { optionValueId: number; valueName: string }[];

          if (mappedValues.length > 0) {
            optionsWithValues.push({
              optionId: Number(option.id),
              optionName: option.name || this.getOptionTypeName(option.id.toString()),
              values: mappedValues
            });

            console.log("Added option with values:", optionsWithValues[optionsWithValues.length - 1]);
          }
        }
=======
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
>>>>>>> Stashed changes
      }
    }

    // If no options with values, return
    if (optionsWithValues.length === 0) {
<<<<<<< Updated upstream
      console.log("No valid options with values found");
      return;
    }

    console.log("Final optionsWithValues:", optionsWithValues);

    // Generate all combinations
    this.productVariants = this.variantGeneratorService.generateCombinations(optionsWithValues);
    console.log("Generated variants:", this.productVariants);
=======
      return;
    }

    // Generate all combinations
    this.productVariants = this.generateCombinations(optionsWithValues);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  getOptionTypeName(optionTypeId: string): string {
    const option = this.optionTypes.find(opt => opt.id === optionTypeId);
    return option ? option.name : optionTypeId;
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const stockValue = this.bulkStockValue;
=======
    // In a real app, you might want to show a dialog to input the stock value
    const stockValue = 10; // Default value or from dialog
>>>>>>> Stashed changes

    for (let i = 0; i < this.variants.length; i++) {
      this.variants.at(i).get('stock')?.setValue(stockValue);
    }
  }

  // Generate SKU for a variant
<<<<<<< Updated upstream
  getSkuForVariant(i: number): string {
    const productName = this.productForm.get('name')?.value || '';
    return this.productService.generateSku(productName, this.productVariants[i]);
  }

  // onSubmit(): void {
  //   if (this.productForm.invalid) {
  //     console.log('Form is invalid');
  //     this.markFormGroupTouched();
  //     return;
  //   }

  //   this.loading.submission = true;
  //   const formValue = this.productForm.value;
  //   console.log("Form value:", formValue);

  //   const requestDto: CreateProductRequestDTO = {
  //     product: {
  //       name: formValue.name,
  //       description: formValue.description,
  //       brandId: formValue.brand,
  //       categoryId: formValue.category,
  //       basePrice: formValue.basePrice
  //     },
  //     options: formValue.options,
  //     variants: formValue.variants.map((variant: any, index: number) => ({
  //       options: this.productVariants[index].options,
  //       price: variant.price,
  //       stock: variant.stock,
  //       sku: this.getSkuForVariant(index)
  //     }))
  //   };

  //   console.log('Creating product with request:', requestDto);
  //   this.productService.createProduct(requestDto).subscribe({
  //     next: (response) => {
  //       console.log('Product created successfully:', response);
  //       alert('Product created successfully!');
  //       this.loading.submission = false;
  //       this.resetForm();
  //     },
  //     error: (err) => {
  //       console.error('Failed to create product:', err);
  //       alert('Failed to create product. Check console for error.');
  //       this.loading.submission = false;
  //     }
  //   });
  // }

  // resetForm(): void {
  //   this.productForm.reset({
  //     name: '',
  //     description: '',
  //     brand: '',
  //     category: '',
  //     basePrice: 0
  //   });

  //   while (this.options.length) {
  //     this.options.removeAt(0);
  //   }

  //   while (this.variants.length) {
  //     this.variants.removeAt(0);
  //   }

  //   this.productVariants = [];
  //   this.selectedCategory = null;
  // }
=======
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

>>>>>>> Stashed changes

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
<<<<<<< Updated upstream

      if (key === 'options' && control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            Object.keys(group.controls).forEach(key => {
              group.get(key)?.markAsTouched();
            });
          }
        });
      }
=======
>>>>>>> Stashed changes
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