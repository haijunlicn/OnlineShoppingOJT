import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { BrandDTO, CreateProductRequestDTO, ProductOptionDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { CategoryDTO, CategoryFlatDTO, CategoryNode } from '../../../../core/models/category-dto';
import { OptionService } from '../../../../core/services/option.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { OptionTypeDTO, OptionValueDTO } from '../../../../core/models/option.model';
import { ProductService } from '../../../../core/services/product.service';
import { VariantGeneratorService } from '../../../../core/services/variant-generator.service';
import { ProductFormService } from '../../../../core/services/product-form.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    });
  }

  fetchBrands(): void {
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
    });
  }

  fetchOptionTypes(): void {
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
    });
  }

  // Flatten the hierarchical categories into a single array
  flattenCategories(): void {
    this.flatCategories = [];
    this.categoryService.flattenCategoriesRecursive(this.categories, this.flatCategories);
    console.log("Flattened categories:", this.flatCategories);
  }

  // Category selection methods
  selectCategory(category: CategoryDTO, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedCategory = category;
    this.productForm.get('categoryId')?.setValue(category.id);

    // Reset existing options
    this.options.clear();

    // Add option form groups from selected category
    if (category.optionTypes && category.optionTypes.length > 0) {
      for (const optionType of category.optionTypes) {
        const optionGroup = this.productFormService.createOptionGroup();
        optionGroup.patchValue({
          id: optionType.id,
          name: optionType.name,
          values: []
        });
        this.options.push(optionGroup);
      }
    }

    // Close dropdown logic...
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
    return `category-level-${Math.min(level, 4)}`;
  }

  constructor(
    // private fb: FormBuilder,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private optionService: OptionService,
    private productService: ProductService,
    private variantGeneratorService: VariantGeneratorService,
    public productFormService: ProductFormService,
    private router: Router,
    private route: ActivatedRoute
  ) {

    this.productForm = this.productFormService.createProductForm();
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

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

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
    this.productFormService.addOption(this.productForm);
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
          brandId: formValue.brandId,
          categoryId: formValue.categoryId,
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
        next: res => {
          console.log('Product created', res);
          this.router.navigate(['/admin/productList']);
          // handle success message, e.g., show toast
        },
        error: err => {
          console.error('Error:', err.message);
          // Show error message to user, e.g., set error variable or show toast
          // this.errorMessage = err.message;
        }
      });


      // this.productService.createProduct(requestDto).subscribe({
      //   next: (response) => {
      //     console.log('Product created successfully:', response);
      //     alert('Product created successfully!');
      //     this.resetForm();
      //   },
      //   error: (err) => {
      //     console.error('Failed to create product:', err);
      //     alert('Failed to create product. Check console for error.');
      //   }
      // });
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
    const variantsArray = this.productFormService.getVariantsArray(this.productForm);
    while (variantsArray.length) {
      variantsArray.removeAt(0);
    }
    this.productVariants = [];

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
      }
    }

    // If no options with values, return
    if (optionsWithValues.length === 0) {
      console.log("No valid options with values found");
      return;
    }

    console.log("Final optionsWithValues:", optionsWithValues);

    this.productVariants = this.variantGeneratorService.generateCombinations(optionsWithValues);

    const basePrice = this.productForm.get('basePrice')?.value || 0;

    this.productVariants.forEach(variant => {
      // Create a variant FormGroup using your service method
      const variantGroup = this.productFormService.createVariantGroup();

      // Patch default values (price, stock, sku)
      variantGroup.patchValue({
        price: basePrice,
        stock: 0,
        sku: ''
      });

      variantsArray.push(variantGroup);
    });
  }


  getOptionTypeName(optionTypeId: string): string {
    const option = this.optionTypes.find(opt => opt.id === optionTypeId);
    return option ? option.name : optionTypeId;
  }

  // Apply base price to all variants
  // applyBulkPrice(): void {
  //   const basePrice = this.productForm.get('price')?.value || 0;
  //   const variantsArray = this.productFormService.getVariantsArray(this.productForm);

  //   for (let i = 0; i < variantsArray.length; i++) {
  //     variantsArray.at(i).get('price')?.setValue(basePrice);
  //   }
  // }

  // Apply stock value to all variants
  applyBulkStock(): void {
    const stockValue = this.bulkStockValue;

    for (let i = 0; i < this.variants.length; i++) {
      this.variants.at(i).get('stock')?.setValue(stockValue);
    }
  }

  // Generate SKU for a variant
  getSkuForVariant(i: number): string {
    const productName = this.productForm.get('name')?.value || '';
    return this.productService.generateSku(productName, this.productVariants[i]);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();

      if (key === 'options' && control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            Object.keys(group.controls).forEach(key => {
              group.get(key)?.markAsTouched();
            });
          }
        });
      }
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