import { Component, Input, Output, EventEmitter, type OnInit, ViewChildren, QueryList, ElementRef, Renderer2 } from "@angular/core"
import { DiscountService } from "@app/core/services/discount.service"
import {

  ConditionType,
  GroupEA_G
} from "@app/core/models/discount"
import { ProductDTO } from "@app/core/models/product.model"


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



@Component({
  selector: "app-discount-rules",
  standalone: false,
  templateUrl: "./discount-rules.component.html",
  styleUrls: ["./discount-rules.component.css"],
})
export class DiscountRulesComponent implements OnInit {
  @Input() currentMechanismIndex = -1
  @Input() selectedOfferType = ""
  @Input() group: Group | null = null
  @Input() rules: Rule[] = []
  @Input() selectedProductsMap: { [key: string]: any[] } = {}
  @Output() onBack = new EventEmitter<void>()
  @Output() onSaveConditions = new EventEmitter<{ logicType: string; rules: Rule[]; }>()
  @Output() rulesChange = new EventEmitter<Rule[]>()
  @Output() openProductSelection = new EventEmitter<{
    ruleId: string
    valueIndex: number
    selectionMode: "single" | "multiple"
  }>()
  @ViewChildren('numInput') numInputs!: QueryList<ElementRef>;

  logicType = "true"
  validationErrors: ValidationError[] = []

  // Modal states
  showCategoryModal = false
  showBrandModal = false
  showMyanmarMapModal = false
  showProductSelection = false
  currentEditingRule: { ruleId: string; valueIndex: number } | null = null
  productSelectionConfig: {
    selectionMode: "single" | "multiple"
    operator: string
  } = { selectionMode: "single", operator: "equals" }

  // Search functionality
  categorySearchText = ""
  brandSearchText = ""
  citySearchText = ""
  filteredCategories: Category[] = []
  filteredBrands: Brand[] = []
  filteredCities: City[] = []
  selectedCity = ""

  // Sample data
  
 
  constructor(private discountService: DiscountService,private renderer: Renderer2) {}
  categories: Category[] = [];
  brands: Brand[] = [];
  customerGroups : GroupEA_G[]=[];
  myanmarCities: City[] = [
    { name: "Yangon", region: "Yangon Region" },
    { name: "Mandalay", region: "Mandalay Region" },
    { name: "Naypyidaw", region: "Naypyidaw Union Territory" },
    { name: "Bagan", region: "Mandalay Region" },
    { name: "Taunggyi", region: "Shan State" },
    { name: "Mawlamyine", region: "Mon State" },
    { name: "Pathein", region: "Ayeyarwady Region" },
    { name: "Meiktila", region: "Mandalay Region" },
    { name: "Myitkyina", region: "Kachin State" },
    { name: "Sittwe", region: "Rakhine State" },
    { name: "Lashio", region: "Shan State" },
    { name: "Hpa-An", region: "Kayin State" },
    { name: "Loikaw", region: "Kayah State" },
    { name: "Hakha", region: "Chin State" },
    { name: "Dawei", region: "Tanintharyi Region" },
    { name: "Myeik", region: "Tanintharyi Region" },
    { name: "Magway", region: "Magway Region" },
    { name: "Pakokku", region: "Magway Region" },
    { name: "Pyay", region: "Bago Region" },
    { name: "Bago", region: "Bago Region" },
    { name: "Hinthada", region: "Ayeyarwady Region" },
    { name: "Myaungmya", region: "Ayeyarwady Region" },
    { name: "Sagaing", region: "Sagaing Region" },
    { name: "Monywa", region: "Sagaing Region" },
    { name: "Shwebo", region: "Sagaing Region" },
  ]

  logicOptions = [
    { value: "true", label: "All of the following conditions are Match" },// and
    { value: "false", label: "Any of the following conditions are Match" },//or
  ]


 
  get ruleTypes() {
  return this.group
    ? [{ value: "status", label: "Status" }]
    : [
        { value: "product", label: "Product" },
        { value: "order", label: "Order" },
        { value: "customer_group", label: "Customer Group" },
      ];
}

  get fieldOptions(): { [key: string]: { value: string; label: string }[] } {
  return {
    product: [
      { value: "product", label: "Product" },
      { value: "brand", label: "Brand" },
      { value: "category", label: "Category" },
    ],
    order: [
      { value: "order_total", label: "Order total amount" },
      { value: "item_count", label: "Number of items in the cart" },
      { value: "shipping_cost", label: "Shipping cost" },
      { value: "shipping_city", label: "Shipping city" },
      { value: "first_order", label: "Customer's first order" },
    ],
    customer_group: this.customerGroups.map((group: GroupEA_G) => ({
      value: group.id.toString(),
      label: group.name
    })),
    status: [
      { value: "days_since_signup", label: "Days Since Signup" },
      { value: "last_login_date", label: "Last Login Date" },
      { value: "total_spent", label: "Total Spent" },
      { value: "days_since_last_purchase", label: "Days Since Last Purchase" },
      { value: "account_age_days", label: "Account Age Days" },
    ],
  };
}

  operatorOptions = [
    { value: "equals", label: "is equal to" },
    { value: "greater_than", label: "is greater than" },
    { value: "less_than", label: "is less than" },
    { value: "greater_equal", label: "is greater than or equal to" },
    { value: "less_equal", label: "is less than or equal to" },
    { value: "one_of", label: "is one of" },
  ]

  ngOnInit() {
    this.discountService.getAllCategories().subscribe((data) => {
      this.categories = data.map((cat) => ({
        id: cat.id,
        name: cat.name
      }));
      this.filteredCategories = [...this.categories];
    }); 
    this.discountService.getAllBrands().subscribe((data) => {
      this.brands = data.map((brand) => ({
        id: brand.id,
        name: brand.name
      }));
      this.filteredBrands = [...this.brands];
    });
    this.discountService.getAllGroups().subscribe((data) => {
      this.customerGroups = data.map((group) => ({
        id: group.id,
        name: group.name
      }));
      this.filteredBrands = [...this.brands];
    });
  
    // Use input rules if provided
    if (this.rules && this.rules.length > 0) {
      this.rules = [...this.rules]
    }

    // Use input selectedProductsMap if provided
    if (this.selectedProductsMap) {
      console.log("HI " + JSON.stringify(this.selectedProductsMap));

      this.selectedProductsMap = { ...this.selectedProductsMap }
    }
  }

  getFilteredOperators(ruleType: string) {
    const rule = this.rules.find((r) => r.type === ruleType)
    switch (ruleType) {
      case "customer_group":
        return this.operatorOptions.filter((op) => op.value === "equals")
      case "product":
        return this.operatorOptions.filter((op) => op.value === "equals" || op.value === "one_of")
      case "order":
        if (rule && rule.field === "shipping_city" || rule && rule.field==="first_order") {
          return this.operatorOptions.filter((op) => op.value === "equals")
        }
        return this.operatorOptions.filter((op) => op.value !== "one_of")
      case "status":
        return this.operatorOptions.filter((op) => op.value !== "one_of")
      default:
        return this.operatorOptions
    }
  }

  addRule() {
    
    const newRule: Rule = {
      id: `${Date.now()}_${this.currentMechanismIndex}`,
      type: "",
      field: "",
      operator: "", // Changed from "equals" to empty string
      values: [""],
    }
    this.rules.push(newRule)
  }

  updateRule(id: string, updates: Partial<Rule>) {
    const index = this.rules.findIndex((rule) => rule.id === id)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
      this.rulesChange.emit([...this.rules])
    }
  }

  removeRule(id: string) {
    this.rules = this.rules.filter((rule) => rule.id !== id)
    this.validationErrors = this.validationErrors.filter((error) => error.ruleId !== id)

    // Clean up selected products for this rule
    const newSelectedProductsMap = { ...this.selectedProductsMap }
    Object.keys(newSelectedProductsMap).forEach((key) => {
      if (key.startsWith(id + "_")) {
        delete newSelectedProductsMap[key]
      }
    })
    this.selectedProductsMap = newSelectedProductsMap
    this.rulesChange.emit([...this.rules])
  }

  focusInput(index: number) {
    setTimeout(() => {
      const input = this.numInputs.toArray()[index];
      if (input) {
        this.renderer.selectRootElement(input.nativeElement).focus();
      }
    });
  }

  updateValue(ruleId: string, valueIndex: number, value: string) {
    const rule = this.rules.find((r) => r.id === ruleId)
    if (rule) {
      const newValues = [...rule.values]
      newValues[valueIndex] = value
      this.updateRule(ruleId, { values: newValues })
      this.validationErrors = this.validationErrors.filter(
        (error) => !(error.ruleId === ruleId && error.valueIndex === valueIndex),
      )
    }
    this.focusInput(valueIndex);
  }
 
  openProductSelectionModal(ruleId: string, valueIndex: number) {
    const rule = this.rules.find((r) => r.id === ruleId)
    if (!rule) return

    this.currentEditingRule = { ruleId, valueIndex }
    const selectionMode = rule.operator === "one_of" ? "multiple" : "single"
    this.productSelectionConfig = { selectionMode, operator: rule.operator }
    this.showProductSelection = true
  }

  handleProductsSelected(products: ProductDTO[]) {
    if (!this.currentEditingRule) return;
    const { ruleId, valueIndex } = this.currentEditingRule;
    const key = `${ruleId}_${valueIndex}`;
    this.selectedProductsMap[key] = products; // Store product objects for UI
    // Store only product ids in rule.values, filter out undefined ids
    const productIds = products
      .filter((p) => p && p.id !== undefined && p.id !== null)
      .map((p) => p.id!.toString());
    this.updateValue(ruleId, valueIndex, productIds.join(","));
  
    // ** Add this line to see what's in rule.values **
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      console.log('Current rule.values:', rule.values);
    }
  
    this.showProductSelection = false;
    this.currentEditingRule = null;
  }
  getProductNamesByIds(rule: Rule, valueIndex: number): string {
    // rule.values[valueIndex] => "2,3"
    const ids = rule.values[valueIndex]
      ? rule.values[valueIndex].split(',').map(id => id.trim())
      : [];
    const key = `${rule.id}_${valueIndex}`;
    const products = this.selectedProductsMap[key] || [];
    // filter products by id array
    const names = products
      .filter(p => ids.includes(p.id?.toString()))
      .map(p => p.name);
    return names.join(', ');
  }
  getSelectedProducts(ruleId: string, valueIndex: number): any[] {
    const key = `${ruleId}_${valueIndex}`
    return this.selectedProductsMap[key] || []
  }

  hasSelectedProducts(ruleId: string, valueIndex: number): boolean {
    return this.getSelectedProducts(ruleId, valueIndex).length > 0
  }

  removeSelectedProduct(ruleId: string, valueIndex: number, productIndex: number) {
    const key = `${ruleId}_${valueIndex}`
    const currentProducts = this.selectedProductsMap[key] || []
    const updatedProducts = currentProducts.filter((_, index) => index !== productIndex)
    this.selectedProductsMap[key] = updatedProducts

    // Update the rule value
    if (updatedProducts.length > 0) {
      const productNames = updatedProducts.map((p) => p.name).join(", ")
      this.updateValue(ruleId, valueIndex, productNames)
    } else {
      this.updateValue(ruleId, valueIndex, "")
    }
  }

  clearAllSelectedProducts(ruleId: string, valueIndex: number) {
    const key = `${ruleId}_${valueIndex}`
    this.selectedProductsMap[key] = []
    this.updateValue(ruleId, valueIndex, "")
  }

  isRuleComplete(rule: Rule): boolean {
    const hasBasicFields = !!(rule.type && rule.field && rule.operator)
    const hasValidValues = rule.values.some((v: string) => v.trim())
    const hasNoValidationErrors = !this.validationErrors.some((error) => error.ruleId === rule.id)
    return hasBasicFields && hasValidValues && hasNoValidationErrors
  }

  canSaveConditions(): boolean {
    return (
      this.rules.length > 0 &&
      this.rules.every((rule) => this.isRuleComplete(rule)) &&
      this.validationErrors.length === 0
    )
  }

  getTypeLabel(value: string): string {
    const type = this.ruleTypes.find((t) => t.value === value)
    return type ? type.label : ""
  }

  getFieldLabel(ruleType: string, fieldValue: string): string {
    const fields = this.fieldOptions[ruleType]
    if (!fields) return ""
    const field = fields.find((f) => f.value === fieldValue)
    return field ? field.label : ""
  }

  getOperatorLabel(value: string): string {
    const operator = this.operatorOptions.find((op) => op.value === value)
    return operator ? operator.label : ""
  }

  getLogicLabel(): string {
    const logic = this.logicOptions.find((opt) => opt.value === this.logicType)
    return logic ? logic.label : ""
  }

  // Use this for UI preview: show product names if product rule, else fallback to ids/values
  getJoinedValues(rule: Rule, valueIndex: number): string {
    if (rule.type === 'product' && rule.field === 'product') {
      const key = `${rule.id}_${valueIndex}`;
      const products = this.selectedProductsMap[key] || [];
      return products.map((p: ProductDTO) => p.name).join('", "');
    }
    return rule.values.filter((v) => v.trim()).join('", "');
  }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  handleSaveConditions() {
    if (!this.canSaveConditions()) {
      alert("Please complete all rules and fix validation errors before saving.")
      return
    }

    const conditionData = {
      logicType: this.logicType,
      rules: this.rules,
    }

    // console.log("=== SAVING CONDITIONS FOR SPECIFIC MECHANISM ===")
    // console.log("Mechanism Index:", this.currentMechanismIndex)
    // console.log("Selected Offer Type:", this.selectedOfferType)
    // console.log("Logic Type:", this.logicType)
    // console.log("Rules Count:", this.rules.length)
    // console.log("Complete Condition Data:", conditionData)
    // console.log("Selected Products Map:", this.selectedProductsMap)
    // console.log("===============================================")

    this.onSaveConditions.emit(conditionData)

    // Reset state
    this.rules = []
    this.logicType = "true"
    this.validationErrors = []
    this.selectedProductsMap = {}
    
  }

  handleCancel() {
    this.rules = []
    this.logicType = "true"
    this.validationErrors = []
    this.selectedProductsMap = {}
    this.onBack.emit()
  }

  handleBack() {
    this.onBack.emit()
  }

  onCategorySearch() {
    const searchTerm = this.categorySearchText.toLowerCase()
    this.filteredCategories = searchTerm
      ? this.categories.filter((cat) => cat.name.toLowerCase().includes(searchTerm))
      : this.categories
  }

  onBrandSearch() {
    const searchTerm = this.brandSearchText.toLowerCase()
    this.filteredBrands = searchTerm
      ? this.brands.filter((brand) => brand.name.toLowerCase().includes(searchTerm))
      : this.brands
  }

  onCitySearch() {
    const searchTerm = this.citySearchText.toLowerCase()
    this.filteredCities = searchTerm
      ? this.myanmarCities.filter(
          (city) => city.name.toLowerCase().includes(searchTerm) || city.region.toLowerCase().includes(searchTerm),
        )
      : this.myanmarCities
  }

  selectCategory(category: Category) {
    if (this.currentEditingRule) {
      this.updateValue(this.currentEditingRule.ruleId, this.currentEditingRule.valueIndex, category.name)
    }
    this.showCategoryModal = false
    this.currentEditingRule = null
  }

  selectBrand(brand: Brand) {
    if (this.currentEditingRule) {
      this.updateValue(this.currentEditingRule.ruleId, this.currentEditingRule.valueIndex, brand.name)
    }
    this.showBrandModal = false
    this.currentEditingRule = null
  }
  
 
  selectedBrandsMap: { [ruleId: string]: Brand[] } = {};
  get currentRuleOperator(): string {
    const rule = this.rules.find(r => r.id === this.currentEditingRule?.ruleId);
    return rule?.operator || '';
  }
  isBrandSelected(brand: Brand): boolean {
    const ruleId = this.currentEditingRule?.ruleId;
    if (!ruleId) return false;
    const selected = this.selectedBrandsMap[ruleId] || [];
    return selected.some(b => b.id === brand.id);
  }
  // Custom dropdown state
dropdownOpen: { [ruleId: string]: boolean } = {};
toggleDropdown(ruleId: string) {
  this.dropdownOpen[ruleId] = !this.dropdownOpen[ruleId];
}
closeDropdown(ruleId: string) {
  this.dropdownOpen[ruleId] = false;
}
onCustomDropdownSelect(rule: Rule, fieldValue: string) {
  this.updateRule(rule.id, { field: fieldValue, operator: "", values: [""] });
  this.closeDropdown(rule.id);
}
  selectedCategoriesMap: { [ruleId: string]: Category[] } = {};
  onCategoryClick(category: Category) {
    const ruleId = this.currentEditingRule?.ruleId;
    if (!ruleId) return;
  
    if (!this.selectedCategoriesMap[ruleId]) {
      this.selectedCategoriesMap[ruleId] = [];
    }
  
    if (this.currentRuleOperator === 'one_of') {
      // Multi-select (checkbox)
      const idx = this.selectedCategoriesMap[ruleId].findIndex(c => c.id === category.id);
      if (idx > -1) {
        this.selectedCategoriesMap[ruleId].splice(idx, 1);
      } else {
        this.selectedCategoriesMap[ruleId].push(category);
      }
    } else {
      // Single-select (radio)
      this.selectedCategoriesMap[ruleId] = [category];
    }
  }
  isCategorySelected(category: Category): boolean {
    const ruleId = this.currentEditingRule?.ruleId;
    if (!ruleId) return false;
    const selected = this.selectedCategoriesMap[ruleId] || [];
    return selected.some(c => c.id === category.id);
  }
  confirmCategorySelection() {
    if (this.currentEditingRule) {
      const ruleId = this.currentEditingRule.ruleId;
      const valueIndex = this.currentEditingRule.valueIndex;
      const selected = this.selectedCategoriesMap[ruleId] || [];
      const categoryNames = selected.map(c => c.name);
      this.updateValue(ruleId, valueIndex, categoryNames.join(', '));
    }
    this.showCategoryModal = false;
    this.currentEditingRule = null;
  }
  onBrandClick(brand: Brand) {
    const ruleId = this.currentEditingRule?.ruleId;
    if (!ruleId) return;
  
    if (!this.selectedBrandsMap[ruleId]) {
      this.selectedBrandsMap[ruleId] = [];
    }
  
    if (this.currentRuleOperator === 'one_of') {
      // Multi-select (checkbox)
      const idx = this.selectedBrandsMap[ruleId].findIndex(b => b.id === brand.id);
      if (idx > -1) {
        this.selectedBrandsMap[ruleId].splice(idx, 1);
      } else {
        this.selectedBrandsMap[ruleId].push(brand);
      }
    } else {
      // Single-select (radio)
      this.selectedBrandsMap[ruleId] = [brand];
    }
  }
  confirmBrandSelection() {
    if (this.currentEditingRule) {
      const ruleId = this.currentEditingRule.ruleId;
      const valueIndex = this.currentEditingRule.valueIndex;
      const selected = this.selectedBrandsMap[ruleId] || [];
      const brandNames = selected.map(b => b.name);
      this.updateValue(ruleId, valueIndex, brandNames.join(', '));
    }
    this.showBrandModal = false;
    this.currentEditingRule = null;
  }
  selectCityFromModal() {
    if (this.currentEditingRule && this.selectedCity) {
      this.updateValue(this.currentEditingRule.ruleId, this.currentEditingRule.valueIndex, this.selectedCity)
    }
    this.showMyanmarMapModal = false
    this.currentEditingRule = null
    this.selectedCity = ""
  }

  openCategoryModal(ruleId: string, valueIndex: number) {
    this.currentEditingRule = { ruleId, valueIndex }
    this.showCategoryModal = true
  }

  openBrandModal(ruleId: string, valueIndex: number) {
    this.currentEditingRule = { ruleId, valueIndex }
    this.showBrandModal = true
  }

  openMyanmarMapModal(ruleId: string, valueIndex: number) {
    this.currentEditingRule = { ruleId, valueIndex }
    this.showMyanmarMapModal = true
  }

  onRuleTypeChange(rule: Rule, value: string) {
    this.updateRule(rule.id, { type: value, field: "", operator: "", values: [""] }) // Reset operator to empty
  }

  onRuleFieldChange(rule: Rule, value: string) {
    this.updateRule(rule.id, { field: value, operator: "", values: [""] }) // Reset operator to empty
  }

  onRuleOperatorChange(rule: Rule, value: string) {
    this.updateRule(rule.id, { operator: value, values: [""] })
  }
}
