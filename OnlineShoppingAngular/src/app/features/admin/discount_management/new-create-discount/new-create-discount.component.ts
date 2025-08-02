import { Component, ViewChild, ElementRef } from "@angular/core"
import { OnInit } from "@angular/core"
import { FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms"
import { Router } from "@angular/router"
import {
  Operator,
  DiscountConditionEA_D,
  DiscountConditionGroupEA_C,
  DiscountEA_A,
  DiscountType,
  MechanismType,
  typeCA,
  DiscountMechanismEA_B,
  GroupEA_G,
  ConditionType,
} from "@app/core/models/discount"
import { ProductDTO } from "@app/core/models/product.model"
import { CloudinaryService } from "@app/core/services/cloudinary.service"
import { DiscountService } from "@app/core/services/discount.service"
import { distinctUntilChanged } from "rxjs"


export interface Category {
  id: number
  name: string
}

export interface Brand {
  id: number
  name: string
}

@Component({
  selector: "app-new-create-discount",
  standalone: false,
  templateUrl: "./new-create-discount.component.html",
  styleUrl: "./new-create-discount.component.css",
})
export class NewCreateDiscountComponent implements OnInit {
  discountForm: FormGroup
  discountTypes = Object.values(typeCA)
  mechanismTypes = Object.values(MechanismType)
  discountTypeValues = Object.values(DiscountType)
  isSubmitting = false
  errors: { [key: string]: string } = {}

  // Image handling properties
  imagePreviewUrl: string | null = null
  selectedFileName: string | null = null
  selectedFile: File | null = null
  isUploadingImage = false
  uploadProgress = 0
  cloudinaryImageUrl: string | null = null

  // Product selection properties
  showProductSelection = false
  productSelectionContext: "discount_product" | "free_gift" | "condition_builder" = "discount_product"
  productSelectionMode: "single" | "multiple" = "multiple"
  currentMechanismIndex = -1

  // Selected products storage
  discountProducts: { [mechanismIndex: number]: number[] } = {}
  allProducts: ProductDTO[] = []

  // Customer Eligibility Modal
  showCustomerEligibilityModal = false
  currentCustomerEligibility: "all" | "specific" = "all"
  currentCustomerEligibilityMechanismIndex = -1
  customerGroups: GroupEA_G[] = []
  filteredCustomerGroups: GroupEA_G[] = []
  selectedCustomerGroups: GroupEA_G[] = []
  customerGroupSearchText = ""
  customerEligibilitySettings: { [mechanismIndex: number]: { type: "all" | "specific"; groups: GroupEA_G[] } } = {}

  // Product Rule Modal
  showProductRuleModal = false
  currentProductRuleType: "product" | "brand" | "category" = "product"
  currentProductRuleMechanismIndex = -1
  productRuleSearchText = ""
  filteredProductRuleItems: any[] = []
  selectedProductRuleItems: any[] = []
  allCategories: Category[] = []
  allBrands: Brand[] = []
  productRuleSettings: { [mechanismIndex: number]: { type: string; items: any[] } } = {}
  orderRuleSettings: { [mechanismIndex: number]: { type: string; value: string } } = {}

  // Conditions visibility toggle
  showConditionsForMechanism: { [mechanismIndex: number]: boolean } = {}

  constructor(
    private fb: FormBuilder,
    private discountService: DiscountService,
    private router: Router,
    private cloudinaryService: CloudinaryService,
  ) {
    this.discountForm = this.createForm()
  }

  ngOnInit(): void {
    this.setupFormSubscriptions()
    this.loadInitialData()
  }

  private loadInitialData(): void {
    // Load customer groups
    this.discountService.getAllGroups().subscribe((groups) => {
      this.customerGroups = groups
      this.filteredCustomerGroups = [...groups]
    })

    // Load categories
    this.discountService.getAllCategories().subscribe((categories) => {
      this.allCategories = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
      }))
    })

    // Load brands
    this.discountService.getAllBrands().subscribe((brands) => {
      this.allBrands = brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
      }))
    })

    // Load products
    this.discountService.getAllProducts().subscribe((products) => {
      this.allProducts = products
    })
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ["", [Validators.required, Validators.minLength(3)]],
      type: [typeCA.AUTO, Validators.required],
      description: ["", [Validators.minLength(10)]],
      code: [""],
      imgUrl: [""],
      startDate: ["", Validators.required],
      endDate: ["", Validators.required],
      isActive: [true],
      usageLimit: [1, [Validators.min(1)]],
      perUserLimit: [1, [Validators.min(1)]],
      discountMechanisms: this.fb.array([]),
    })
  }

  private setupFormSubscriptions(): void {
    this.discountForm.get("type")?.valueChanges.subscribe((type) => {
      this.onDiscountTypeChange(type)
    })

    this.discountForm.get("endDate")?.valueChanges.subscribe(() => {
      this.validateDateRange()
    })

    this.discountForm.get("startDate")?.valueChanges.subscribe(() => {
      this.validateDateRange()
    })
  }

  private onDiscountTypeChange(type: typeCA): void {
    const codeControl = this.discountForm.get("code")
    const redemptionControl = this.discountForm.get("currentRedemptionCount")

    if (type === typeCA.COUPON) {
      codeControl?.setValidators([Validators.required, Validators.minLength(3)])
      redemptionControl?.setValidators([Validators.required, Validators.min(0)])
      this.generateCouponCode()
    } else {
      codeControl?.clearValidators()
      redemptionControl?.clearValidators()
      codeControl?.setValue("")
      redemptionControl?.setValue("")
    }

    codeControl?.updateValueAndValidity()
    redemptionControl?.updateValueAndValidity()
  }

  private validateDateRange(): void {
    const startDate = this.discountForm.get("startDate")?.value
    const endDate = this.discountForm.get("endDate")?.value

    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        this.discountForm.get("endDate")?.setErrors({ invalidRange: true })
      } else {
        const endDateControl = this.discountForm.get("endDate")
        if (endDateControl?.errors?.["invalidRange"]) {
          delete endDateControl.errors["invalidRange"]
          if (Object.keys(endDateControl.errors).length === 0) {
            endDateControl.setErrors(null)
          }
        }
      }
    }
  }

  onDiscountNameChange(event: any): void {
    if (this.isCouponType) {
      this.generateCouponCode()
    }
  }

  generateCouponCode(): void {
    const name = this.discountForm.get("name")?.value || "DISCOUNT"
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `${name.replace(/\s+/g, "").toUpperCase().substring(0, 8)}_${randomSuffix}`
    this.discountForm.get("code")?.setValue(code)
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {
      const validation = this.cloudinaryService.validateImageFile(file)
      if (!validation.valid) {
        this.errors["image"] = validation.error || "Invalid file"
        return
      }

      delete this.errors["image"]
      this.selectedFile = file
      this.selectedFileName = file.name

      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string
      }
      reader.readAsDataURL(file)

      this.discountForm.get("imgUrl")?.setValue("")
      this.uploadImageToCloudinary(file)
    }
  }

  private uploadImageToCloudinary(file: File): void {
    this.isUploadingImage = true
    this.uploadProgress = 0

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10
      }
    }, 200)

    this.cloudinaryService.uploadImage(file).subscribe({
      next: (imageUrl: string) => {
        clearInterval(progressInterval)
        this.uploadProgress = 100
        this.isUploadingImage = false
        this.cloudinaryImageUrl = imageUrl
        this.discountForm.get("imgUrl")?.setValue(imageUrl)
      },
      error: (error) => {
        clearInterval(progressInterval)
        this.isUploadingImage = false
        this.uploadProgress = 0
        this.errors["image"] = "Failed to upload image. Please try again."
        this.discountForm.get("imgUrl")?.setValue("")
      },
    })
  }

  removeImage(): void {
    this.clearImageData()
  }

  private clearImageData(): void {
    this.imagePreviewUrl = null
    this.selectedFile = null
    this.selectedFileName = null
    this.cloudinaryImageUrl = null
    this.isUploadingImage = false
    this.uploadProgress = 0
    this.discountForm.get("imgUrl")?.setValue("")
    delete this.errors["image"]
  }

  get discountMechanisms(): FormArray {
    return this.discountForm.get("discountMechanisms") as FormArray
  }

  get isCouponType(): boolean {
    return this.discountForm.get("type")?.value === typeCA.COUPON
  }

  get isFormValid(): boolean {
    return this.discountForm.valid && this.discountMechanisms.length > 0
  }

  addOfferType(): void {
    const mechanismGroup = this.fb.group({
      mechanismType: [MechanismType.DISCOUNT, Validators.required],
      quantity: [1],
      discountType: [DiscountType.PERCENTAGE, Validators.required],
      value: [null, [Validators.required, Validators.min(0)]],
      maxDiscountAmount: [""],
      serviceDiscount: [""],
      discountConditionGroup: [],
      couponcode: [""],
      usageLimitPerUser: [null],
      usageLimitTotal: [null],
      logicOperator: [true], // Default to "Match all" (true)
    })

    const newIndex = this.discountMechanisms.length
    this.customerEligibilitySettings[newIndex] = { type: "all", groups: [] }
    this.productRuleSettings[newIndex] = { type: "", items: [] }
    this.orderRuleSettings[newIndex] = { type: "", value: "" }
    this.showConditionsForMechanism[newIndex] = false // Default to hidden

    mechanismGroup.get("mechanismType")?.valueChanges.subscribe((type) => {
      this.onMechanismTypeChange(mechanismGroup, type)
      if (type === MechanismType.DISCOUNT) {
        const discountTypeControl = mechanismGroup.get("discountType")
        if (!discountTypeControl?.value || discountTypeControl.value !== DiscountType.PERCENTAGE) {
          discountTypeControl!.setValue(DiscountType.PERCENTAGE, { emitEvent: false })
        }
        discountTypeControl?.setValidators([Validators.required])
        discountTypeControl?.updateValueAndValidity()
      }
      if (type === MechanismType.FREE_GIFT) {
        const discountTypeControl = mechanismGroup.get("discountType")
        discountTypeControl?.setValue(null)
        discountTypeControl?.clearValidators()
        discountTypeControl?.updateValueAndValidity()
      }
    })

    mechanismGroup
      .get("discountType")
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((discountType) => {
        this.onDiscountTypeValueChange(mechanismGroup, discountType)
      })

    this.discountMechanisms.push(mechanismGroup)
  }

  removeOfferType(index: number): void {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    this.discountMechanisms.removeAt(index)

    // Remove products for this mechanism index
    if (mechanismType === MechanismType.DISCOUNT) {
      this.clearDiscountProducts(index)
    }

    // Remove settings
    delete this.customerEligibilitySettings[index]
    delete this.productRuleSettings[index]
    delete this.orderRuleSettings[index]
    delete this.showConditionsForMechanism[index]

    // Reindex settings
    this.reindexSettings(index)
  }

  private reindexSettings(removedIndex: number): void {
    const reindexObject = (obj: any) => {
      const updated: any = {}
      Object.keys(obj).forEach((key) => {
        const keyIndex = Number.parseInt(key)
        if (keyIndex > removedIndex) {
          updated[keyIndex - 1] = obj[keyIndex]
        } else if (keyIndex < removedIndex) {
          updated[keyIndex] = obj[keyIndex]
        }
      })
      return updated
    }

    this.customerEligibilitySettings = reindexObject(this.customerEligibilitySettings)
    this.productRuleSettings = reindexObject(this.productRuleSettings)
    this.orderRuleSettings = reindexObject(this.orderRuleSettings)
    this.showConditionsForMechanism = reindexObject(this.showConditionsForMechanism)
  }

  private onMechanismTypeChange(mechanismGroup: FormGroup, type: MechanismType | null): void {
    if (!type) return

    const valueControl = mechanismGroup.get("value")
    const discountTypeControl = mechanismGroup.get("discountType")
    const maxDiscountControl = mechanismGroup.get("maxDiscountAmount")
    const quantityControl = mechanismGroup.get("quantity")
    const couponCodeControl = mechanismGroup.get("couponcode")

    switch (type) {
      case MechanismType.DISCOUNT:
        valueControl?.setValidators([Validators.required, Validators.min(0)])
        discountTypeControl?.setValidators([Validators.required])
        quantityControl?.clearValidators()
        couponCodeControl?.clearValidators()
        break
      case MechanismType.FREE_GIFT:
        valueControl?.clearValidators()
        discountTypeControl?.clearValidators()
        maxDiscountControl?.clearValidators()
        couponCodeControl?.clearValidators()
        quantityControl?.setValidators([Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)])
        valueControl?.setValue("")
        discountTypeControl?.setValue(null)
        maxDiscountControl?.setValue("")
        couponCodeControl?.setValue("")
        break
      case MechanismType.B2B:
        valueControl?.setValidators([Validators.required, Validators.min(0)])
        discountTypeControl?.setValidators([Validators.required])
        quantityControl?.clearValidators()
        couponCodeControl?.clearValidators()
        break
      case MechanismType.Coupon:
        valueControl?.setValidators([Validators.required, Validators.min(0)])
        discountTypeControl?.setValidators([Validators.required])
        quantityControl?.clearValidators()
        couponCodeControl?.setValidators([Validators.required, Validators.minLength(3)])
        break
    }

    valueControl?.updateValueAndValidity()
    discountTypeControl?.updateValueAndValidity()
    maxDiscountControl?.updateValueAndValidity()
    quantityControl?.updateValueAndValidity()
    couponCodeControl?.updateValueAndValidity()
  }

  private onDiscountTypeValueChange(mechanismGroup: FormGroup, discountType: DiscountType | null): void {
    if (!discountType) return

    const valueControl = mechanismGroup.get("value")

    if (discountType === DiscountType.PERCENTAGE) {
      valueControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)])
      // Clear any existing value if it exceeds 100
      if (valueControl?.value && valueControl.value > 100) {
        valueControl.setValue(null)
      }
    } else if (discountType === DiscountType.FIXED) {
      valueControl?.setValidators([Validators.required, Validators.min(0)])
    }
    valueControl?.updateValueAndValidity()
  }

  getMechanismGroup(index: number): FormGroup {
    return this.discountMechanisms.at(index) as FormGroup
  }

  isDiscountMechanism(index: number): boolean {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    return mechanismType === MechanismType.DISCOUNT
  }

  isFreeGiftMechanism(index: number): boolean {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    return mechanismType === MechanismType.FREE_GIFT
  }

  isB2BMechanism(index: number): boolean {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    return mechanismType === MechanismType.B2B
  }

  isCouponMechanism(index: number): boolean {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    return mechanismType === MechanismType.Coupon || mechanismType === "Coupon"
  }

  showMaxDiscountAmount(index: number): boolean {
    const mechanismGroup = this.getMechanismGroup(index)
    const mechanismType = mechanismGroup.get("mechanismType")?.value
    const discountType = mechanismGroup.get("discountType")?.value
    return (
      (mechanismType === MechanismType.DISCOUNT ||
        mechanismType === MechanismType.B2B ||
        mechanismType === MechanismType.Coupon ||
        mechanismType === "Coupon") &&
      discountType === DiscountType.PERCENTAGE
    )
  }

  getDiscountTypeValue(key: string): DiscountType {
    return DiscountType[key as keyof typeof DiscountType]
  }

  getMechanismTypeValue(key: string): MechanismType {
    return MechanismType[key as keyof typeof MechanismType]
  }

  generateCouponCodeForMechanism(index: number): void {
    const mechanismGroup = this.getMechanismGroup(index)
    const name = this.discountForm.get("name")?.value || "COUPON"
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `${name.replace(/\s+/g, "").toUpperCase().substring(0, 8)}_${randomSuffix}`
    mechanismGroup.get("couponcode")?.setValue(code)
  }

  getOfferTypeLabel(index: number): string {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    switch (mechanismType) {
      case MechanismType.DISCOUNT:
        return "Auto Discount"
      case MechanismType.Coupon:
        return "Coupon"
      case MechanismType.FREE_GIFT:
        return "Free Gift"
      case MechanismType.B2B:
        return "B2B"
      default:
        return "Unknown"
    }
  }

  // Customer Eligibility Modal Methods
  openCustomerEligibilityModal(mechanismIndex: number): void {
    this.currentCustomerEligibilityMechanismIndex = mechanismIndex
    const settings = this.customerEligibilitySettings[mechanismIndex] || { type: "all", groups: [] }
    this.currentCustomerEligibility = settings.type
    this.selectedCustomerGroups = [...settings.groups]
    this.showCustomerEligibilityModal = true
    this.customerGroupSearchText = ""
    this.filteredCustomerGroups = [...this.customerGroups]
  }

  closeCustomerEligibilityModal(): void {
    this.showCustomerEligibilityModal = false
    this.currentCustomerEligibilityMechanismIndex = -1
    this.selectedCustomerGroups = []
    this.currentCustomerEligibility = "all"
  }

  filterCustomerGroups(): void {
    const searchTerm = this.customerGroupSearchText.toLowerCase()
    this.filteredCustomerGroups = this.customerGroups.filter((group) => group.name.toLowerCase().includes(searchTerm))
  }

  isCustomerGroupSelected(group: GroupEA_G): boolean {
    return this.selectedCustomerGroups.some((g) => g.id === group.id)
  }

  toggleCustomerGroup(group: GroupEA_G): void {
    const index = this.selectedCustomerGroups.findIndex((g) => g.id === group.id)
    if (index > -1) {
      this.selectedCustomerGroups.splice(index, 1)
    } else {
      this.selectedCustomerGroups.push(group)
    }
  }

  confirmCustomerEligibilitySelection(): void {
    if (this.currentCustomerEligibilityMechanismIndex >= 0) {
      this.customerEligibilitySettings[this.currentCustomerEligibilityMechanismIndex] = {
        type: this.currentCustomerEligibility,
        groups: [...this.selectedCustomerGroups],
      }
    }
    this.closeCustomerEligibilityModal()
  }

  getSelectedCustomerGroups(index: number): GroupEA_G[] {
    return this.customerEligibilitySettings[index]?.groups || []
  }

  // Remove a single group from selected list
  removeSingleGroup(mechanismIndex: number, groupId: number): void {
    const settings = this.customerEligibilitySettings[mechanismIndex];
    if (settings && settings.groups) {
      settings.groups = settings.groups.filter(g => g.id !== groupId);
    }
  }

  // Product Rule Modal Methods
  openProductRuleModal(mechanismIndex: number): void {
    this.currentProductRuleMechanismIndex = mechanismIndex;
    const settings = this.productRuleSettings[mechanismIndex] || { type: '', items: [] };
    this.currentProductRuleType = settings.type as 'product' | 'brand' | 'category';
    this.selectedProductRuleItems = [...settings.items];
    this.productRuleSearchText = '';
    this.loadProductRuleItems();

    // Always close both popups first
    this.showProductSelection = false;
    this.showProductRuleModal = false;

    if (this.currentProductRuleType === 'product') {
      // Product selection logic (old flow)
      this.productSelectionContext = 'condition_builder';
      this.currentMechanismIndex = mechanismIndex;
      this.productSelectionMode = 'multiple';
      this.showProductSelection = true;
    } else {
      // Brand/Category selection logic (shared modal)
    
      this.showProductRuleModal = true;
     
    }
  }

  
  closeProductRuleModal(): void {
    this.showProductRuleModal = false
    this.currentProductRuleMechanismIndex = -1
    this.selectedProductRuleItems = []
  }

  // Add this method for new-product-selection popup integration
  onProductRuleProductsSelected(products: ProductDTO[]): void {
    this.selectedProductRuleItems = products;
    this.confirmProductRuleSelection();
    this.showProductSelection = false;  
  }

  loadProductRuleItems(): void {
    switch (this.currentProductRuleType) {
      case "product":
        this.filteredProductRuleItems = [...this.allProducts]
        break
      case "brand":
        this.filteredProductRuleItems = [...this.allBrands]
        break
      case "category":
        this.filteredProductRuleItems = [...this.allCategories]
        break
    }
  }

  filterProductRuleItems(): void {
    const searchTerm = this.productRuleSearchText.toLowerCase()
    this.loadProductRuleItems()
    this.filteredProductRuleItems = this.filteredProductRuleItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    )
  }

  isProductRuleItemSelected(item: any): boolean {
    return this.selectedProductRuleItems.some((i) => i.id === item.id)
  }

  toggleProductRuleItem(item: any): void {
    const index = this.selectedProductRuleItems.findIndex((i) => i.id === item.id)
    if (index > -1) {
      this.selectedProductRuleItems.splice(index, 1)
    } else {
      this.selectedProductRuleItems.push(item)
    }
  }

  confirmProductRuleSelection(): void {
    if (this.currentProductRuleMechanismIndex >= 0) {
      this.productRuleSettings[this.currentProductRuleMechanismIndex] = {
        type: this.currentProductRuleType,
        items: [...this.selectedProductRuleItems],
      }
    }
    this.closeProductRuleModal()
  }

  getProductRuleType(index: number): string {
    return this.productRuleSettings[index]?.type || ""
  }

  updateProductRuleType(index: number, event: any): void {
    const type = event.target.value;
    if (!this.productRuleSettings[index]) {
      this.productRuleSettings[index] = { type: '', items: [] };
    }
    this.productRuleSettings[index].type = type;
    this.productRuleSettings[index].items = []; // Clear items when type changes
    // Do NOT auto open modal here for brand/category. Modal will open only on button click.
  }

  getProductRuleValues(index: number): any[] {
    return this.productRuleSettings[index]?.items || []
  }

  getOrderRuleType(index: number): string {
    return this.orderRuleSettings[index]?.type || ""
  }

  updateOrderRuleType(index: number, event: any): void {
    const type = event.target.value
    if (!this.orderRuleSettings[index]) {
      this.orderRuleSettings[index] = { type: "", value: "" }
    }
    this.orderRuleSettings[index].type = type
    this.orderRuleSettings[index].value = "" // Clear value when type changes
  }

  getOrderRuleValue(index: number): string {
    return this.orderRuleSettings[index]?.value || ""
  }

  updateOrderRuleValue(index: number, event: any): void {
    const value = event.target.value
    if (!this.orderRuleSettings[index]) {
      this.orderRuleSettings[index] = { type: "", value: "" }
    }
    this.orderRuleSettings[index].value = value
  }

  // Check if any conditions are set for a mechanism
  hasAnyConditions(index: number): boolean {
    const customerGroups = this.getSelectedCustomerGroups(index).length > 0
    const productRules = this.getProductRuleValues(index).length > 0
    const orderRules = !!this.getOrderRuleValue(index)
    return customerGroups || productRules || orderRules
  }

  // Product Selection Methods
  onAddDiscountProduct(mechanismIndex: number): void {
    console.log("may---------------------------------------------------------------------")
    console.log('🔍 onAddDiscountProduct called with mechanismIndex:', mechanismIndex);
    console.log('🔍 Current discountProducts before:', this.discountProducts);
    
    this.currentMechanismIndex = mechanismIndex;
    this.productSelectionContext = "discount_product";
    this.productSelectionMode = "multiple";
    this.showProductSelection = true;
    
    // Initialize discountProducts for this mechanism if it doesn't exist
    if (!this.discountProducts[mechanismIndex]) {
      this.discountProducts[mechanismIndex] = [];
    }
    
    console.log('🔍 After setting properties:');
    console.log('🔍 - currentMechanismIndex:', this.currentMechanismIndex);
    console.log('🔍 - productSelectionContext:', this.productSelectionContext);
    console.log('🔍 - productSelectionMode:', this.productSelectionMode);
    console.log('🔍 - showProductSelection:', this.showProductSelection);
    console.log('🔍 - discountProducts after init:', this.discountProducts);
  }

  hasDiscountProducts(mechanismIndex: number): boolean {
    return this.discountProducts[mechanismIndex] && this.discountProducts[mechanismIndex].length > 0
  }

  getDiscountProductCount(mechanismIndex: number): number {
    return this.discountProducts[mechanismIndex]?.length || 0
  }

  clearDiscountProducts(mechanismIndex: number): void {
    delete this.discountProducts[mechanismIndex]
  }

  // Get selected product objects for displaying names
  getSelectedProductObjects(mechanismIndex: number): ProductDTO[] {
    const ids = (this.discountProducts[mechanismIndex] || []).filter((id): id is number => typeof id === 'number');
    return this.allProducts.filter(p => typeof p.id === 'number' && ids.includes(p.id));
  }

  // Remove a single product from selected list
  removeSingleProduct(mechanismIndex: number, productId: number | undefined): void {
    if (typeof productId !== 'number') return;
    if (this.discountProducts[mechanismIndex]) {
      this.discountProducts[mechanismIndex] = this.discountProducts[mechanismIndex].filter(id => id !== productId);
      // If no products left, remove the key
      if (this.discountProducts[mechanismIndex].length === 0) {
        delete this.discountProducts[mechanismIndex];
      }
    }
  }

  onProductsSelected(products: ProductDTO[]): void {
    console.log("may2---------------------------------------------------------------------")
    console.log('🔍 onProductsSelected called with products:', products);
    console.log('🔍 - productSelectionContext:', this.productSelectionContext);
    console.log('🔍 - currentMechanismIndex:', this.currentMechanismIndex);
    console.log('🔍 - products.length:', products.length);
    console.log('🔍 - product IDs:', products.map(p => p.id));
    console.log('🔍 - product names:', products.map(p => p.name));
    
    if (this.productSelectionContext === "discount_product" && this.currentMechanismIndex >= 0) {
      console.log('🔍 Condition met - processing discount products');
      console.log('🔍 Current discountProducts before update:', this.discountProducts);
      
      this.discountProducts[this.currentMechanismIndex] = products
        .map((p) => p.id)
        .filter((id): id is number => id !== undefined)
      
      console.log('🔍 Updated discountProducts:', this.discountProducts);
      console.log('🔍 - discountProducts for mechanism', this.currentMechanismIndex, ':', this.discountProducts[this.currentMechanismIndex]);
      
      this.showProductSelection = false
      this.currentMechanismIndex = -1
      
      console.log('🔍 After closing modal:');
      console.log('🔍 - showProductSelection:', this.showProductSelection);
      console.log('🔍 - currentMechanismIndex:', this.currentMechanismIndex);
    } else {
      console.log('🔍 Condition NOT met:');
      console.log('🔍 - productSelectionContext === "discount_product":', this.productSelectionContext === "discount_product");
      console.log('🔍 - currentMechanismIndex >= 0:', this.currentMechanismIndex >= 0);
    }
  }

  getSelectedProductsForCurrentContext(): ProductDTO[] {
    console.log('🔍 getSelectedProductsForCurrentContext called');
    console.log('🔍 - productSelectionContext:', this.productSelectionContext);
    console.log('🔍 - currentMechanismIndex:', this.currentMechanismIndex);
    console.log('🔍 - discountProducts:', this.discountProducts);
    console.log('🔍 - allProducts length:', this.allProducts?.length || 0);
    
    const allProducts = this.allProducts || []
    if (this.productSelectionContext === "discount_product") {
      const productIds = this.discountProducts[this.currentMechanismIndex] || [];
      console.log('🔍 - productIds for mechanism', this.currentMechanismIndex, ':', productIds);
      
      const result = productIds
        .map((id: number) => allProducts.find((p: ProductDTO) => p.id === id))
        .filter((p): p is ProductDTO => !!p);
      
      console.log('🔍 - result:', result.map(p => p.name));
      return result;
    }
    console.log('🔍 - returning empty array (not discount_product context)');
    return []
  }

  onProductSelectionBack(): void {
    this.showProductSelection = false
    this.currentMechanismIndex = -1
  }

  onSubmit(): void {
    if (!this.discountForm.valid) {
      this.markFormGroupTouched(this.discountForm);
      return;
    }
    if (this.isUploadingImage) {
      this.errors["general"] = "Please wait for image upload to complete";
      return;
    }
    this.isSubmitting = true;
    this.errors = {};
  
    const formValue = this.discountForm.value;
  
    const mechanisms: DiscountMechanismEA_B[] = (formValue.discountMechanisms || []).map((mech: any, idx: number) => {
      // Add discount products
      if (this.discountProducts[idx]?.length) {
        mech.discountProducts = this.discountProducts[idx].map(
          (productId: number) =>
            ({
              id: 0,
              productId,
              discountMechanismId: 0,
            }) as any,
        );
      }
  
      // Only create condition groups if conditions are enabled for this mechanism
      if (this.showConditionsForMechanism[idx]) {
        const conditionGroups: DiscountConditionGroupEA_C[] = [];
        const conditions: DiscountConditionEA_D[] = [];
  
        // Customer group conditions
        const customerSettings = this.customerEligibilitySettings[idx];
        if (customerSettings && customerSettings.type === "specific" && customerSettings.groups.length > 0) {
          const customerCondition: DiscountConditionEA_D = {
            id: 0,
            conditionType: ConditionType.CUSTOMER_GROUP,
            conditionDetail: "customer_group",
            operator: Operator.IS_ONE_OF,
            value: customerSettings.groups.map((g) => g.id.toString()),
            delFg: false,
          };
          conditions.push(customerCondition);
        }
  
        // Product rule conditions
        const productSettings = this.productRuleSettings[idx];
        if (productSettings && productSettings.type && productSettings.items.length > 0) {
          const productCondition: DiscountConditionEA_D = {
            id: 0,
            conditionType: ConditionType.PRODUCT,
            conditionDetail: productSettings.type,
            operator: Operator.IS_ONE_OF,
            value: productSettings.items.map((item) => item.id.toString()),
            delFg: false,
          };
          conditions.push(productCondition);
        }
  
        // Order rule conditions
        const orderSettings = this.orderRuleSettings[idx];
        if (orderSettings && orderSettings.type && orderSettings.value) {
          const orderCondition: DiscountConditionEA_D = {
            id: 0,
            conditionType: ConditionType.ORDER,
            conditionDetail: orderSettings.type,
            operator: Operator.GREATER_THAN_OR_EQUAL,
            value: [orderSettings.value],
            delFg: false,
          };
          conditions.push(orderCondition);
        }
  
        // Create condition group if we have conditions
        if (conditions.length > 0) {
          const conditionGroup: DiscountConditionGroupEA_C = {
            id: 0,
            discountMechanismId: 0,
            logicOperator: mech.logicOperator ? "true" : "false",
            discountCondition: conditions,
          };
          conditionGroups.push(conditionGroup);
        }
  
        mech.discountConditionGroup = conditionGroups;
      }
  
      // Ensure value types are correct
      if (typeof mech.value === "number") {
        mech.value = mech.value.toString();
      }
      if (
        mech.maxDiscountAmount !== undefined &&
        mech.maxDiscountAmount !== null &&
        typeof mech.maxDiscountAmount === "number"
      ) {
        mech.maxDiscountAmount = mech.maxDiscountAmount.toString();
      }
  
      if (mech.couponcode !== undefined && mech.couponcode !== null) {
        mech.couponcode = mech.couponcode.toString();
      }
  
      return mech;
    });
  
    const createRequest: DiscountEA_A = {
      ...formValue,
      delFg: false,
      imgUrl: this.cloudinaryImageUrl || formValue.imgUrl || undefined,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      discountMechanisms: mechanisms,
    };
  
    mechanisms.forEach((m) => {
      if (m.mechanismType === MechanismType.FREE_GIFT) {
        m.discountType = undefined;
      } else if (m.mechanismType === MechanismType.DISCOUNT) {
        if (!m.discountType || m.discountType === undefined || m.discountType === "") {
          m.discountType = DiscountType.PERCENTAGE;
        }
      }
  
      if (m.discountConditionGroup) {
        m.discountConditionGroup.forEach((g) => {
          g.discountCondition.forEach((c) => {
            c.conditionType = c.conditionType.toString().toUpperCase();
          });
        });
      }
    });
  
    console.log("Submitting discount with payload:", createRequest);
  
    this.discountService.createDiscount(createRequest).subscribe({
      next: (response: string) => {
        if (response === "success") {
          this.router.navigate(["/admin/discountList"]);
        } else {
          this.errors["general"] = response;
        }
      },
      error: (error) => {
        this.errors["general"] = error.error || "An error occurred while creating the discount.";
        this.isSubmitting = false;
      },
    });
  }

  resetForm(): void {
    this.discountForm.reset({
      name: "",
      type: typeCA.AUTO,
      description: "",
      code: "",
      currentRedemptionCount: "",
      imgUrl: "",
      startDate: "",
      endDate: "",
      isActive: true,
      usageLimit: 1,
      perUserLimit: 1,
      discountMechanisms: [],
    })

    while (this.discountMechanisms.length !== 0) {
      this.discountMechanisms.removeAt(0)
    }

    this.clearImageData()
    this.errors = {}
    this.customerEligibilitySettings = {}
    this.productRuleSettings = {}
    this.orderRuleSettings = {}
    this.showConditionsForMechanism = {}
    this.discountForm.markAsPristine()
    this.discountForm.markAsUntouched()
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      control?.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl)
          }
        })
      }
    })
  }

  getFieldError(fieldName: string): string {
    const control = this.discountForm.get(fieldName)
    if (control && control.errors && control.touched) {
      if (control.errors["required"]) return `${fieldName} is required`
      if (control.errors["minlength"])
        return `${fieldName} must be at least ${control.errors["minlength"].requiredLength} characters`
      if (control.errors["min"]) return `${fieldName} must be greater than ${control.errors["min"].min}`
      if (control.errors["invalidRange"]) return "End date must be after start date"
    }
    return this.errors[fieldName] || ""
  }

  getMechanismFieldError(index: number, fieldName: string): string {
    const control = this.getMechanismGroup(index).get(fieldName)
    if (control && control.errors && control.touched) {
      if (control.errors["required"]) return `${fieldName} is required`
      if (control.errors["min"]) return `${fieldName} must be greater than ${control.errors["min"].min}`
      if (control.errors["max"]) {
        const discountType = this.getMechanismGroup(index).get('discountType')?.value
        if (discountType === this.getDiscountTypeValue('PERCENTAGE')) {
          return "Percentage cannot exceed 100%"
        }
        return `${fieldName} cannot exceed ${control.errors["max"].max}`
      }
    }
    return ""
  }

  isCreateDiscountEnabled(): boolean {
    const name = this.discountForm.get("name")?.value?.trim()
    const type = this.discountForm.get("type")?.value
    const startDate = this.discountForm.get("startDate")?.value
    const endDate = this.discountForm.get("endDate")?.value

    if (!name && !type && !startDate && !endDate && this.discountMechanisms.length === 0) {
      return false
    }
    if (!name || !type || !startDate || !endDate) {
      return false
    }
    for (let i = 0; i < this.discountMechanisms.length; i++) {
      const group = this.getMechanismGroup(i)
      const mechanismType = group.get("mechanismType")?.value
      const value = group.get("value")?.value
      const couponCode = group.get("couponcode")?.value

      if (
        (mechanismType === "DISCOUNT" || mechanismType === "B2B" || mechanismType === "Coupon") &&
        (!value || value === "")
      ) {
        return false
      }

      if (mechanismType === "Coupon" && (!couponCode || couponCode.trim() === "")) {
        return false
      }
    }
    return true
  }

  // Remove a single item (product, brand, or category) from selected product rule list
  removeSingleProductRule(mechanismIndex: number, itemId: number): void {
    const settings = this.productRuleSettings[mechanismIndex];
    if (settings && settings.items) {
      settings.items = settings.items.filter((item: any) => item.id !== itemId);
    }
  }

  // Handle discount value input changes
  onDiscountValueChange(mechanismIndex: number, event: any): void {
    const valueControl = this.getMechanismGroup(mechanismIndex).get('value');
    const discountType = this.getMechanismGroup(mechanismIndex).get('discountType')?.value;
    
    if (valueControl && discountType === this.getDiscountTypeValue('PERCENTAGE')) {
      const value = parseFloat(event.target.value);
      if (value > 100) {
        valueControl.setValue(100);
      }
    }
  }
}
