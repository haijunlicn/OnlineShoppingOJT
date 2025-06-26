import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
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
import { FormValidationService } from '@app/core/services/form-validation.service';

@Component({
  selector: "app-product-edit",
  standalone: false,
  templateUrl: "./product-edit.component.html",
  styleUrls: ["./product-edit.component.css"],
})
export class ProductEditComponent implements OnInit {
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

  existingVariants: ProductVariantDTO[] = [] // Variants loaded from DB
  newVariants: ProductVariantDTO[] = [] // Newly generated variants
  existingVariantCombinations: Set<string> = new Set<string>()

  loading = {
    categories: false,
    brands: false,
    optionTypes: false,
    submission: false,
  }

  @ViewChild("productFileInput") productFileInputRef!: ElementRef<HTMLInputElement>

  // --- VARIANT SEPARATION ---
  productId: number | null = null;

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
  }

  ngOnInit(): void {
    // Get product ID from route
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.productId = +id;
        this.loadProductForEdit(this.productId);
      }
    });
    this.fetchCategories()
    this.fetchBrands()
    this.fetchOptionTypes()

    // Reactive sync from raw value to formatted display
    this.productForm.get('basePrice')?.valueChanges.subscribe((val: number) => {
      this.displayPrice = this.formatPrice(val);
    });
  }

  /**
   * Build a set of existing variant combinations to avoid duplicates
   */
  private buildExistingVariantCombinations()
    : void {
    this.existingVariantCombinations.clear()
    this.existingVariants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        // Create a unique key for this combination
        const combinationKey = this.createVariantCombinationKey(variant.options)
        this.existingVariantCombinations.add(combinationKey)
      }
    })
  }

  /**
   * Create a unique key for variant option combination
   */
  private createVariantCombinationKey(options: any[])
    : string {
    return options
      .map(opt => `${opt.optionId}:${opt.optionValueId}`)
      .sort()
      .join('|');
  }

  /**
   * Initialize form controls for existing variants
   */
  initializeExistingVariantForms(): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Clear existing form controls
    while (variantsArray.length) variantsArray.removeAt(0)

    // Add form controls for existing variants
    this.existingVariants.forEach((variant: ProductVariantDTO) => {
      const group = this.productFormService.createVariantGroupWithImageAssignment()

      // Ensure price is a proper number
      const priceValue = variant.price ? Number(variant.price) : 0

      group.patchValue({
        price: priceValue, // Make sure this is a number
        stock: variant.stock || 0,
        assignedImageId: this.findImageIdByUrl(variant.imgPath!),
        isRemovable: false,
        options: variant.options || [],
        sku: variant.sku || "",
      })

      // Explicitly set the price control value to ensure it's properly initialized
      const priceControl = group.get("price")
      if (priceControl && priceValue) {
        priceControl.setValue(priceValue, { emitEvent: true })
      }

      variantsArray.push(group)
    })

    console.log(
      "Initialized existing variants with prices:",
      this.existingVariants.map((v) => v.price),
    )
  }

  /**
   * Force update price display components
   */
  forceUpdatePriceDisplays()
    : void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Trigger value changes for all price controls to ensure proper formatting
    for (let i = 0; i < variantsArray.length; i++) {
      const priceControl = variantsArray.at(i).get("price")
      if (priceControl && priceControl.value !== null && priceControl.value !== undefined) {
        const currentValue = priceControl.value
        // Trigger the valueChanges observable
        priceControl.setValue(currentValue, { emitEvent: true })
      }
    }
    console.log("Forced update of price displays")
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';
    return value.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }

  /**
   * Enhanced loadProductForEdit with better price handling
   */
  loadProductForEdit(productId: number)
    : void {
    this.productService.getProductById(productId).subscribe({
      next: (productCard: any) => {
        // Populate form fields
        const product = productCard.product
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          brandId: product.brandId,
          categoryId: product.categoryId,
          basePrice: product.basePrice,
        })

        // Set selected category
        this.selectedCategory = productCard.category

        // Set images (if any)
        if (product.productImages && product.productImages.length > 0) {
          this.imagePool = product.productImages.map((img: ProductImageDTO, idx: number) => ({
            id: `img_${++this.imageIdCounter}`,
            file: null as any,
            previewUrl: img.imgPath || "",
            displayOrder: img.displayOrder,
            isMain: img.mainImageStatus,
            altText: img.altText || "",
            uploaded: true,
            uploadedUrl: img.imgPath,
          }))
        }

        // Set options (for editing/generation)
        this.options.clear()
        if (productCard.options && productCard.options.length > 0) {
          for (const opt of productCard.options) {
            const optionGroup = this.productFormService.createOptionGroup()
            optionGroup.patchValue({
              id: opt.id,
              name: opt.name,
              values: opt.optionValues.map((v: OptionValueDTO) => v.value),
            })
            this.options.push(optionGroup)
          }
        }

        // --- IMPROVED VARIANT HANDLING WITH PROPER PRICE FORMATTING ---
        // Store existing variants with proper price conversion
        this.existingVariants = (productCard.variants || []).map((variant: any) => ({
          ...variant,
          price: variant.price ? Number(variant.price) : 0, // Ensure price is a number
          stock: variant.stock ? Number(variant.stock) : 0, // Ensure stock is a number
        }))
        console.log("Loaded existing variants:", this.existingVariants)
        this.buildExistingVariantCombinations()


        // Initialize form arrays for existing variants with proper price handling
        this.initializeExistingVariantForms()

        // Clear new variants initially
        this.newVariants = []
        this.clearNewVariantForms()

        // Set display price with proper formatting
        this.displayPrice = product.basePrice ? Number(product.basePrice).toLocaleString() : ""

        // ✅ Update displayPrice *after* patching
        setTimeout(() => {
          const rawBasePrice = this.productForm.get('basePrice')?.value;
          this.displayPrice = this.formatPrice(rawBasePrice);
        });
      },
      error: (err) => {
        this.errorMessage = "Failed to load product for editing."
        console.error("Error loading product:", err)
      },
    })
  }

  /**
   * Find image ID by URL for existing variants
   */
  private findImageIdByUrl(imgPath: string)
    : string {
    if (!imgPath) return '';
    const foundImage = this.imagePool.find((img) => img.uploadedUrl === imgPath)
    return foundImage ? foundImage.id : '';
  }

  /**
   * Clear new variant form controls
   */
  private clearNewVariantForms()
    : void {
    // New variants will be added after existing variants in the form array
    // We'll manage this in the generateNewVariants method
  }

  /**
   * Enhanced variant generation - only generate NEW combinations
   */
  generateProductVariants(): void {
    // Fixed undeclared variable
    console.log("Generating product variants...")

    // Don't clear existing variants, only generate new ones
    this.generateNewVariants() // Fixed undeclared variable
  }

  /**
   * Enhanced variant generation with proper price initialization
   */
  generateNewVariants()
    : void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Remove only the new variant form controls (keep existing ones)
    const existingVariantCount = this.existingVariants.length
    while (variantsArray.length > existingVariantCount) {
      variantsArray.removeAt(existingVariantCount)
    }

    // Clear new variants array
    this.newVariants = []
    this.selectedVariants.clear()
    this.bulkAssignmentMode = false

    if (!this.hasValidOptionsSelected()) {
      // If no options selected and no existing variants, create default
      if (this.existingVariants.length === 0) {
        this.initializeDefaultVariant()
      }
      return;
    }

    const optionsWithValues = this.buildOptionsWithValues()
    if (optionsWithValues.length === 0) {
      return;
    }

    // Generate all possible combinations
    const allPossibleVariants = this.variantGeneratorService.generateCombinations(optionsWithValues)

    // Filter out combinations that already exist
    const newVariantCombinations = allPossibleVariants.filter((variant) => {
      const combinationKey = this.createVariantCombinationKey(variant.options)
      return !this.existingVariantCombinations.has(combinationKey)
    })

    // Store new variants
    this.newVariants = newVariantCombinations

    // Create form controls for new variants with proper price initialization
    const basePrice = this.productForm.get("basePrice")?.value || 0
    this.newVariants.forEach(() => {
      const variantGroup = this.productFormService.createVariantGroupWithImageAssignment()
      variantGroup.patchValue({
        price: Number(basePrice), // Ensure it's a number
        stock: 0,
        assignedImageId: "",
        isRemovable: true,
      })

      // Explicitly set the price control value
      const priceControl = variantGroup.get("price")
      if (priceControl) {
        priceControl.setValue(Number(basePrice), { emitEvent: true })
      }

      variantsArray.push(variantGroup)
    })

    console.log(`Generated ${this.newVariants.length} new variants with base price: ${basePrice}`)

    // Force update price displays for new variants
    setTimeout(() => {
      this.forceUpdatePriceDisplays()
    }, 100)
  }

  /**
   * Get total variants count
   */
  getTotalVariantsCount()
    : number {
    // Fixed undeclared variable
    return this.existingVariants.length + this.newVariants.length;
  }

  /**
   * Get variant at index (handles both existing and new)
   */
  getVariantAtIndex(index: number)
    : ProductVariantDTO {
    if (index < this.existingVariants.length) {
      return this.existingVariants[index];
    } else {
      const newIndex = index - this.existingVariants.length
      return this.newVariants[newIndex];
    }
  }

  /**
   * Check if variant is existing (from DB) or new
   */
  isExistingVariant(index: number)
    : boolean {
    return index < this.existingVariants.length;
  }

  /**
   * Enhanced variant removal - only allow removal of new variants
   */
  removeVariant(variantIndex: number): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm);

    // 1. Remove from form array
    variantsArray.removeAt(variantIndex);

    // 2. Remove from existingVariants or newVariants
    if (variantIndex < this.existingVariants.length) {
      this.existingVariants.splice(variantIndex, 1); // Removed variant won't be sent to backend
    } else {
      const newVariantIndex = variantIndex - this.existingVariants.length;
      if (newVariantIndex >= 0 && newVariantIndex < this.newVariants.length) {
        this.newVariants.splice(newVariantIndex, 1);
      }
    }

    // 3. Update selectedVariants indices
    const newSelectedVariants = new Set<number>();
    this.selectedVariants.forEach(index => {
      if (index < variantIndex) {
        newSelectedVariants.add(index);
      } else if (index > variantIndex) {
        newSelectedVariants.add(index - 1);
      }
      // skip if equal to removed index
    });
    this.selectedVariants = newSelectedVariants;
  }

  /**
   * Enhanced variant display label
   */
  getVariantDisplayLabel(variantIndex: number)
    : string {
    const variant = this.getVariantAtIndex(variantIndex)
    if (!variant) return "";

    if (variant.isDefault) {
      return "Default Variant";
    }

    if (!variant.options || variant.options.length === 0) {
      return "Default Variant";
    }

    return variant.options.map((opt) => `${opt.optionName}: ${opt.valueName}`).join(", ");
  }

  /**
   * Enhanced canRemoveVariant - only new variants can be removed
   */
  canRemoveVariant(variantIndex: number): boolean {
    return !this.isExistingVariant(variantIndex);
  }

  /**
   * Enhanced submit method
   */
  async onSubmit()
    : Promise<void> {
    if (!this.productForm.valid) {
      this.markFormGroupTouched()
      return;
    }

    this.loading.submission = true
    this.uploading = true
    this.errorMessage = ""

    try {
      await this.uploadAllImagesFromPool()
      const formValue = this.productForm.value
      const productImages: ProductImageDTO[] = this.imagePool.map((img) => ({
        imgPath: img.uploadedUrl!,
        displayOrder: img.displayOrder,
        mainImageStatus: img.isMain,
        altText: img.altText,
      }))

      // Combine existing and new variants
      const allVariants: ProductVariantDTO[] = []

      // Add existing variants (updated with form values)
      this.existingVariants.forEach((variant, index) => {
        const formVariant = formValue.variants[index]
        const assignedImage = this.getAssignedImage(index)

        allVariants.push({
          ...variant,
          price: formVariant?.price || variant.price,
          stock: formVariant?.stock || variant.stock,
          imgPath: assignedImage?.uploadedUrl || variant.imgPath,
        })
      })

      // Add new variants
      this.newVariants.forEach((variant, index) => {
        const formIndex = this.existingVariants.length + index
        const formVariant = formValue.variants[formIndex]
        const assignedImage = this.getAssignedImage(formIndex)

        allVariants.push({
          ...variant,
          price: formVariant?.price || 0,
          stock: formVariant?.stock || 0,
          sku: this.getSkuForVariant(formIndex),
          imgPath: assignedImage?.uploadedUrl || "",
        })
      })

      const requestDto: CreateProductRequestDTO = {
        product: {
          id: this.productId!,
          name: formValue.name,
          description: formValue.description,
          brandId: formValue.brandId,
          categoryId: formValue.categoryId,
          basePrice: formValue.basePrice,
        },
        options: formValue.options,
        variants: allVariants,
        productImages: productImages,
      }

      console.log("Updating product:", requestDto)

      this.productService.updateProduct(requestDto).subscribe({
        next: (res) => {
          console.log("Product updated successfully", res)
          this.cleanupPreviewUrls()
          this.router.navigate(["/admin/productList"])
        },
        error: (err) => {
          console.error("Error updating product:", err)
          this.errorMessage = "Failed to update product. Please try again."
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
    console.log("image pool : ", this.imagePool);

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

  /**
   * Enhanced reset form
   */
  resetForm(): void {
    this.cleanupPreviewUrls()
    this.productForm.reset()
    this.selectedCategory = null
    this.imagePool = []
    this.imageIdCounter = 0
    this.selectedVariants.clear()
    this.selectedImageForBulkAssignment = ""
    this.bulkAssignmentMode = false

    // Clear variant arrays
    this.existingVariants = []
    this.newVariants = []
    this.existingVariantCombinations.clear()

    while (this.options.length !== 0) {
      this.options.removeAt(0)
    }
    while (this.variants.length !== 0) {
      this.variants.removeAt(0)
    }
  }

  /**
   * Initialize with a default variant for products without options
   */
  private initializeDefaultVariant()
    : void {
    const defaultVariant = this.variantGeneratorService.generateDefaultVariant()
    this.newVariants = [defaultVariant]
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

  // Update the bulk operations to work on all variants\
  selectAllVariants()
    : void {
    // Select all variants (both existing and new)
    for (let i = 0; i < this.getTotalVariantsCount(); i++) {
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

  // Update bulk stock application to work on all variants
  applyBulkStock()
    : void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Apply to all variants
    for (let i = 0; i < variantsArray.length; i++) {
      const stockControl = variantsArray.at(i).get("stock")
      if (stockControl) {
        stockControl.setValue(this.bulkStockValue)
      }
    }

    console.log(`Applied bulk stock value ${this.bulkStockValue} to all ${variantsArray.length} variants`)
  }

  // Update bulk image assignment to work on all variants
  applyBulkImageAssignment()
    : void {
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

    console.log("Applied bulk image assignment to selected variants")
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

  private cleanupPreviewUrls(): void {
    this.imagePool.forEach((img) => URL.revokeObjectURL(img.previewUrl))
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

  // Fix the SKU generation for all variants
  getSkuForVariant(i: number)
    : string {
    const productName = this.productForm.get("name")?.value || "PRODUCT"
    const variant = this.getVariantAtIndex(i)

    if (!variant) {
      return `${productName.toUpperCase().replace(/\s+/g, '-')}-DEFAULT`
    }

    return this.productFormService.getSkuForVariant(productName, variant)
  }

  // Add method to check if variant can be selected for bulk operations
  canSelectVariantForBulk(variantIndex: number)
    : boolean {
    // All variants can be selected for bulk operations
    return true;
  }

  // Add method to get variant status
  getVariantStatus(variantIndex: number)
    : string {
    return this.isExistingVariant(variantIndex) ? 'existing' : 'new';
  }

  // Add method to get variant status badge class
  getVariantStatusBadgeClass(variantIndex: number)
    : string {
    return this.isExistingVariant(variantIndex) ? 'bg-info' : 'bg-success';
  }

  // Add method to get variant status text
  getVariantStatusText(variantIndex: number)
    : string {
    return this.isExistingVariant(variantIndex) ? 'Existing' : 'New';
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
