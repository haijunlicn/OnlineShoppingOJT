import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { BrandDTO, CreateProductRequestDTO, ImagePoolItem, ProductImageDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import { CategoryDTO, CategoryFlatDTO, CategoryNode } from '../../../../core/models/category-dto';
import { OptionService } from '../../../../core/services/option.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { OptionTypeDTO, OptionValueDTO } from '../../../../core/models/option.model';
import { ProductService } from '../../../../core/services/product.service';
import { VariantGeneratorService } from '../../../../core/services/variant-generator.service';
import { ProductFormService } from '../../../../core/services/product-form.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { OptionvalueService } from '@app/core/services/optionvalue.service';
import { AlertService } from '@app/core/services/alert.service';
import { distinctUntilChanged } from 'rxjs';
import { FormValidationService } from '@app/core/services/form-validation.service';

@Component({
  selector: "app-product-create",
  standalone: false,
  templateUrl: "./product-create.component.html",
  styleUrls: ["./product-create.component.css"],
})
export class ProductCreateComponent implements OnInit {
  productForm: FormGroup
  productVariants: ProductVariantDTO[] = []
  bulkStockValue = 10
  selectedCategory: CategoryDTO | null = null
  flatCategories: CategoryDTO[] = []
  brands: BrandDTO[] = []
  categories: CategoryDTO[] = []
  optionTypes: OptionTypeDTO[] = []
  displayPrice: string = '';

  // Centralized Image Pool
  imagePool: ImagePoolItem[] = []
  private imageIdCounter = 0

  // Bulk Variant Selection
  selectedVariants: Set<number> = new Set()
  selectedImageForBulkAssignment = ""
  bulkAssignmentMode = false

  // New: Variant management
  hasOptionsSelected = false
  removedVariantIndices: Set<number> = new Set()

  // Upload states
  uploading = false
  uploadProgress = 0
  errorMessage = ""

  loading = {
    categories: false,
    brands: false,
    optionTypes: false,
    submission: false,
  }

  @ViewChild("productFileInput") productFileInputRef!: ElementRef<HTMLInputElement>

  constructor(
    private categoryService: CategoryService,
    private brandService: BrandService,
    private optionService: OptionService,
    private optionValueService: OptionvalueService,
    private productService: ProductService,
    private variantGeneratorService: VariantGeneratorService,
    public productFormService: ProductFormService,
    private imageUploadService: CloudinaryService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private formValidation: FormValidationService,
  ) {
    this.productForm = this.productFormService.createProductForm()

    // Watch for option changes
    this.options.valueChanges.subscribe(() => {
      console.log("option changes");
      // this.refreshDisplayValues();
      this.checkOptionsAndGenerateVariants()
    })

    // Initialize with default variant
    this.initializeDefaultVariant()
  }

  ngOnInit(): void {
    this.fetchCategories()
    this.fetchBrands()
    this.fetchOptionTypes()
  }

  /**
   * Initialize with a default variant for products without options
   */
  private initializeDefaultVariant(): void {
    const defaultVariant = this.variantGeneratorService.generateDefaultVariant()
    this.productVariants = [defaultVariant]

    const variantsArray = this.productFormService.getVariantsArray(this.productForm)
    const variantGroup = this.productFormService.createVariantGroupWithImageAssignment()
    variantGroup.patchValue({
      price: 0,
      stock: 0,
      assignedImageId: "",
      isRemovable: false,
    })
    variantsArray.push(variantGroup)

    this.hasOptionsSelected = false
  }

  onDisplayPriceInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.displayPrice = input;

    const numericValue = Number(input.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      this.productForm.get('basePrice')?.setValue(numericValue, { emitEvent: false });
    }

    this.autoApplyBasePrice()
  }

  autoApplyBasePrice(): void {
    this.productFormService.applyBulkPrice(this.productForm);
    const variants = this.productFormService.getVariantsArray(this.productForm);
    console.log("Auto-applied base price to all variants");
    variants.controls.forEach((variant, i) => {
      console.log(`Variant ${i} new price: `, variant.get('price')?.value);
    });
  }

  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  brandDialogVisible = false;
  openBrandDialog() {
    this.brandDialogVisible = true;
  }
  onBrandCreated() {
    this.fetchBrands();
    // this.productForm.patchValue({ brandId: newBrand.id });
    this.brandDialogVisible = false;
  }

  categoryDialogVisible = false;
  editingCategory: CategoryDTO | null = null;
  parentCategoryForNew: CategoryDTO | null = null;
  categoryDropdown: any[] = []; // your dropdown data here
  openCategoryDialogForNew(parent?: CategoryDTO) {
    this.editingCategory = null;
    this.parentCategoryForNew = parent || null;
    // Fetch categories and wait before opening the dialog
    this.categoryService.getAllCategories().subscribe((categories) => {
      this.categoryDropdown = categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      }));
      console.log("Dropdown data:", this.categoryDropdown);
      this.categoryDialogVisible = true;
    });
  }
  onCategorySaved(savedCategory: CategoryDTO) {
    this.categoryDialogVisible = false;
    this.fetchCategories();
    this.selectedCategory = savedCategory;
  }

  // Dialog control
  optionDialogVisible: boolean = false;
  editingOption: OptionTypeDTO | null = null;
  optionValueDialogVisible: boolean = false;
  selectedOptionTypeForDialog: OptionTypeDTO | null = null;
  editingOptionValue: OptionValueDTO | null = null;
  openAddOptionDialog(): void {
    this.editingOption = null;
    this.optionDialogVisible = true;
  }
  onOptionTypeSaved(newType: OptionTypeDTO): void {
    this.optionService.createOptionType(newType).subscribe({
      next: () => {
        this.fetchOptionTypes();
        // Auto-select the new option in the form
        const index = this.options.length - 1;
        const group = this.options.at(index);
        if (group) {
          // Wait briefly to ensure fetchOptionTypes() completes before selection
          setTimeout(() => {
            const created = this.optionTypes.find(opt => opt.name === newType.name);
            if (created) {
              group.patchValue({ id: created.id, name: created.name, values: [] });
            }
          }, 300); // Slight delay to ensure updated list is in
        }
      },
      error: () => {
        this.alertService.toast('Failed to save new option type.', 'error');
      }
    });
  }
  openAddOptionValueDialog(optionTypeId: number): void {
    // Try to find the full option type
    const optionType = this.optionTypes.find(opt => Number(opt.id) == optionTypeId);
    if (!optionType) {
      console.warn(`OptionType with id ${optionTypeId} not found`);
      return;
    }
    // Set dialog state
    this.selectedOptionTypeForDialog = optionType;
    this.editingOptionValue = null;
    this.optionValueDialogVisible = true;
  }
  onOptionValueSaved(newValue: OptionValueDTO): void {
    const typeId = newValue.optionId;
    this.optionValueService.createOptionValue(newValue).subscribe({
      next: () => {
        // Re-fetch option values
        this.optionValueService.getValuesByOptionId(typeId).subscribe((values) => {
          const optionType = this.optionTypes.find(opt => +opt.id === typeId);
          if (optionType) {
            optionType.optionValues = values;
          }
          const newVal = values.find(v => v.value === newValue.value);
          const index = this.options.controls.findIndex(ctrl => +ctrl.get('id')?.value === typeId);
          if (index !== -1 && newVal) {
            this.toggleOptionValue(index, newVal.value);
          }
        });
      },
      error: () => {
        this.alertService.toast('Failed to save new option value.', 'error');
      }
    });
  }

  /**
   * Check if options are selected and generate appropriate variants
   */
  private checkOptionsAndGenerateVariants(): void {
    const hasValidOptions = this.hasValidOptionsSelected()
    if (hasValidOptions !== this.hasOptionsSelected) {
      this.hasOptionsSelected = hasValidOptions
    }
    this.generateProductVariants();
  }

  /**
   * Check if any valid options are selected
   */
  private hasValidOptionsSelected(): boolean {
    for (let i = 0; i < this.options.length; i++) {
      const option = this.options.at(i).value
      if (option.id && option.values && option.values.length > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Enhanced variant generation with default variant support
   */
  generateProductVariants(): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Clear existing variants
    while (variantsArray.length) {
      variantsArray.removeAt(0)
    }
    this.productVariants = []
    this.removedVariantIndices.clear()

    // Clear variant selections when regenerating
    this.selectedVariants.clear()
    this.bulkAssignmentMode = false

    if (!this.hasOptionsSelected) {
      // No options selected - use default variant
      this.initializeDefaultVariant()
      this.autoApplyBasePrice()
      return
    }

    // Generate variants from options
    const optionsWithValues = this.buildOptionsWithValues()

    if (optionsWithValues.length === 0) {
      this.initializeDefaultVariant()
      return
    }

    this.productVariants = this.variantGeneratorService.generateCombinations(optionsWithValues)

    const basePrice = this.productForm.get("basePrice")?.value || 0

    this.productVariants.forEach(() => {
      const variantGroup = this.productFormService.createVariantGroupWithImageAssignment()
      variantGroup.patchValue({
        price: basePrice,
        stock: 0,
        assignedImageId: "",
        isRemovable: true,
      })
      variantsArray.push(variantGroup)
    })

    this.autoApplyBasePrice();
  }

  /**
   * Build options with values for variant generation
   */
  private buildOptionsWithValues(): any[] {
    const optionsWithValues: any[] = []

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options.at(i).value as { id: number; name: string; values: string[] }

      if (option.id && option.values && option.values.length > 0) {
        const optionType = this.optionTypes.find((ot) => ot.id.toString() === option.id.toString())

        if (optionType) {
          const mappedValues = (option.values as string[])
            .map((valueString: string) => {
              const optionValueObj = optionType.optionValues?.find((ov) => ov.value === valueString)
              if (optionValueObj && optionValueObj.id) {
                return {
                  optionValueId: Number(optionValueObj.id),
                  valueName: valueString,
                }
              }
              return null
            })
            .filter((value) => value !== null) as { optionValueId: number; valueName: string }[]

          if (mappedValues.length > 0) {
            optionsWithValues.push({
              optionId: Number(option.id),
              optionName: option.name || this.getOptionTypeName(option.id.toString()),
              values: mappedValues,
            })
          }
        }
      }
    }

    return optionsWithValues
  }

  /**
   * Remove a specific variant
   */
  removeVariant(variantIndex: number): void {
    if (!this.productVariants[variantIndex]?.isRemovable) {
      return // Cannot remove default variant
    }
    // Remove from form array
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)
    variantsArray.removeAt(variantIndex)
    // Remove from product variants
    this.productVariants.splice(variantIndex, 1)
    // Update selected variants indices
    const newSelectedVariants = new Set<number>()
    this.selectedVariants.forEach((index) => {
      if (index < variantIndex) {
        newSelectedVariants.add(index)
      } else if (index > variantIndex) {
        newSelectedVariants.add(index - 1)
      }
      // Skip the removed index
    })
    this.selectedVariants = newSelectedVariants
    // Clear any image assignments for removed variant
    this.clearVariantImageAssignments("")
  }

  /**
   * Check if variant can be removed
   */
  canRemoveVariant(variantIndex: number): boolean {
    return this.productVariants[variantIndex]?.isRemovable !== false
  }

  /**
   * Get display label for variant
   */
  getVariantDisplayLabel(variantIndex: number): string {
    const variant = this.productVariants[variantIndex]
    if (!variant) return ""
    if (variant.isDefault) {
      return "Default Variant"
    }
    return variant.displayLabel || variant.options.map((opt) => `${opt.optionName}: ${opt.valueName}`).join(", ")
  }

  // Image Pool Methods with Display Order Management
  triggerImageUpload(): void {
    if (this.imagePool.length >= 10) {
      this.errorMessage = "Maximum 10 images allowed"
      return
    }
    this.productFileInputRef.nativeElement.click()
  }

  onImagesSelected(event: any): void {
    const files = Array.from((event.target as HTMLInputElement).files || []) as File[]
    const remainingSlots = 10 - this.imagePool.length
    const filesToAdd = files.slice(0, remainingSlots)
    this.errorMessage = ""

    filesToAdd.forEach((file) => {
      const validation = this.imageUploadService.validateImageFile(file)
      if (validation.valid) {
        const imageItem: ImagePoolItem = {
          id: `img_${++this.imageIdCounter}`,
          file: file,
          previewUrl: URL.createObjectURL(file),
          displayOrder: this.imagePool.length,
          isMain: this.imagePool.length === 0,
          altText: "",
        }
        this.imagePool.push(imageItem)
        this.updateDisplayOrders()
      } else {
        this.errorMessage = validation.error || "Invalid file"
      }
    })
    event.target.value = ""
  }

  removeImageFromPool(imageId: string): void {
    const index = this.imagePool.findIndex((img) => img.id === imageId)
    if (index !== -1) {
      URL.revokeObjectURL(this.imagePool[index].previewUrl)
      this.imagePool.splice(index, 1)
      this.updateDisplayOrders()

      if (this.imagePool.length > 0 && !this.imagePool.some((img) => img.isMain)) {
        this.imagePool[0].isMain = true
      }

      this.clearVariantImageAssignments(imageId)
    }
  }

  setMainImage(imageId: string): void {
    this.imagePool.forEach((img) => {
      img.isMain = img.id === imageId
    })
  }

  // Display Order Management
  moveImageUp(imageId: string): void {
    const index = this.imagePool.findIndex((img) => img.id === imageId)
    if (index > 0) {
      ;[this.imagePool[index], this.imagePool[index - 1]] = [this.imagePool[index - 1], this.imagePool[index]]
      this.updateDisplayOrders()
    }
  }

  moveImageDown(imageId: string): void {
    const index = this.imagePool.findIndex((img) => img.id === imageId)
    if (index < this.imagePool.length - 1) {
      ;[this.imagePool[index], this.imagePool[index + 1]] = [this.imagePool[index + 1], this.imagePool[index]]
      this.updateDisplayOrders()
    }
  }

  updateDisplayOrders(): void {
    this.imagePool.forEach((img, index) => {
      img.displayOrder = index
    })
  }

  canMoveUp(imageId: string): boolean {
    const index = this.imagePool.findIndex((img) => img.id === imageId)
    return index > 0
  }

  canMoveDown(imageId: string): boolean {
    const index = this.imagePool.findIndex((img) => img.id === imageId)
    return index < this.imagePool.length - 1
  }

  // Bulk Variant Selection Methods
  toggleBulkAssignmentMode(): void {
    this.bulkAssignmentMode = !this.bulkAssignmentMode
    if (!this.bulkAssignmentMode) {
      this.selectedVariants.clear()
      this.selectedImageForBulkAssignment = ""
    }
  }

  toggleVariantSelection(variantIndex: number): void {
    if (this.selectedVariants.has(variantIndex)) {
      this.selectedVariants.delete(variantIndex)
    } else {
      this.selectedVariants.add(variantIndex)
    }
  }

  selectAllVariants(): void {
    for (let i = 0; i < this.variants.length; i++) {
      this.selectedVariants.add(i)
    }
  }

  clearVariantSelection(): void {
    this.selectedVariants.clear()
  }

  isVariantSelected(variantIndex: number): boolean {
    return this.selectedVariants.has(variantIndex)
  }

  getSelectedVariantsCount(): number {
    return this.selectedVariants.size
  }

  applyBulkImageAssignment(): void {
    if (!this.selectedImageForBulkAssignment || this.selectedVariants.size === 0) {
      return
    }

    this.selectedVariants.forEach((variantIndex) => {
      if (this.selectedImageForBulkAssignment === "clear") {
        // Clear the image assignment
        this.assignImageToVariant(variantIndex, "")
      } else {
        // Assign the selected image
        this.assignImageToVariant(variantIndex, this.selectedImageForBulkAssignment)
      }
    })

    // Clear selection after assignment
    this.selectedVariants.clear()
    this.selectedImageForBulkAssignment = ""
    this.bulkAssignmentMode = false
  }

  // Variant Image Assignment Methods
  assignImageToVariant(variantIndex: number, imageId: string): void {
    const variantControl = this.variants.at(variantIndex)
    variantControl.get("assignedImageId")?.setValue(imageId)
  }

  getAssignedImage(variantIndex: number): ImagePoolItem | null {
    const assignedImageId = this.variants.at(variantIndex).get("assignedImageId")?.value
    return this.imagePool.find((img) => img.id === assignedImageId) || null
  }

  clearVariantImageAssignments(imageId: string): void {
    for (let i = 0; i < this.variants.length; i++) {
      const assignedImageId = this.variants.at(i).get("assignedImageId")?.value
      if (assignedImageId === imageId) {
        this.variants.at(i).get("assignedImageId")?.setValue("")
      }
    }
  }

  getAvailableImagesForVariant(): ImagePoolItem[] {
    return this.imagePool
  }

  // Upload all images and create product
  async onSubmit(): Promise<void> {
    if (!this.productForm.valid) {
      this.markFormGroupTouched()
      return
    }

    this.loading.submission = true
    this.uploading = true
    this.errorMessage = ""

    try {
      await this.uploadAllImagesFromPool()

      const formValue = this.productForm.value

      const productImages: ProductImageDTO[] = this.imagePool.map((img) => ({
        imgPath: img.uploadedUrl!,
        imageUrl: img.uploadedUrl!, 
        displayOrder: img.displayOrder,
        mainImageStatus: img.isMain,
        altText: img.altText,
      }));


      const requestDto: CreateProductRequestDTO = {
        product: {

          name: formValue.name,
          description: formValue.description,
          brandId: formValue.brandId,
          categoryId: formValue.categoryId,
          basePrice: formValue.basePrice,
          
          category: {
      id: formValue.categoryId,
      name: '' 
    },

    brand: {
      id: formValue.brandId,
      name: formValue.brandName || '', 
  logo: formValue.brandLogo || 'default-logo.png', 
    },
        },
        options: formValue.options,
        variants: formValue.variants.map((variant: any, index: number) => {
          const assignedImage = this.getAssignedImage(index)
          return {
            options: this.productVariants[index].options,
            price: variant.price,
            stock: variant.stock,
            sku: this.getSkuForVariant(index),
            imgPath: assignedImage?.uploadedUrl || "",
          }
        }),
        productImages: productImages,
      }

      console.log("Creating product:", requestDto)

      this.productService.createProduct(requestDto).subscribe({
        next: (res) => {
          console.log("Product created successfully", res)
          this.cleanupPreviewUrls()
          this.router.navigate(["/admin/productList"])
        },
        error: (err) => {
          console.error("Error creating product:", err)
          this.errorMessage = "Failed to create product. Please try again."
          this.loading.submission = false
          this.uploading = false
        },
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      this.errorMessage = "Image upload failed. Please try again."
      this.loading.submission = false
      this.uploading = false
    }
  }

  private async uploadAllImagesFromPool(): Promise<void> {
    const uploadPromises = this.imagePool.map(async (imageItem) => {
      if (!imageItem.uploaded) {
        const uploadedUrl = await this.imageUploadService.uploadImage(imageItem.file).toPromise()
        if (!uploadedUrl) throw new Error("Failed to upload image")
        imageItem.uploadedUrl = uploadedUrl
        imageItem.uploaded = true
      }
    })

    await Promise.all(uploadPromises)
  }

  private cleanupPreviewUrls(): void {
    this.imagePool.forEach((img) => URL.revokeObjectURL(img.previewUrl))
  }

  resetForm(): void {
    this.cleanupPreviewUrls()
    this.productForm.reset()
    this.selectedCategory = null
    this.productVariants = []
    this.imagePool = []
    this.imageIdCounter = 0
    this.selectedVariants.clear()
    this.selectedImageForBulkAssignment = ""
    this.bulkAssignmentMode = false

    while (this.options.length !== 0) {
      this.options.removeAt(0)
    }
    while (this.variants.length !== 0) {
      this.variants.removeAt(0)
    }

    this.initializeDefaultVariant();
  }

  // Existing methods remain the same...
  fetchCategories(): void {
    this.loading.categories = true
    this.categoryService.getCategoryTree().subscribe({
      next: (categoryTree) => {
        this.categories = categoryTree
        this.flattenCategories()
        this.loading.categories = false
        this.categoryDropdown = categoryTree
      },
      error: (err) => {
        console.error("Failed to fetch categories", err)
        this.loading.categories = false
      },
    })
  }

  fetchBrands(): void {
    this.loading.brands = true
    this.brandService.getAllBrands().subscribe({
      next: (data) => {
        this.brands = data
        this.loading.brands = false
      },
      error: (err) => {
        console.error("Failed to fetch brands", err)
        this.loading.brands = false
      },
    })
  }

  fetchOptionTypes(): void {
    this.loading.optionTypes = true
    this.optionService.getAllOptionTypes().subscribe({
      next: (data) => {
        this.optionTypes = data
        this.loading.optionTypes = false
      },
      error: (err) => {
        console.error("Failed to fetch option types", err)
        this.loading.optionTypes = false
      },
    })
  }

  flattenCategories(): void {
    this.flatCategories = []
    this.categoryService.flattenCategoriesRecursive(this.categories, this.flatCategories)
  }

  selectCategory(category: CategoryDTO, event: Event): void {
    event.preventDefault()
    event.stopPropagation()

    this.selectedCategory = category
    this.productForm.get("categoryId")?.setValue(category.id)
    this.options.clear()

    if (category.optionTypes && category.optionTypes.length > 0) {
      for (const optionType of category.optionTypes) {
        const optionGroup = this.productFormService.createOptionGroup()
        optionGroup.patchValue({
          id: optionType.id,
          name: optionType.name,
          values: [],
        })
        this.options.push(optionGroup)
      }
    }

    const dropdown = document.getElementById("categoryDropdown")
    if (dropdown) {
      const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(dropdown)
      if (bsDropdown) {
        bsDropdown.hide()
      }
    }
  }

  getSelectedCategoryPath(): string {
    if (!this.selectedCategory) return ""
    return this.getCategoryPath(this.selectedCategory.id)
  }

  getCategoryPath(categoryId: number | undefined): string {
    const category = this.flatCategories.find((cat) => cat.id === categoryId)
    if (!category) return ""

    const path: string[] = []
    let currentCategory: CategoryDTO | undefined = category

    while (currentCategory) {
      path.unshift(currentCategory.name!)
      if (currentCategory.parentCategoryId) {
        currentCategory = this.flatCategories.find((cat) => cat.id === currentCategory!.parentCategoryId)
      } else {
        break
      }
    }
    return path.join(" > ")
  }

  getCategoryIndentClass(level: number): string {
    return `category-level-${Math.min(level, 4)}`
  }

  get options(): FormArray {
    return this.productForm.get("options") as FormArray
  }

  get variants(): FormArray {
    return this.productForm.get("variants") as FormArray
  }

  removeOption(index: number): void {
    this.options.removeAt(index)
  }

  onOptionTypeChange(index: number): void {
    const selectedTypeId = this.options.at(index).get("id")?.value

    if (!selectedTypeId) {
      this.options.at(index).patchValue({
        name: "",
        values: [],
      })
      return
    }

    const selectedOptionType = this.optionTypes.find((ot) => ot.id.toString() === selectedTypeId)

    if (selectedOptionType) {
      this.options.at(index).patchValue({
        name: selectedOptionType.name,
        values: [],
      })
    }
  }

  addOption(): void {
    this.productFormService.addOption(this.productForm)
  }

  getOptionValues(optionTypeId: string | number | null | undefined): OptionValueDTO[] {
    if (!optionTypeId) {
      return []
    }

    const option = this.optionTypes.find((opt) => opt.id.toString() === optionTypeId.toString())
    if (!option) {
      return []
    }

    return option.optionValues?.filter((ov) => !ov.deleted) || []
  }

  toggleOptionValue(optionIndex: number, value: string): void {
    const valuesControl = this.options.at(optionIndex).get("values")
    const currentValues = valuesControl?.value || []

    if (currentValues.includes(value)) {
      const newValues = currentValues.filter((v: string) => v !== value)
      valuesControl?.setValue(newValues)
    } else {
      valuesControl?.setValue([...currentValues, value])
    }
  }

  removeOptionValue(optionIndex: number, valueToRemove: string): void {
    const valuesControl = this.options.at(optionIndex).get("values")
    const currentValues = valuesControl?.value || []
    const newValues = currentValues.filter((v: string) => v !== valueToRemove)
    valuesControl?.setValue(newValues)
  }

  isValueSelected(optionIndex: number, value: string): boolean {
    const values = this.options.at(optionIndex).get("values")?.value || []
    return values.includes(value)
  }

  getSelectedValuesCount(optionIndex: number): number {
    const values = this.options.at(optionIndex).get("values")?.value || []
    return values.length
  }

  getOptionTypeName(optionTypeId: string): string {
    const option = this.optionTypes.find((opt) => opt.id === optionTypeId)
    return option ? option.name : optionTypeId
  }

  applyBulkStock(): void {
    this.productFormService.applyBulkStock(this.variants, this.bulkStockValue);
  }

  getSkuForVariant(i: number): string {
    const productName = this.productForm.get("name")?.value || ""
    const variant = this.productVariants[i]
    return this.productFormService.getSkuForVariant(productName, variant)
  }
  
  markFormGroupTouched(): void {
    this.formValidation.markFormGroupTouched(this.productForm);
  }

  hasError(fieldName: string): boolean {
    return this.formValidation.hasError(this.productForm, fieldName);
  }

  getErrorMessage(fieldName: string): string {
    return this.formValidation.getErrorMessage(this.productForm, fieldName);
  }

}
