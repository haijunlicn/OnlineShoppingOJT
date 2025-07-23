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
} from "@app/core/models/discount"
import { ProductDTO } from "@app/core/models/product.model"
import { CloudinaryService } from "@app/core/services/cloudinary.service"
import { DiscountService } from "@app/core/services/discount.service"
import { distinctUntilChanged } from "rxjs"
export interface Rule {
  id: string
  type: string
  field: string
  operator: string
  values: string[]
}

export interface ValidationError {
  ruleId: string
  valueIndex: number
  message: string
}

export interface Group {
  name: string
}

export interface Category {
  id: number
  name: string
}

export interface Brand {
  id: number
  name: string
}

export interface City {
  name: string
  region: string
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  brand: string
  price: number
  stock: number
  status: string
  image: string
  createdDate: string
  // Additional properties for create-discount component compatibility
  description?: string
  basePrice?: number
}


@Component({
  selector: "app-create-discount",
  standalone: false,
  templateUrl: "./create-discount.component.html",
  styleUrl: "./create-discount.component.css",
})
export class CreateDiscountComponent implements OnInit {
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

  // Condition builder properties
  showConditionBuilder = false
  currentMechanismIndex = -1

  // Product selection properties
  showProductSelection = false
  productSelectionContext: "discount_product" | "free_gift" | "condition_builder" = "free_gift"
  productSelectionMode: "single" | "multiple" = "multiple"
  currentRuleId: string | null = null
  currentValueIndex: number | null = null

  // Selected products storage - using the shared Product interface
  discountProducts: { [mechanismIndex: number]: number[] } = {}
  freeGiftProducts: { [mechanismIndex: number]: number[] } = {}

  // Service description properties
  showServiceDescriptionModal = false
  currentServiceDescriptionIndex = -1
  currentServiceDescription = ""
  serviceDescriptions: { [mechanismIndex: number]: string } = {}
  serviceSuggestions: string[] = []
  allSuggestions = [
    "Free Shipping",
    "Free Gift",
    "Free Maintenance",
    "Free Installation",
    "Free Consultation",
    "Free Delivery",
    "Free Setup",
    "Free Support",
  ]

  // State for rules and selectedProductsMap
  rules: Rule[] = []
  selectedProductsMap: { [key: string]: any[] } = {}
  allProducts: ProductDTO[] = []

  @ViewChild("conditionList", { static: false }) conditionListRef!: ElementRef<HTMLDivElement>

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
        console.log("Image uploaded successfully:", imageUrl)
      },
      error: (error) => {
        clearInterval(progressInterval)
        this.isUploadingImage = false
        this.uploadProgress = 0
        this.errors["image"] = "Failed to upload image. Please try again."
        console.error("Image upload failed:", error)
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

  onAddDiscountProduct(mechanismIndex: number): void {
    if (!this.allProducts || this.allProducts.length === 0) {
      this.discountService.getAllProducts().subscribe((products) => {
        this.allProducts = products
        this.productSelectionContext = "discount_product"
        this.currentMechanismIndex = mechanismIndex
        this.productSelectionMode = "multiple"
        this.showProductSelection = true
      })
    } else {
      this.productSelectionContext = "discount_product"
      this.currentMechanismIndex = mechanismIndex
      this.productSelectionMode = "multiple"
      this.showProductSelection = true
    }
  }

  incrementValue(index: number): void {
    const control = this.getMechanismGroup(index).get("value")
    const currentValue = Number.parseFloat(control?.value || "0")
    control?.setValue((currentValue + 1).toString())
  }

  decrementValue(index: number): void {
    const control = this.getMechanismGroup(index).get("value")
    const currentValue = Number.parseFloat(control?.value || "0")
    if (currentValue > 0) {
      control?.setValue((currentValue - 1).toString())
    }
  }

  get discountMechanisms(): FormArray {
    return this.discountForm.get("discountMechanisms") as FormArray
  }

  get isCouponType(): boolean {
    const typeValue = this.discountForm.get("type")?.value
    return this.discountForm.get("type")?.value === typeCA.COUPON
  }

  get isFormValid(): boolean {
    return this.discountForm.valid && this.discountMechanisms.length > 0
  }

  addOfferType(): void {
    const mechanismGroup = this.fb.group({
      mechanismType: [MechanismType.DISCOUNT, Validators.required],
      quantity: [1],
      discountType: [DiscountType.PERCENTAGE, Validators.required], // always default to PERCENTAGE
      value: ["", Validators.required],
      maxDiscountAmount: [""],
      serviceDiscount: [""],
      discountConditionGroup: [],
      couponcode: [""], // Add couponcode field
    })

    mechanismGroup.get("mechanismType")?.valueChanges.subscribe((type) => {
      this.onMechanismTypeChange(mechanismGroup, type)
      // If user switches back to DISCOUNT, set discountType to PERCENTAGE if not set
      if (type === MechanismType.DISCOUNT) {
        const discountTypeControl = mechanismGroup.get("discountType")
        if (!discountTypeControl?.value || discountTypeControl.value !== DiscountType.PERCENTAGE) {
          discountTypeControl!.setValue(DiscountType.PERCENTAGE, { emitEvent: false });
        }

        // if (!discountTypeControl?.value) {
        //   discountTypeControl?.setValue(DiscountType.PERCENTAGE)
        // }
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

    mechanismGroup.get("discountType")?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((discountType) => {
        this.onDiscountTypeValueChange(mechanismGroup, discountType)
      })


    // mechanismGroup.get("discountType")?.valueChanges.subscribe((discountType) => {
    //   this.onDiscountTypeValueChange(mechanismGroup, discountType)
    // })

    this.discountMechanisms.push(mechanismGroup)
  }

  generateCouponCodeForMechanism(index: number): void {
    const mechanismGroup = this.getMechanismGroup(index);
    const name = this.discountForm.get("name")?.value || "COUPON";
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${name.replace(/\s+/g, "").toUpperCase().substring(0, 8)}_${randomSuffix}`;
    mechanismGroup.get("couponcode")?.setValue(code);
  }

  openServiceDescriptionModal(mechanismIndex: number): void {
    this.currentServiceDescriptionIndex = mechanismIndex
    this.currentServiceDescription = this.serviceDescriptions[mechanismIndex] || ""
    this.showServiceDescriptionModal = true
    this.updateServiceSuggestions()
  }

  closeServiceDescriptionModal(): void {
    this.showServiceDescriptionModal = false
    this.currentServiceDescriptionIndex = -1
    this.currentServiceDescription = ""
    this.serviceSuggestions = []
  }

  onServiceDescriptionInput(): void {
    this.updateServiceSuggestions()
  }

  updateServiceSuggestions(): void {
    const input = this.currentServiceDescription.toLowerCase().trim()
    if (input.length > 0) {
      this.serviceSuggestions = this.allSuggestions
        .filter((suggestion) => suggestion.toLowerCase().includes(input))
        .slice(0, 3)
    } else {
      this.serviceSuggestions = []
    }
  }

  applySuggestion(suggestion: string): void {
    this.currentServiceDescription = suggestion
    this.serviceSuggestions = []
  }

  saveServiceDescription(): void {
    if (this.currentServiceDescription.trim() && this.currentServiceDescriptionIndex >= 0) {
      // FormArray ထဲက mechanismGroup ကိုယူပြီး serviceDiscount ကို update လုပ်
      const mechanismGroup = this.discountMechanisms.at(this.currentServiceDescriptionIndex) as FormGroup
      mechanismGroup.get("serviceDiscount")?.setValue(this.currentServiceDescription.trim())
    }
    this.closeServiceDescriptionModal()
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

  hasServiceDescription(mechanismIndex: number): boolean {
    const mechanismGroup = this.discountMechanisms.at(mechanismIndex) as FormGroup
    return !!mechanismGroup.get("serviceDiscount")?.value?.trim()
  }

  getServiceDescription(mechanismIndex: number): string {
    const mechanismGroup = this.discountMechanisms.at(mechanismIndex) as FormGroup
    return mechanismGroup.get("serviceDiscount")?.value || ""
  }

  clearServiceDescription(mechanismIndex: number): void {
    const mechanismGroup = this.discountMechanisms.at(mechanismIndex) as FormGroup
    mechanismGroup.get("serviceDiscount")?.setValue("")
  }

  removeOfferType(index: number): void {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value
    this.discountMechanisms.removeAt(index)

    // Remove service description
    delete this.serviceDescriptions[index]

    // Remove products for this mechanism index
    if (mechanismType === MechanismType.DISCOUNT) {
      this.clearDiscountProducts(index)
    } else if (mechanismType === MechanismType.FREE_GIFT) {
      this.clearFreeGiftProducts(index)
    }

    const updatedDescriptions: { [mechanismIndex: number]: string } = {}
    Object.keys(this.serviceDescriptions).forEach((key) => {
      const keyIndex = Number.parseInt(key)
      if (keyIndex > index) {
        updatedDescriptions[keyIndex - 1] = this.serviceDescriptions[keyIndex]
      } else if (keyIndex < index) {
        updatedDescriptions[keyIndex] = this.serviceDescriptions[keyIndex]
      }
    })
    this.serviceDescriptions = updatedDescriptions
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
        valueControl?.setValidators([Validators.required, Validators.min(0)]);
        discountTypeControl?.setValidators([Validators.required]);
        quantityControl?.clearValidators();
        couponCodeControl?.clearValidators();
        break;
      case MechanismType.FREE_GIFT:
        valueControl?.clearValidators();
        discountTypeControl?.clearValidators();
        maxDiscountControl?.clearValidators();
        couponCodeControl?.clearValidators();
        quantityControl?.setValidators([Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]);
        valueControl?.setValue("");
        discountTypeControl?.setValue(null);
        maxDiscountControl?.setValue("");
        couponCodeControl?.setValue("");
        break;
      case MechanismType.B2B:
        valueControl?.setValidators([Validators.required, Validators.min(0)]);
        discountTypeControl?.setValidators([Validators.required]);
        quantityControl?.clearValidators();
        couponCodeControl?.clearValidators();
        break;
      case MechanismType.Coupon:
        valueControl?.setValidators([Validators.required, Validators.min(0)]);
        discountTypeControl?.setValidators([Validators.required]);
        quantityControl?.clearValidators();
        couponCodeControl?.setValidators([Validators.required, Validators.minLength(3)]);
        break;
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
    const discountTypeControl = mechanismGroup.get("discountType")
    const maxDiscountControl = mechanismGroup.get("maxDiscountAmount")

    if (discountType === DiscountType.PERCENTAGE) {
      valueControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (discountType === DiscountType.FIXED) {
      valueControl?.setValidators([Validators.required, Validators.min(0)]);
    }
    valueControl?.updateValueAndValidity();
    discountTypeControl?.updateValueAndValidity()
    maxDiscountControl?.updateValueAndValidity()
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
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value;
    return mechanismType === MechanismType.B2B;
  }

  isCouponMechanism(index: number): boolean {
    const mechanismType = this.getMechanismGroup(index).get("mechanismType")?.value;
    return mechanismType === MechanismType.Coupon || mechanismType === 'Coupon';
  }

  showMaxDiscountAmount(index: number): boolean {
    const mechanismGroup = this.getMechanismGroup(index)
    const mechanismType = mechanismGroup.get("mechanismType")?.value
    const discountType = mechanismGroup.get("discountType")?.value
    return (
      (mechanismType === MechanismType.DISCOUNT ||
        mechanismType === MechanismType.B2B ||
        mechanismType === MechanismType.Coupon ||
        mechanismType === 'Coupon') &&
      discountType === DiscountType.PERCENTAGE
    )
  }

  getDiscountTypeValue(key: string): DiscountType {
    return DiscountType[key as keyof typeof DiscountType]
  }

  getMechanismTypeValue(key: string): MechanismType {
    return MechanismType[key as keyof typeof MechanismType]
  }

  getDiscountTypeEnum(key: string): DiscountType {
    return DiscountType[key as keyof typeof DiscountType]
  }

  openConditionBuilder(mechanismIndex: number): void {
    this.currentMechanismIndex = mechanismIndex
    this.showConditionBuilder = true

    const mechanismType = this.getMechanismGroup(mechanismIndex).get("mechanismType")?.value
  }

  onConditionBuilderBack(): void {
    this.showConditionBuilder = false
    this.currentMechanismIndex = -1
  }

  addRulesToDiscountConditionD(rules: Rule[]): DiscountConditionEA_D[] {
    const operatorMap: { [key: string]: Operator } = {
      equals: Operator.EQUAL,
      greater_than: Operator.GREATER_THAN,
      less_than: Operator.LESS_THAN,
      greater_equal: Operator.GREATER_THAN_OR_EQUAL,
      less_equal: Operator.LESS_THAN_OR_EQUAL,
      one_of: Operator.IS_ONE_OF,
    }

    const mapped: DiscountConditionEA_D[] = rules.map((rule) => ({
      id: 0,
      conditionType: rule.type.toUpperCase(),
      conditionDetail: rule.field,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      operator: operatorMap[rule.operator],
      value: Array.isArray(rule.values) ? rule.values : [rule.values], // keep as string[]
    }))

    return mapped
  }

  onSaveConditions(conditionData: { logicType: string; rules: Rule[] }): void {
    if (this.currentMechanismIndex >= 0) {
      const mechanismType = this.getMechanismGroup(this.currentMechanismIndex).get("mechanismType")?.value

      const discountConditionD = this.addRulesToDiscountConditionD(conditionData.rules)

      const newConditionGroup: DiscountConditionGroupEA_C = {
        logicOperator: conditionData.logicType,
        discountCondition: discountConditionD,
      }

      // Get current conditions for this specific mechanism
      const mechanismGroup = this.discountMechanisms.at(this.currentMechanismIndex) as FormGroup
      const currentConditions = mechanismGroup.get("discountConditionGroup")?.value || []

      // Add new condition group to this mechanism's conditions
      currentConditions.push(newConditionGroup)

      // Update the mechanism's condition group
      mechanismGroup.get("discountConditionGroup")?.setValue(currentConditions)
      mechanismGroup.get("discountConditionGroup")?.markAsDirty()
      mechanismGroup.get("discountConditionGroup")?.markAsTouched()

      console.log("Conditions for mechanism", this.currentMechanismIndex, ":", currentConditions)
    }

    this.showConditionBuilder = false
    setTimeout(() => {
      this.rules = []
      this.selectedProductsMap = {}
    }, 0)
    this.currentMechanismIndex = -1
  }

  getConditionsForMechanism(mechanismIndex: number): DiscountConditionGroupEA_C[] {
    const mechanismGroup = this.discountMechanisms.at(mechanismIndex) as FormGroup
    const value = mechanismGroup.get("discountConditionGroup")?.value || []

    return value
  }

  removeCondition(mechanismIndex: number, conditionIndex: number): void {
    const mechanismGroup = this.discountMechanisms.at(mechanismIndex) as FormGroup
    const groups = mechanismGroup.get("discountConditionGroup")?.value || []
    if (conditionIndex < groups.length) {
      groups.splice(conditionIndex, 1) // group တစ်ခုလုံးဖျက်တယ်
      mechanismGroup.get("discountConditionGroup")?.setValue(groups)
      mechanismGroup.get("discountConditionGroup")?.markAsDirty()
      mechanismGroup.get("discountConditionGroup")?.markAsTouched()
    }
  }

  getSelectedOfferType(mechanismIndex: number): string {
    return this.getMechanismGroup(mechanismIndex).get("mechanismType")?.value || ""
  }

  onAddFreeGift(mechanismIndex: number): void {
    this.productSelectionContext = "free_gift"
    this.currentMechanismIndex = mechanismIndex
    this.productSelectionMode = "multiple"
    this.showProductSelection = true
  }

  onProductsSelected(products: ProductDTO[]): void {
    console.log("Selected products from product-selection:", products)

    if (this.productSelectionContext === "discount_product" && this.currentMechanismIndex >= 0) {
      this.discountProducts[this.currentMechanismIndex] = products
        .map((p) => p.id)
        .filter((id): id is number => id !== undefined)

      this.showProductSelection = false
      this.currentMechanismIndex = -1
      console.log(this.discountProducts)
    } else if (this.productSelectionContext === "free_gift" && this.currentMechanismIndex >= 0) {
      this.freeGiftProducts[this.currentMechanismIndex] = products
        .map((p) => p.id)
        .filter((id): id is number => id !== undefined)
      this.showProductSelection = false
      this.currentMechanismIndex = -1
      console.log(this.freeGiftProducts)
    }
  }

  getSelectedProductsForCurrentContext(): ProductDTO[] {
    const allProducts = this.allProducts || []
    if (this.productSelectionContext === "discount_product") {
      return (this.discountProducts[this.currentMechanismIndex] || [])
        .map((id: number) => allProducts.find((p: ProductDTO) => p.id === id))
        .filter((p): p is ProductDTO => !!p)
    } else if (this.productSelectionContext === "free_gift") {
      return (this.freeGiftProducts[this.currentMechanismIndex] || [])
        .map((id: number) => allProducts.find((p: ProductDTO) => p.id === id))
        .filter((p): p is ProductDTO => !!p)
    }
    return []
  }

  onOpenProductSelection(event: { ruleId: string; valueIndex: number; selectionMode: "single" | "multiple" }): void {
    this.currentRuleId = event.ruleId
    this.currentValueIndex = event.valueIndex
    this.productSelectionMode = event.selectionMode
    this.productSelectionContext = "condition_builder"
    this.showProductSelection = true
    this.showConditionBuilder = false
  }

  onProductSelectionBack(): void {
    this.showProductSelection = false
    this.currentMechanismIndex = -1
  }

  getSelectedProductsForRule(): Product[] {
    if (this.currentRuleId && this.currentValueIndex !== null) {
      const key = `${this.currentRuleId}_${this.currentValueIndex}`
      return this.selectedProductsMap[key] || []
    }
    return []
  }

  clearFreeGiftProducts(mechanismIndex: number): void {
    delete this.freeGiftProducts[mechanismIndex]
  }

  hasFreeGiftProducts(mechanismIndex: number): boolean {
    return this.freeGiftProducts[mechanismIndex] && this.freeGiftProducts[mechanismIndex].length > 0
  }

  getFreeGiftProductCount(mechanismIndex: number): number {
    return this.freeGiftProducts[mechanismIndex]?.length || 0
  }

  incrementQuantity(index: number): void {
    const control = this.getMechanismGroup(index).get("quantity")
    const currentValue = Number.parseInt(control?.value || "1")
    control?.setValue((currentValue + 1).toString())
  }

  decrementQuantity(index: number): void {
    const control = this.getMechanismGroup(index).get("quantity")
    const currentValue = Number.parseInt(control?.value || "1")
    if (currentValue > 1) {
      control?.setValue((currentValue - 1).toString())
    }
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      this.markFormGroupTouched(this.discountForm)
      return
    }

    if (this.isUploadingImage) {
      this.errors["general"] = "Please wait for image upload to complete"
      return
    }

    this.isSubmitting = true
    this.errors = {}

    const formValue = this.discountForm.value

    // --- Loop over mechanisms and assign products/gifts by index ---
    const mechanisms: DiscountMechanismEA_B[] = (formValue.discountMechanisms || []).map((mech: any, idx: number) => {
      // Assign discountProducts if available for this mechanism index
      if (this.discountProducts[idx]?.length) {
        mech.discountProducts = this.discountProducts[idx].map(
          (productId: number) =>
            ({
              id: 0, // let backend assign
              productId,
              discountMechanismId: 0, // let backend assign
            }) as any,
        )
      }

      // Assign freeGifts if available for this mechanism index
      if (this.freeGiftProducts[idx]?.length) {
        mech.freeGifts = this.freeGiftProducts[idx].map(
          (productId: number) =>
            ({
              id: 0,
              mechanismId: 0,
              productId,
            }) as any,
        )
      }

      // Ensure value and maxDiscountAmount are string, as entered
      if (typeof mech.value === 'number') {
        mech.value = mech.value.toString();
      }
      if (mech.maxDiscountAmount !== undefined && mech.maxDiscountAmount !== null && typeof mech.maxDiscountAmount === 'number') {
        mech.maxDiscountAmount = mech.maxDiscountAmount.toString();
      }

      // Ensure couponcode is included in the mechanism data
      if (mech.couponcode !== undefined && mech.couponcode !== null) {
        mech.couponcode = mech.couponcode.toString();
      }

      return mech
    })

    const createRequest: DiscountEA_A = {
      ...formValue,
      delFg: false,
      imgUrl: this.cloudinaryImageUrl || formValue.imgUrl || undefined,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      discountMechanisms: mechanisms, // assign mapped mechanisms here
    }

    mechanisms.forEach((m) => {
      if (m.mechanismType === MechanismType.DISCOUNT) {
        if (!m.discountType || m.discountType === undefined || m.discountType === "") {
          m.discountType = DiscountType.PERCENTAGE // DISCOUNT: default to PERCENTAGE
        }
      }

      if (m.discountConditionGroup) {
        m.discountConditionGroup.forEach((g) => {
          g.discountCondition.forEach((c) => {
            c.conditionType = c.conditionType.toUpperCase()
          })
        })
      }
    })

    console.log("Submitting discount with payload:", createRequest)

    this.discountService.createDiscount(createRequest).subscribe({
      next: (response: string) => {
        if (response === "success") {
          // Success logic
          this.router.navigate(["/admin/discountList"]);
        } else {
          // Unexpected string (shouldn't happen, but just in case)
          this.errors["general"] = response
        }
      },
      error: (error) => {
        // Error message string ကို error.error မှာရနိုင်တယ်
        this.errors["general"] = error.error || "An error occurred while creating the discount."
        this.isSubmitting = false
      },
    })
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

  private handleSubmissionError(error: any): void {
    if (error.error && error.error.fieldErrors) {
      this.errors = error.error.fieldErrors
    } else {
      this.errors = { general: "An error occurred while creating the discount. Please try again." }
    }
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
    }
    return ""
  }

  getSelectionMode(): "single" | "multiple" {
    if (this.productSelectionContext === "condition_builder") {
      return "single"
    }
    return "multiple"
  }

  onRulesChange(updatedRules: Rule[]): void {
    this.rules = updatedRules
  }

  scrollConditionList(direction: "left" | "right") {
    const el = this.conditionListRef?.nativeElement
    if (!el) return

    const scrollAmount = 120
    if (direction === "left") {
      el.scrollBy({ left: -scrollAmount, behavior: "smooth" })
    } else {
      el.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  // Add this method to check if a condition exists for a mechanism
  hasCondition(i: number): boolean {
    return this.getConditionsForMechanism(i)?.length > 0;
  }

  // Enable Create Discount button only if all required fields are filled
  isCreateDiscountEnabled(): boolean {
    const name = this.discountForm.get('name')?.value?.trim();
    const type = this.discountForm.get('type')?.value;
    const startDate = this.discountForm.get('startDate')?.value;
    const endDate = this.discountForm.get('endDate')?.value;

    // All required fields totally empty
    if (!name && !type && !startDate && !endDate && this.discountMechanisms.length === 0) {
      return false;
    }
    // Any required field empty
    if (!name || !type || !startDate || !endDate) {
      return false;
    }
    // For each mechanism, check required fields based on mechanism type
    for (let i = 0; i < this.discountMechanisms.length; i++) {
      const group = this.getMechanismGroup(i);
      const mechanismType = group.get('mechanismType')?.value;
      const value = group.get('value')?.value;
      const couponCode = group.get('couponcode')?.value;

      // For DISCOUNT, B2B, and Coupon mechanisms, value is required
      if ((mechanismType === 'DISCOUNT' || mechanismType === 'B2B' || mechanismType === 'Coupon') && (!value || value === '')) {
        return false;
      }

      // For Coupon mechanism, coupon code is also required
      if (mechanismType === 'Coupon' && (!couponCode || couponCode.trim() === '')) {
        return false;
      }
    }
    return true;
  }
}
