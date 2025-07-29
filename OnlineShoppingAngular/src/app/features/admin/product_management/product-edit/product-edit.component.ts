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
  selectedBrand: BrandDTO | null = null
  flatCategories: CategoryDTO[] = []
  brands: BrandDTO[] = []
  categories: CategoryDTO[] = []
  optionTypes: OptionTypeDTO[] = []
  displayPrice = ""
  baseSku = "SKU"

  // Track original option values for edit restrictions
  originalOptionValues: Map<number, string[]> = new Map()

  // Track which options are existing vs new
  existingOptionIds: Set<number> = new Set()

  // Manual assignment tracking
  variantNewOptionAssignments: { [variantIndex: number]: { [optionName: string]: string } } = {}

  // FIXED: Cache option type names to prevent infinite loops
  private optionTypeNamesCache: Map<string, string> = new Map()

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

  existingVariants: ProductVariantDTO[] = []
  newVariants: ProductVariantDTO[] = []
  existingVariantCombinations: Set<string> = new Set<string>()

  // FIXED: Add flag to prevent infinite loops
  private isUpdatingOptions = false

  loading = {
    categories: false,
    brands: false,
    optionTypes: false,
    submission: false,
  }

  @ViewChild("productFileInput") productFileInputRef!: ElementRef<HTMLInputElement>

  // Dialog control
  optionDialogVisible = false
  editingOption: OptionTypeDTO | null = null
  optionValueDialogVisible = false
  selectedOptionTypeForDialog: OptionTypeDTO | null = null
  editingOptionValue: OptionValueDTO | null = null

  productId: number | null = null

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

    // FIXED: Simplified option change detection to prevent infinite loops
    this.options.valueChanges.subscribe(() => {
      if (!this.isUpdatingOptions) {
        console.log("Option changes detected")
        this.checkOptionsAndGenerateVariants()
      }
    })
  }

  ngOnInit(): void {
    // Get product ID from route
    this.route.params.subscribe((params) => {
      const id = params["id"]
      if (id) {
        this.productId = +id
        this.loadProductForEdit(this.productId)
      }
    })
    this.fetchCategories()
    this.fetchBrands()
    this.fetchOptionTypes()

    // Reactive sync from raw value to formatted display
    this.productForm.get("basePrice")?.valueChanges.subscribe((val: number) => {
      this.displayPrice = this.formatPrice(val)
    })

    // Watch for brand changes and update baseSku
    this.productForm.get("brandId")?.valueChanges.subscribe(() => {
      const brandId = this.productForm.get("brandId")?.value
      const selectedBrand = this.brands.find((b) => b.id == brandId)
      this.selectedBrand = selectedBrand || null
      this.baseSku = selectedBrand?.baseSku || "SKU"
      this.updateVariantSkusBasedOnBrand()
    })
  }

  /**
   * FIXED: Cache option type names to prevent infinite template calls
   */
  private buildOptionTypeNamesCache(): void {
    this.optionTypeNamesCache.clear()
    this.optionTypes.forEach((optionType) => {
      this.optionTypeNamesCache.set(optionType.id.toString(), optionType.name)
    })
  }

  /**
   * Update variant SKUs in form for display purposes
   */
  updateVariantSkusBasedOnBrand(): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)
    const existingCount = this.existingVariants.length

    // Update only new variants (after existing ones)
    for (let i = existingCount; i < variantsArray.length; i++) {
      const control = variantsArray.at(i)
      control.patchValue({ sku: this.baseSku })
    }
  }

  /**
   * Build a set of existing variant combinations to avoid duplicates
   */
  private buildExistingVariantCombinations(): void {
    this.existingVariantCombinations.clear()
    this.existingVariants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        const combinationKey = this.createVariantCombinationKey(variant.options)
        this.existingVariantCombinations.add(combinationKey)
      }
    })
  }

  /**
   * Create a unique key for variant option combination
   */
  private createVariantCombinationKey(options: any[]): string {
    return options
      .map((opt) => `${opt.optionId}:${opt.optionValueId}`)
      .sort()
      .join("|")
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

      const priceValue = variant.price ? Number(variant.price) : 0

      group.patchValue({
        price: priceValue,
        stock: variant.stock || 0,
        assignedImageId: this.findImageIdByUrl(variant.imgPath!),
        isRemovable: false,
        options: variant.options || [],
        sku: variant.sku || "",
      })

      const priceControl = group.get("price")
      if (priceControl && priceValue) {
        priceControl.setValue(priceValue, { emitEvent: true })
      }

      variantsArray.push(group)
    })
  }

  /**
   * Force update price display components
   */
  forceUpdatePriceDisplays(): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    for (let i = 0; i < variantsArray.length; i++) {
      const priceControl = variantsArray.at(i).get("price")
      if (priceControl && priceControl.value !== null && priceControl.value !== undefined) {
        const currentValue = priceControl.value
        priceControl.setValue(currentValue, { emitEvent: true })
      }
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return ""
    return value.toLocaleString("en-US", { minimumFractionDigits: 0 })
  }

  /**
   * Enhanced loadProductForEdit with better price handling and brand tracking
   */
  loadProductForEdit(productId: number): void {
    this.productService.getProductById(productId).subscribe({
      next: (productCard: any) => {
        const product = productCard.product
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          brandId: product.brandId,
          categoryId: product.categoryId,
          basePrice: product.basePrice,
        })

        this.selectedCategory = productCard.category
        this.selectedBrand = this.brands.find((b) => b.id === product.brandId) || null
        this.baseSku = this.selectedBrand?.baseSku || "SKU"

        // Set images
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

        // FIXED: Simplified option loading to prevent loops
        this.isUpdatingOptions = true
        this.options.clear()
        this.originalOptionValues.clear()
        this.existingOptionIds.clear()

        if (productCard.options && productCard.options.length > 0) {
          for (const opt of productCard.options) {
            const optionGroup = this.productFormService.createOptionGroup()
            const optionValues = opt.optionValues.map((v: OptionValueDTO) => v.value)

            optionGroup.patchValue({
              id: opt.id,
              name: opt.name,
              values: optionValues,
            })
            this.options.push(optionGroup)

            // Track as existing option
            this.existingOptionIds.add(opt.id)
            this.originalOptionValues.set(opt.id, [...optionValues])
          }
        }
        this.isUpdatingOptions = false

        // FIXED: Build cache after loading option types
        this.buildOptionTypeNamesCache()

        // Store existing variants
        this.existingVariants = (productCard.variants || []).map((variant: any) => ({
          ...variant,
          price: variant.price ? Number(variant.price) : 0,
          stock: variant.stock ? Number(variant.stock) : 0,
        }))

        this.buildExistingVariantCombinations()
        this.initializeExistingVariantForms()
        this.initializeVariantAssignments()

        this.newVariants = []
        this.clearNewVariantForms()

        this.displayPrice = product.basePrice ? Number(product.basePrice).toLocaleString() : ""

        setTimeout(() => {
          const rawBasePrice = this.productForm.get("basePrice")?.value
          this.displayPrice = this.formatPrice(rawBasePrice)
        })
      },
      error: (err) => {
        this.errorMessage = "Failed to load product for editing."
        console.error("Error loading product:", err)
      },
    })
  }

  /**
   * Initialize variant assignments for manual assignment tracking
   */
  private initializeVariantAssignments(): void {
    this.variantNewOptionAssignments = {}
    this.existingVariants.forEach((variant, index) => {
      this.variantNewOptionAssignments[index] = {}
    })
  }

  /**
   * Find image ID by URL for existing variants
   */
  private findImageIdByUrl(imgPath: string): string {
    if (!imgPath) return ""
    const foundImage = this.imagePool.find((img) => img.uploadedUrl === imgPath)
    return foundImage ? foundImage.id : ""
  }

  /**
   * Clear new variant form controls
   */
  private clearNewVariantForms(): void {
    // New variants will be added after existing variants in the form array
  }

  /**
   * Enhanced variant generation - only generate NEW combinations
   */
  generateProductVariants(): void {
    console.log("Generating product variants...")
    this.generateNewVariants()
  }

  /**
   * Enhanced variant generation with proper price initialization and duplicate prevention
   */
  generateNewVariants(): void {
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
      if (this.existingVariants.length === 0) {
        this.initializeDefaultVariant()
      }
      return
    }

    const optionsWithValues = this.buildOptionsWithValues()
    if (optionsWithValues.length === 0) {
      return
    }

    // Generate all possible combinations
    const allPossibleVariants = this.variantGeneratorService.generateCombinations(optionsWithValues)

    // Filter out combinations that already exist or are manually assigned
    const newVariantCombinations = allPossibleVariants.filter((variant) => {
      const combinationKey = this.createVariantCombinationKey(variant.options)
      return !this.existingVariantCombinations.has(combinationKey) && !this.isManuallyAssigned(variant)
    })

    this.newVariants = newVariantCombinations

    // Create form controls for new variants
    const basePrice = this.productForm.get("basePrice")?.value || 0
    this.newVariants.forEach(() => {
      const variantGroup = this.productFormService.createVariantGroupWithImageAssignment()
      variantGroup.patchValue({
        price: Number(basePrice),
        stock: 0,
        assignedImageId: "",
        isRemovable: true,
        sku: this.baseSku,
      })

      const priceControl = variantGroup.get("price")
      if (priceControl) {
        priceControl.setValue(Number(basePrice), { emitEvent: true })
      }

      variantsArray.push(variantGroup)
    })

    setTimeout(() => {
      this.forceUpdatePriceDisplays()
    }, 100)
  }

  /**
   * Check if a variant combination is manually assigned to existing variants
   */
  private isManuallyAssigned(variant: ProductVariantDTO): boolean {
    // Check if this combination is covered by manual assignments
    for (let i = 0; i < this.existingVariants.length; i++) {
      const assignments = this.variantNewOptionAssignments[i]
      if (!assignments) continue

      let allAssigned = true
      for (const option of variant.options) {
        const optionName = option.optionName
        if (!optionName) continue // skip if optionName is undefined

        const assignedValue = assignments[optionName]
        if (!assignedValue || assignedValue !== option.valueName) {
          allAssigned = false
          break
        }
      }
      if (allAssigned) return true
    }
    return false
  }

  /**
   * Get total variants count
   */
  getTotalVariantsCount(): number {
    return this.existingVariants.length + this.newVariants.length
  }

  /**
   * Get total options count (existing + new)
   */
  getTotalOptionsCount(): number {
    return this.options.length
  }

  /**
   * Check if option is existing (read-only) or new
   */
  isExistingOption(index: number): boolean {
    const optionId = this.options.at(index).get("id")?.value
    return this.existingOptionIds.has(Number(optionId))
  }

  /**
   * Add new option type
   */
  addNewOptionType(): void {
    const optionGroup = this.productFormService.createOptionGroup()
    this.options.push(optionGroup)
  }

  addOption(): void {
    this.productFormService.addOption(this.productForm)
  }

  /**
   * Remove new option (only allowed for non-existing options)
   */
  removeNewOption(index: number): void {
    if (!this.isExistingOption(index)) {
      this.options.removeAt(index)
    }
  }

  /**
   * Handle new option type change
   */
  onNewOptionTypeChange(index: number): void {
    // console.log(`Triggered onNewOptionTypeChange for index: ${index}`);

    if (this.isExistingOption(index)) {
      // console.log(`Index ${index} is for an existing option. Change is ignored.`);
      return
    }

    const control = this.options.at(index)
    const selectedTypeId = control.get("id")?.value

    // onsole.log("Selected Option Type ID:", selectedTypeId);

    if (!selectedTypeId) {
      console.warn("No option type selected. Clearing name and values...")
      control.patchValue({
        name: "",
        values: [],
      })
      return
    }

    const selectedOptionType = this.optionTypes.find((ot) => ot.id.toString() === selectedTypeId.toString())

    console.log("Matched Option Type:", selectedOptionType)

    if (selectedOptionType) {
      console.log(`Setting name = ${selectedOptionType.name} and clearing values for index ${index}`)

      control.patchValue({
        name: selectedOptionType.name,
        values: [],
      })

      // Optionally log the available values for this type
      console.log("Available values for selected type:", selectedOptionType.optionValues)
    } else {
      console.warn("No option type matched the selected ID.")
    }
  }

  /**
   * Get available option types (excluding already used ones)
   */
  getAvailableOptionTypes(): OptionTypeDTO[] {
    const usedTypeIds = new Set<number>()

    // Add existing option IDs
    this.existingOptionIds.forEach((id) => usedTypeIds.add(id))

    // Add new option IDs
    for (let i = 0; i < this.options.length; i++) {
      const optionId = this.options.at(i).get("id")?.value
      if (optionId && !this.isExistingOption(i)) {
        usedTypeIds.add(Number(optionId))
      }
    }

    return this.optionTypes.filter((type) => !usedTypeIds.has(Number(type.id)))
  }

  /**
   * Get new options that require manual assignment
   */
  getNewOptions(): AbstractControl[] {
    return this.options.controls.filter((_, index) => !this.isExistingOption(index))
  }

  /**
   * Check if there are new options requiring assignment
   */
  hasNewOptionsRequiringAssignment(): boolean {
    return this.getNewOptions().length > 0 && this.existingVariants.length > 0
  }

  /**
   * Check if there are unassigned combinations
   */
  hasUnassignedCombinations(): boolean {
    if (!this.hasNewOptionsRequiringAssignment()) return false

    // Check if all existing variants have assignments for all new options
    for (let i = 0; i < this.existingVariants.length; i++) {
      const assignments = this.variantNewOptionAssignments[i]
      if (!assignments) return true

      for (const newOption of this.getNewOptions()) {
        const optionName = this.getOptionTypeName(newOption.get("id")?.value)
        if (!assignments[optionName]) return true
      }
    }
    return false
  }

  /**
   * FIXED: Apply manual assignments with duplicate prevention
   */
  applyManualAssignments(): void {
    console.log("Applying manual assignments...")

    // Update existing variants with new option assignments
    this.existingVariants.forEach((variant, index) => {
      const assignments = this.variantNewOptionAssignments[index]
      if (!assignments) return

      // Initialize options array if it doesn't exist
      if (!variant.options) variant.options = []

      // Add new options to existing variant (with duplicate checking)
      for (const newOption of this.getNewOptions()) {
        const optionId = newOption.get("id")?.value
        const optionName = this.getOptionTypeName(optionId)
        const assignedValue = assignments[optionName]

        if (assignedValue && optionId) {
          // FIXED: Check if this option already exists for this variant
          const existingOptionIndex = variant.options.findIndex((opt) => opt.optionId === Number(optionId))

          // Find the option value ID
          const optionType = this.optionTypes.find((ot) => ot.id.toString() === optionId.toString())
          const optionValue = optionType?.optionValues?.find((ov) => ov.value === assignedValue)

          if (optionValue) {
            const newOptionData = {
              optionId: Number(optionId),
              optionValueId: Number(optionValue.id),
              optionName: optionName,
              valueName: assignedValue,
            }

            if (existingOptionIndex >= 0) {
              // FIXED: Update existing option instead of adding duplicate
              console.log(`Updating existing option for variant ${index}: ${optionName} = ${assignedValue}`)
              variant.options[existingOptionIndex] = newOptionData
            } else {
              // Add new option
              console.log(`Adding new option to variant ${index}: ${optionName} = ${assignedValue}`)
              variant.options.push(newOptionData)
            }
          }
        }
      }
    })

    // Rebuild existing variant combinations
    this.buildExistingVariantCombinations()

    // Regenerate new variants (will exclude manually assigned combinations)
    this.generateNewVariants()

    this.alertService.toast("Manual assignments applied successfully!", "success")
  }

  /**
   * Get display label for existing variant
   */
  getExistingVariantDisplayLabel(variant: ProductVariantDTO): string {
    if (!variant.options || variant.options.length === 0) {
      return "Default Variant"
    }
    return variant.options.map((opt) => `${opt.optionName}: ${opt.valueName}`).join(", ")
  }

  /**
   * Get variant at index (handles both existing and new)
   */
  getVariantAtIndex(index: number): ProductVariantDTO {
    if (index < this.existingVariants.length) {
      return this.existingVariants[index]
    } else {
      const newIndex = index - this.existingVariants.length
      return this.newVariants[newIndex]
    }
  }

  /**
   * Check if variant is existing (from DB) or new
   */
  isExistingVariant(index: number): boolean {
    return index < this.existingVariants.length
  }

  /**
   * Enhanced variant removal - only allow removal of new variants
   */
  removeVariant(variantIndex: number): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    // Remove from form array
    variantsArray.removeAt(variantIndex)

    // Remove from existingVariants or newVariants
    if (variantIndex < this.existingVariants.length) {
      this.existingVariants.splice(variantIndex, 1)
    } else {
      const newVariantIndex = variantIndex - this.existingVariants.length
      if (newVariantIndex >= 0 && newVariantIndex < this.newVariants.length) {
        this.newVariants.splice(newVariantIndex, 1)
      }
    }

    // Update selectedVariants indices
    const newSelectedVariants = new Set<number>()
    this.selectedVariants.forEach((index) => {
      if (index < variantIndex) {
        newSelectedVariants.add(index)
      } else if (index > variantIndex) {
        newSelectedVariants.add(index - 1)
      }
    })
    this.selectedVariants = newSelectedVariants
  }

  /**
   * Enhanced variant display label
   */
  getVariantDisplayLabel(variantIndex: number): string {
    const variant = this.getVariantAtIndex(variantIndex)
    if (!variant) return ""

    if (variant.isDefault) {
      return "Default Variant"
    }

    if (!variant.options || variant.options.length === 0) {
      return "Default Variant"
    }

    return variant.options.map((opt) => `${opt.optionName}: ${opt.valueName}`).join(", ")
  }

  /**
   * Enhanced canRemoveVariant - only new variants can be removed
   */
  canRemoveVariant(variantIndex: number): boolean {
    return !this.isExistingVariant(variantIndex)
  }

  /**
   * Get existing values for an option (cannot be removed)
   */
  getExistingValuesForOption(optionIndex: number): string[] {
    const optionId = this.options.at(optionIndex).get("id")?.value
    return this.originalOptionValues.get(optionId) || []
  }

  /**
   * Get newly selected values for an option (can be removed)
   */
  getNewSelectedValues(optionIndex: number): string[] {
    const allValues = this.options.at(optionIndex).get("values")?.value || []
    const existingValues = this.getExistingValuesForOption(optionIndex)
    return allValues.filter((val: string) => !existingValues.includes(val))
  }

  /**
   * Get count of newly selected values
   */
  getNewSelectedValuesCount(optionIndex: number): number {
    return this.getNewSelectedValues(optionIndex).length
  }

  /**
   * Get available values for selection (excluding already selected)
   */
  getAvailableValuesForOption(optionIndex: number): OptionValueDTO[] {
    const optionId = this.options.at(optionIndex).get("id")?.value
    const allOptionValues = this.getOptionValues(optionId)
    const selectedValues = this.options.at(optionIndex).get("values")?.value || []

    return allOptionValues.filter((val) => !selectedValues.includes(val.value))
  }

  /**
   * Check if a value is an existing value (cannot be removed)
   */
  isExistingValue(optionIndex: number, value: string): boolean {
    const existingValues = this.getExistingValuesForOption(optionIndex)
    return existingValues.includes(value)
  }

  /**
   * Enhanced submit method with baseSku logic
   */
  async onSubmit(): Promise<void> {
    if (!this.productForm.valid) {
      this.markFormGroupTouched()
      return
    }

    if (this.hasUnassignedCombinations()) {
      this.errorMessage = "Please complete manual assignments for new options before saving."
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
        displayOrder: img.displayOrder,
        mainImageStatus: img.isMain,
        altText: img.altText,
      }))

      // Combine existing and new variants
      const allVariants: ProductVariantDTO[] = []

      // Add existing variants (updated with form values) - keep original SKU
      this.existingVariants.forEach((variant, index) => {
        const formVariant = formValue.variants[index]
        const assignedImage = this.getAssignedImage(index)

        allVariants.push({
          ...variant,
          price: formVariant?.price || variant.price,
          stock: formVariant?.stock || variant.stock,
          imgPath: assignedImage?.uploadedUrl || variant.imgPath,
          sku: variant.sku,
        })
      })

      // Add new variants - use brand's baseSku
      this.newVariants.forEach((variant, index) => {
        const formIndex = this.existingVariants.length + index
        const formVariant = formValue.variants[formIndex]
        const assignedImage = this.getAssignedImage(formIndex)

        allVariants.push({
          ...variant,
          price: formVariant?.price || 0,
          stock: formVariant?.stock || 0,
          sku: this.baseSku,
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

      console.log("update request dto : ", requestDto)

      this.productService.updateProduct(requestDto).subscribe({
        next: (res) => {
          this.cleanupPreviewUrls()
          this.router.navigate([`/admin/product/${this.productId}`])
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
    this.selectedBrand = null
    this.baseSku = "SKU"
    this.imagePool = []
    this.imageIdCounter = 0
    this.selectedVariants.clear()
    this.selectedImageForBulkAssignment = ""
    this.bulkAssignmentMode = false
    this.originalOptionValues.clear()
    this.existingOptionIds.clear()
    this.variantNewOptionAssignments = {}

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
  private initializeDefaultVariant(): void {
    const defaultVariant = this.variantGeneratorService.generateDefaultVariant()
    this.newVariants = [defaultVariant]
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)
    const variantGroup = this.productFormService.createVariantGroupWithImageAssignment()
    variantGroup.patchValue({
      price: 0,
      stock: 0,
      assignedImageId: "",
      isRemovable: false,
      sku: this.baseSku,
    })
    variantsArray.push(variantGroup)
    this.hasOptionsSelected = false
  }

  onDisplayPriceInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value
    this.displayPrice = input

    const numericValue = Number(input.replace(/,/g, ""))
    if (!isNaN(numericValue)) {
      this.productForm.get("basePrice")?.setValue(numericValue, { emitEvent: false })
    }

    // FIXED: Only apply to new variants, not existing ones
    this.autoApplyBasePriceToNewVariants()
  }

  // FIXED: New method that only applies base price to new variants
  autoApplyBasePriceToNewVariants(): void {
    const existingVariantCount = this.existingVariants.length
    this.productFormService.applyBulkPriceToNewVariants(this.productForm, existingVariantCount)

    console.log("Auto-applied base price only to new variants (preserving existing variant prices)")
  }

  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl
  }

  // Dialog control methods
  openAddOptionDialog(): void {
    this.editingOption = null
    this.optionDialogVisible = true
  }

  onOptionTypeSaved(newType: OptionTypeDTO): void {
    this.optionService.createOptionType(newType).subscribe({
      next: () => {
        this.fetchOptionTypes()
        setTimeout(() => {
          const created = this.optionTypes.find((opt) => opt.name === newType.name)
          if (created) {
            // Find the last new option and set its type
            const newOptions = this.getNewOptions()
            if (newOptions.length > 0) {
              const lastNewOption = newOptions[newOptions.length - 1]
              lastNewOption.patchValue({ id: created.id, name: created.name, values: [] })
            }
          }
        }, 300)
      },
      error: () => {
        this.alertService.toast("Failed to save new option type.", "error")
      },
    })
  }

  openAddOptionValueDialog(optionTypeId: number): void {
    const optionType = this.optionTypes.find((opt) => Number(opt.id) == optionTypeId)
    if (!optionType) {
      console.warn(`OptionType with id ${optionTypeId} not found`)
      return
    }
    this.selectedOptionTypeForDialog = optionType
    this.editingOptionValue = null
    this.optionValueDialogVisible = true
  }

  onOptionValueSaved(newValue: OptionValueDTO): void {
    const typeId = newValue.optionId
    this.optionValueService.createOptionValue(newValue).subscribe({
      next: () => {
        this.optionValueService.getValuesByOptionId(typeId).subscribe((values) => {
          const optionType = this.optionTypes.find((opt) => +opt.id === typeId)
          if (optionType) {
            optionType.optionValues = values
          }
          const newVal = values.find((v) => v.value === newValue.value)
          const index = this.options.controls.findIndex((ctrl) => +ctrl.get("id")?.value === typeId)
          if (index !== -1 && newVal) {
            this.toggleOptionValue(index, newVal.value)
          }
        })
      },
      error: () => {
        this.alertService.toast("Failed to save new option value.", "error")
      },
    })
  }

  /**
   * FIXED: Simplified option change detection to prevent infinite loops
   */
  private checkOptionsAndGenerateVariants(): void {
    const hasValidOptions = this.hasValidOptionsSelected()
    if (hasValidOptions !== this.hasOptionsSelected) {
      this.hasOptionsSelected = hasValidOptions
    }
    this.generateProductVariants()
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

  get sortedImagePool(): ImagePoolItem[] {
    return [...this.imagePool].sort((a, b) => {
      // Main image comes first
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      // Then sort by display order
      return (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
    });
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

  applyBulkStock(): void {
    const variantsArray = this.productFormService.getVariantsArray(this.productForm)

    for (let i = 0; i < variantsArray.length; i++) {
      const stockControl = variantsArray.at(i).get("stock")
      if (stockControl) {
        stockControl.setValue(this.bulkStockValue)
      }
    }
  }

  applyBulkImageAssignment(): void {
    if (!this.selectedImageForBulkAssignment || this.selectedVariants.size === 0) {
      return
    }

    this.selectedVariants.forEach((variantIndex) => {
      if (this.selectedImageForBulkAssignment === "clear") {
        this.assignImageToVariant(variantIndex, "")
      } else {
        this.assignImageToVariant(variantIndex, this.selectedImageForBulkAssignment)
      }
    })

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
        // FIXED: Build cache after fetching option types
        this.buildOptionTypeNamesCache()
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

  get options(): FormArray {
    return this.productForm.get("options") as FormArray
  }

  get variants(): FormArray {
    return this.productForm.get("variants") as FormArray
  }

  getOptionValues(optionTypeId: string | number | null | undefined): OptionValueDTO[] {
    if (!optionTypeId) {
      return []
    }

    const option = this.optionTypes.find((opt) => opt.id === optionTypeId)
    if (!option) {
      return []
    }

    return option.optionValues?.filter((ov) => !ov.deleted) || []
  }

  // FIXED: Simplified toggleOptionValue method based on product-create component
  toggleOptionValue(optionIndex: number, value: string): void {
    const valuesControl = this.options.at(optionIndex).get("values")
    const currentValues = valuesControl?.value || []

    if (currentValues.includes(value)) {
      // Only allow removal if it's not an existing value
      if (!this.isExistingValue(optionIndex, value)) {
        const newValues = currentValues.filter((v: string) => v !== value)
        valuesControl?.setValue(newValues)
      }
    } else {
      valuesControl?.setValue([...currentValues, value])
    }
  }

  // FIXED: Simplified removeOptionValue method
  removeOptionValue(optionIndex: number, valueToRemove: string): void {
    // Only allow removal if it's not an existing value
    if (!this.isExistingValue(optionIndex, valueToRemove)) {
      const valuesControl = this.options.at(optionIndex).get("values")
      const currentValues = valuesControl?.value || []
      const newValues = currentValues.filter((v: string) => v !== valueToRemove)
      valuesControl?.setValue(newValues)
    }
  }

  isValueSelected(optionIndex: number, value: string): boolean {
    const values = this.options.at(optionIndex).get("values")?.value || []
    return values.includes(value)
  }

  getSelectedValuesCount(optionIndex: number): number {
    const values = this.options.at(optionIndex).get("values")?.value || []
    return values.length
  }

  // FIXED: Cached getOptionTypeName to prevent infinite loops
  getOptionTypeName(optionTypeId: string): string {
    if (!optionTypeId) return ""

    // Use cached value if available
    const cachedName = this.optionTypeNamesCache.get(optionTypeId)
    if (cachedName) {
      return cachedName
    }

    // Fallback to direct lookup (shouldn't happen if cache is built properly)
    const option = this.optionTypes.find((opt) => opt.id.toString() === optionTypeId.toString())
    const name = option ? option.name : optionTypeId

    // Cache the result
    this.optionTypeNamesCache.set(optionTypeId, name)
    return name
  }

  getSkuForVariant(i: number): string {
    if (this.isExistingVariant(i)) {
      return this.existingVariants[i].sku || "EXISTING-SKU"
    } else {
      return this.baseSku + "-XXXXX"
    }
  }

  getVariantStatus(variantIndex: number): string {
    return this.isExistingVariant(variantIndex) ? "existing" : "new"
  }

  getVariantStatusBadgeClass(variantIndex: number): string {
    return this.isExistingVariant(variantIndex) ? "bg-info" : "bg-success"
  }

  getVariantStatusText(variantIndex: number): string {
    return this.isExistingVariant(variantIndex) ? "Existing" : "New"
  }

  markFormGroupTouched(): void {
    this.formValidation.markFormGroupTouched(this.productForm)
  }

  hasError(fieldName: string): boolean {
    return this.formValidation.hasError(this.productForm, fieldName)
  }

  getErrorMessage(fieldName: string): string {
    return this.formValidation.getErrorMessage(this.productForm, fieldName)
  }

  backToDetail(): void {
    if (this.productId) {
      this.router.navigate([`/admin/product/${this.productId}`])
    }
  }
}
