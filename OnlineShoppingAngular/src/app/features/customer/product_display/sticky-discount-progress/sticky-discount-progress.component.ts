import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CartItem } from '@app/core/models/cart.model';
import { DiscountDisplayDTO } from '@app/core/models/discount';
import { evaluateCartConditions } from '@app/core/services/discountChecker';

interface ConditionDisplay {
  type: string
  detail: string
  operator: string
  value: string[]
  displayText: string
  isFulfilled: boolean
  icon: string
  currentValue?: number | string
}

interface ConditionGroupDisplay {
  logicOperator: boolean // true = AND, false = OR
  conditions: ConditionDisplay[]
  isFulfilled: boolean
  displayText: string
}

interface DiscountProgress {
  discount: DiscountDisplayDTO
  required: number
  current: number
  remaining: number
  percentage: number
  isUnlocked: boolean
  isClosest: boolean
  conditionType: "ORDER_TOTAL" | "ITEM_COUNT" | "MIXED" | "UNKNOWN"
  conditionGroups: ConditionGroupDisplay[]
  shortConditionText: string
  detailedConditionText: string
}

@Component({
  selector: "app-sticky-discount-progress",
  standalone: false,
  templateUrl: "./sticky-discount-progress.component.html",
  styleUrl: "./sticky-discount-progress.component.css",
})
export class StickyDiscountProgressComponent implements OnInit, OnDestroy, OnChanges {
  @Input() conditionalDiscounts: DiscountDisplayDTO[] = []
  @Input() currentAmount = 0
  @Input() cartItems: CartItem[] = []
  @Input() currency = "MMK"
  @Input() showOnMobile = true

  @Output() dismissed = new EventEmitter<void>()
  @Output() addMoreClicked = new EventEmitter<void>()

  isDismissed = false
  discountProgresses: DiscountProgress[] = []
  activeDiscount: DiscountProgress | null = null
  showDetailedConditions = false
  selectedDiscountIndex = 0
  private previousAmount = 0

  ngOnInit(): void {
    console.log("🚀 StickyDiscountProgressComponent initialized")
    this.loadDismissedState()
    this.calculateDiscountProgresses()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["conditionalDiscounts"] || changes["currentAmount"] || changes["cartItems"]) {
      console.log("🔄 Input changes detected")
      this.calculateDiscountProgresses()
      this.checkForDiscountUnlocked()
    }
  }

  ngOnDestroy(): void {
    console.log("🧹 StickyDiscountProgressComponent destroyed")
  }

  private loadDismissedState(): void {
    this.isDismissed = localStorage.getItem("stickyProgressDismissed") === "true"
  }

  private calculateDiscountProgresses(): void {
    console.log("📊 Calculating discount progresses...")

    if (!this.conditionalDiscounts || this.conditionalDiscounts.length === 0) {
      this.discountProgresses = []
      this.activeDiscount = null
      return
    }

    this.discountProgresses = this.conditionalDiscounts.map((discount) => {
      const conditionAnalysis = this.analyzeDiscountConditions(discount)
      const conditionGroups = this.buildConditionGroupDisplays(discount)

      const progressData = this.calculateProgressForDiscount(discount, conditionGroups)

      const shortConditionText = this.buildShortConditionText(conditionGroups)
      const detailedConditionText = this.buildDetailedConditionText(conditionGroups)

      return {
        discount,
        required: progressData.required,
        current: progressData.current,
        remaining: progressData.remaining,
        percentage: progressData.percentage,
        isUnlocked: this.isDiscountUnlocked(discount),
        isClosest: false,
        conditionType: conditionAnalysis.type,
        conditionGroups,
        shortConditionText,
        detailedConditionText,
      }
    })

    // Sort and mark active discount
    const unlockedProgresses = this.discountProgresses
      .filter((p) => !p.isUnlocked)
      .sort((a, b) => a.remaining - b.remaining)

    if (unlockedProgresses.length > 0) {
      unlockedProgresses[0].isClosest = true
      this.activeDiscount = unlockedProgresses[0]
    } else {
      const recentlyUnlocked = this.discountProgresses
        .filter((p) => p.isUnlocked)
        .sort((a, b) => b.required - a.required)[0]

      if (recentlyUnlocked) {
        recentlyUnlocked.isClosest = true
        this.activeDiscount = recentlyUnlocked
      } else {
        this.activeDiscount = null
      }
    }
  }

  private calculateProgressForDiscount(
    discount: DiscountDisplayDTO,
    conditionGroups: ConditionGroupDisplay[],
  ): { required: number; current: number; remaining: number; percentage: number } {
    console.log("🔍 Calculating progress for discount:", discount.name)

    if (conditionGroups && conditionGroups.length > 0) {
      for (const group of conditionGroups) {
        const isAndGroup = group.logicOperator
        console.log("🔀 Group logic operator:", group.logicOperator, "isAndGroup:", isAndGroup)

        if (group.conditions && group.conditions.length > 0) {
          // Get progress for all conditions (both trackable and binary)
          const allConditionProgresses = group.conditions.map((condition) => ({
            condition,
            progress: this.getConditionProgress(condition),
            isTrackable:
              condition.type === "ORDER" && (condition.detail === "order_total" || condition.detail === "item_count"),
            isBinary: condition.type === "PRODUCT" || condition.type === "CUSTOMER_GROUP",
          }))

          console.log("📊 All condition progresses:", allConditionProgresses)

          // Separate trackable and binary conditions
          const trackableConditions = allConditionProgresses.filter(
            (item) => item.isTrackable && item.progress.required > 0,
          )
          const binaryConditions = allConditionProgresses.filter((item) => item.isBinary)

          if (isAndGroup) {
            // AND Group Logic: All conditions must be met

            // If we have trackable conditions, prioritize showing progress for incomplete ones
            if (trackableConditions.length > 0) {
              const incompleteTrackable = trackableConditions.filter((item) => item.progress.percentage < 100)

              if (incompleteTrackable.length > 0) {
                // Show the incomplete trackable condition with highest progress
                const nextCondition = incompleteTrackable.reduce((best, current) =>
                  current.progress.percentage > best.progress.percentage ? current : best,
                )
                console.log("🎯 AND group - Next incomplete trackable condition:", nextCondition.progress)
                return nextCondition.progress
              }
            }

            // If all trackable conditions are complete, check binary conditions
            if (binaryConditions.length > 0) {
              const incompleteBinary = binaryConditions.filter((item) => item.progress.percentage < 100)

              if (incompleteBinary.length > 0) {
                // Show first incomplete binary condition
                console.log("🎯 AND group - Next incomplete binary condition:", incompleteBinary[0].progress)
                return incompleteBinary[0].progress
              }
            }

            // All conditions complete
            if (allConditionProgresses.length > 0) {
              console.log("🎯 AND group - All conditions complete")
              return { required: 1, current: 1, remaining: 0, percentage: 100 }
            }
          } else {
            // OR Group Logic: Any condition can be met

            // Check if any condition is already complete
            const completedCondition = allConditionProgresses.find((item) => item.progress.percentage >= 100)

            if (completedCondition) {
              console.log("🎯 OR group - Locked onto completed condition:", completedCondition.progress)
              return completedCondition.progress
            }

            // No condition is complete, show the one with highest progress
            if (allConditionProgresses.length > 0) {
              const bestProgress = allConditionProgresses.reduce((best, current) =>
                current.progress.percentage > best.progress.percentage ? current : best,
              )
              console.log("🎯 OR group - Best progress (none complete yet):", bestProgress.progress)
              return bestProgress.progress
            }
          }
        }
      }
    }

    // Fallback if no conditions are found
    console.log("🔄 No trackable conditions found, returning zero progress")
    return { required: 0, current: 0, remaining: 0, percentage: 0 }
  }

  private getConditionProgress(condition: ConditionDisplay): {
    required: number
    current: number
    remaining: number
    percentage: number
  } {
    const values: string[] = condition.value || ["0"]

    // 🛒 ORDER Conditions (trackable with numerical progress)
    if (condition.type === "ORDER") {
      if (condition.detail === "order_total") {
        const required = this.parseConditionValue(values)
        const current = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const remaining = Math.max(required - current, 0)
        const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 100

        return { required, current, remaining, percentage }
      }

      if (condition.detail === "item_count") {
        const required = this.parseConditionValue(values)
        const current = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
        const remaining = Math.max(required - current, 0)
        const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 100

        return { required, current, remaining, percentage }
      }
    }

    // 🏷️ PRODUCT Conditions (binary - either fulfilled or not)
    if (condition.type === "PRODUCT") {
      // For product conditions, we use binary progress: 0% or 100%
      const percentage = condition.isFulfilled ? 100 : 0
      return {
        required: 1, // Represents "1 requirement"
        current: condition.isFulfilled ? 1 : 0,
        remaining: condition.isFulfilled ? 0 : 1,
        percentage,
      }
    }

    // 👥 CUSTOMER_GROUP Conditions (binary)
    if (condition.type === "CUSTOMER_GROUP") {
      const percentage = condition.isFulfilled ? 100 : 0
      return {
        required: 1,
        current: condition.isFulfilled ? 1 : 0,
        remaining: condition.isFulfilled ? 0 : 1,
        percentage,
      }
    }

    // Default for unknown condition types
    return { required: 0, current: 0, remaining: 0, percentage: 0 }
  }

  private buildConditionGroupDisplays(discount: DiscountDisplayDTO): ConditionGroupDisplay[] {
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) return [];

    return discount.conditionGroups.map((group) => {
      const allConditions = group.conditions || [];
      const isAnd = String(group.logicOperator).toLowerCase() === "true";

      // First, isolate PRODUCT filters (brand/category/product)
      const productFilters = allConditions.filter(c =>
        c.conditionType === "PRODUCT"
      );

      // Filter cart based on PRODUCT filters
      const filteredCart = this.filterCartByProductConditions(this.cartItems, productFilters);

      const conditions = allConditions.map((condition) =>
        this.buildConditionDisplay(condition, filteredCart) // <-- Pass filtered cart
      );

      const isFulfilled = isAnd
        ? conditions.every((c) => c.isFulfilled)
        : conditions.some((c) => c.isFulfilled);

      const displayText = this.buildGroupDisplayText(isAnd, conditions);

      return {
        logicOperator: isAnd,
        conditions,
        isFulfilled,
        displayText,
      };
    });
  }

  private buildConditionDisplay(condition: any, scopedCartItems: CartItem[] = this.cartItems): ConditionDisplay {
    let values: string[];
    try {
      values = Array.isArray(condition.value)
        ? condition.value
        : JSON.parse(condition.value || "[]");
    } catch {
      values = [condition.value || "0"];
    }

    let displayText = "";
    let isFulfilled = false;
    let icon = "pi-circle";
    let currentValue: number | string | undefined;

    console.group(`🔎 Evaluating Condition: [${condition.conditionType}] ${condition.conditionDetail}`);
    console.log("📦 Raw Condition Object:", condition);
    console.log("📐 Parsed Values:", values);

    switch (condition.conditionType) {
      case "ORDER":
        if (condition.conditionDetail === "order_total") {
          const requiredAmount = Number.parseInt(values[0] || "0");
          const cartTotal = scopedCartItems.reduce
            (
              (sum, item) => sum + item.price * item.quantity,
              0
            );
          currentValue = cartTotal;
          isFulfilled = this.evaluateCondition(cartTotal, requiredAmount, condition.operator);
          displayText = `Order total ${this.getOperatorText(condition.operator)} ${this.currency} ${requiredAmount.toLocaleString()}`;
          icon = "pi-shopping-cart";

          console.log("💰 Order Total:", cartTotal);
          console.log("🎯 Required:", requiredAmount);
          console.log("📊 Operator:", condition.operator);
          console.log("✅ Fulfilled:", isFulfilled);
        } else if (condition.conditionDetail === "item_count") {
          const requiredCount = Number.parseInt(values[0] || "0");
          const itemCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
          currentValue = itemCount;
          isFulfilled = this.evaluateCondition(itemCount, requiredCount, condition.operator);
          displayText = `Item count ${this.getOperatorText(condition.operator)} ${requiredCount}`;
          icon = "pi-list";

          console.log("📦 Item Count:", itemCount);
          console.log("🎯 Required:", requiredCount);
          console.log("📊 Operator:", condition.operator);
          console.log("✅ Fulfilled:", isFulfilled);
        }
        break;

      case "PRODUCT": {
        const requiredCount = Number.parseInt(values[1] || "0");
        let requiredIds: number[] = [];
        let matchingItems: CartItem[] = [];
        let matchCount = 0;

        switch (condition.conditionDetail) {
          case "brand":
            requiredIds = values.map((v: string) => Number.parseInt(v));
            matchingItems = this.cartItems.filter(item => requiredIds.includes(item.brandId));
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator);
            currentValue = `${matchCount} item(s) from selected brands`;
            displayText = condition.operator === "IS_ONE_OF"
              ? `Products from selected brands are present`
              : `Products from selected brands ${this.getOperatorText(condition.operator)} ${requiredCount}`;
            icon = "pi-tag";

            console.log("📦 CONDITION TYPE: PRODUCT -> BRAND");
            console.log("🎯 Required Brand IDs:", requiredIds);
            console.log("🛒 Matching Items (brand):", matchingItems);
            console.log("🧮 Total Quantity of Matching Brand Items:", matchCount);
            console.log("✅ Fulfilled:", isFulfilled);
            break;

          case "category":
            requiredIds = values.map((v: string) => Number.parseInt(v));
            matchingItems = this.cartItems.filter(item => requiredIds.includes(item.categoryId));
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator);
            currentValue = `${matchCount} item(s) from selected categories`;
            displayText = condition.operator === "IS_ONE_OF"
              ? `Products from selected categories are present`
              : `Products from selected categories ${this.getOperatorText(condition.operator)} ${requiredCount}`;
            icon = "pi-tags";

            console.log("📦 CONDITION TYPE: PRODUCT -> CATEGORY");
            console.log("🎯 Required Category IDs:", requiredIds);
            console.log("🛒 Matching Items (category):", matchingItems);
            console.log("🧮 Total Quantity of Matching Category Items:", matchCount);
            console.log("✅ Fulfilled:", isFulfilled);
            break;

          case "product":
            requiredIds = values.map((v: string) => Number.parseInt(v));
            matchingItems = this.cartItems.filter(item => requiredIds.includes(item.productId));
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator);
            currentValue = `${matchCount} specific product(s) in cart`;
            displayText = `Specific product(s) ${this.getOperatorText(condition.operator)} ${requiredCount}`;
            icon = "pi-box";

            console.log("📦 CONDITION TYPE: PRODUCT -> PRODUCT");
            console.log("🎯 Required Product IDs:", requiredIds);
            console.log("🛒 Matching Items (product):", matchingItems);
            console.log("🧮 Total Quantity of Matching Products:", matchCount);
            console.log("✅ Fulfilled:", isFulfilled);
            break;

          default:
            console.warn("⚠️ Unknown PRODUCT condition detail:", condition.conditionDetail);
            break;
        }
        break;
      }

      case "CUSTOMER_GROUP":
        isFulfilled = condition.eligible === true;
        displayText = `Customer in specific group`;
        icon = "pi-users";
        currentValue = isFulfilled ? "Qualified" : "Not qualified";

        console.log("👤 Customer Group Eligible:", isFulfilled);
        break;

      default:
        displayText = `${condition.conditionType}: ${condition.conditionDetail}`;
        icon = "pi-question-circle";

        console.log("❓ Unhandled Condition Type");
    }

    console.log("🧾 Final Display Text:", displayText);
    console.log("📍 Current Value:", currentValue);
    console.log("✅ Is Fulfilled:", isFulfilled);
    console.groupEnd();

    return {
      type: condition.conditionType,
      detail: condition.conditionDetail,
      operator: condition.operator,
      value: values,
      displayText,
      isFulfilled,
      icon,
      currentValue,
    };
  }

  private evaluateCondition(current: number, required: number, operator: string): boolean {
    switch (operator) {
      case "GREATER_THAN":
        return current > required
      case "GREATER_THAN_OR_EQUAL":
        return current >= required
      case "LESS_THAN":
        return current < required
      case "LESS_THAN_OR_EQUAL":
        return current <= required
      case "EQUAL":
        return current === required
      default:
        return false
    }
  }

  private getOperatorText(operator: string): string {
    switch (operator) {
      case "GREATER_THAN":
        return ">"
      case "GREATER_THAN_OR_EQUAL":
        return "≥"
      case "LESS_THAN":
        return "<"
      case "LESS_THAN_OR_EQUAL":
        return "≤"
      case "EQUAL":
        return "="
      case "IS_ONE_OF":
        return "includes"
      default:
        return operator
    }
  }

  private buildGroupDisplayText(logicOperator: boolean, conditions: ConditionDisplay[]): string {
    if (conditions.length === 0) return ""
    if (conditions.length === 1) return conditions[0].displayText

    const operator = logicOperator ? " AND " : " OR "
    return conditions.map((c) => c.displayText).join(operator)
  }

  private buildShortConditionText(groups: ConditionGroupDisplay[]): string {
    if (groups.length === 0) return "No conditions"

    for (const group of groups) {
      const isAndGroup = group.logicOperator

      if (group.conditions.length > 0) {
        // Separate different types of conditions
        const orderConditions = group.conditions.filter(
          (c) => c.type === "ORDER" && (c.detail === "order_total" || c.detail === "item_count"),
        )
        const productConditions = group.conditions.filter((c) => c.type === "PRODUCT")
        const otherConditions = group.conditions.filter((c) => c.type !== "ORDER" && c.type !== "PRODUCT")

        if (isAndGroup) {
          // For AND groups, show the next incomplete condition

          // Check trackable ORDER conditions first
          if (orderConditions.length > 0) {
            const incompleteOrder = orderConditions.filter((c) => !c.isFulfilled)

            if (incompleteOrder.length > 0) {
              const nextCondition = incompleteOrder.reduce((best, current) => {
                const bestProgress = this.getConditionProgressPercentage(best)
                const currentProgress = this.getConditionProgressPercentage(current)
                return currentProgress > bestProgress ? current : best
              })
              return `${nextCondition.displayText} (next required)`
            }
          }

          // Then check PRODUCT conditions
          if (productConditions.length > 0) {
            const incompleteProduct = productConditions.filter((c) => !c.isFulfilled)

            if (incompleteProduct.length > 0) {
              return `${incompleteProduct[0].displayText} (required)`
            }
          }

          // Check other conditions
          if (otherConditions.length > 0) {
            const incompleteOther = otherConditions.filter((c) => !c.isFulfilled)

            if (incompleteOther.length > 0) {
              return `${incompleteOther[0].displayText} (required)`
            }
          }

          return "All conditions fulfilled"
        } else {
          // For OR groups, show completed condition if any, otherwise best option

          // Check if any condition is completed
          const completedCondition = group.conditions.find((c) => c.isFulfilled)

          if (completedCondition) {
            return `${completedCondition.displayText} (completed)`
          }

          // Show the best progress option
          if (orderConditions.length > 0) {
            const bestOrder = orderConditions.reduce((best, current) => {
              const bestProgress = this.getConditionProgressPercentage(best)
              const currentProgress = this.getConditionProgressPercentage(current)
              return currentProgress > bestProgress ? current : best
            })
            return `${bestOrder.displayText} (best option)`
          }

          // If no ORDER conditions, show first PRODUCT condition
          if (productConditions.length > 0) {
            return `${productConditions[0].displayText} (option)`
          }

          // Fallback to first condition
          if (group.conditions.length > 0) {
            return `${group.conditions[0].displayText} (option)`
          }
        }
      }
    }

    // Fallback
    if (groups.length === 1) return groups[0].displayText
    return groups.map((g) => `(${g.displayText})`).join(" AND ")
  }

  private buildDetailedConditionText(groups: ConditionGroupDisplay[]): string {
    if (groups.length === 0) return "No conditions required"

    return groups
      .map((group, index) => {
        const prefix = groups.length > 1 ? `Group ${index + 1}: ` : ""
        const operator = group.logicOperator ? "ALL" : "ANY"
        const conditionList = group.conditions
          .map((c) => {
            const status = c.isFulfilled ? "✅" : "❌"
            const current = c.currentValue !== undefined ? ` (Current: ${c.currentValue})` : ""
            return `${status} ${c.displayText}${current}`
          })
          .join("\n  ")

        return `${prefix}${operator} of the following:\n  ${conditionList}`
      })
      .join("\n\n")
  }

  private analyzeDiscountConditions(discount: DiscountDisplayDTO): {
    type: "ORDER_TOTAL" | "ITEM_COUNT" | "MIXED" | "UNKNOWN"
    orderTotalConditions: any[]
    itemCountConditions: any[]
    productConditions: any[]
    otherConditions: any[]
  } {
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      return {
        type: "UNKNOWN",
        orderTotalConditions: [],
        itemCountConditions: [],
        productConditions: [],
        otherConditions: [],
      }
    }

    const orderTotalConditions: any[] = []
    const itemCountConditions: any[] = []
    const productConditions: any[] = []
    const otherConditions: any[] = []

    discount.conditionGroups.forEach((group) => {
      group.conditions?.forEach((condition) => {
        if (condition.conditionType === "ORDER") {
          if (condition.conditionDetail === "order_total") {
            orderTotalConditions.push(condition)
          } else if (condition.conditionDetail === "item_count") {
            itemCountConditions.push(condition)
          } else {
            otherConditions.push(condition)
          }
        } else if (condition.conditionType === "PRODUCT") {
          productConditions.push(condition)
        } else {
          otherConditions.push(condition)
        }
      })
    })

    let type: "ORDER_TOTAL" | "ITEM_COUNT" | "MIXED" | "UNKNOWN"
    if (orderTotalConditions.length > 0 && itemCountConditions.length === 0) {
      type = "ORDER_TOTAL"
    } else if (itemCountConditions.length > 0 && orderTotalConditions.length === 0) {
      type = "ITEM_COUNT"
    } else if (orderTotalConditions.length > 0 || itemCountConditions.length > 0) {
      type = "MIXED"
    } else {
      type = "UNKNOWN"
    }

    return {
      type,
      orderTotalConditions,
      itemCountConditions,
      productConditions,
      otherConditions,
    }
  }

  private parseConditionValue(values: string[]): number {
    try {
      const valueStr = values[0] || "0"
      const numericValue = Number.parseInt(String(valueStr).replace(/[^\d]/g, ""))
      return isNaN(numericValue) ? 0 : numericValue
    } catch (error) {
      return 0
    }
  }

  private isDiscountUnlocked(discount: DiscountDisplayDTO): boolean {
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      return true
    }

    const dummyShipping = { city: "", cost: 0 }
    return evaluateCartConditions(discount.conditionGroups, this.cartItems, dummyShipping)
  }

  private checkForDiscountUnlocked(): void {
    if (this.activeDiscount && this.previousAmount > 0) {
      const wasLocked = this.previousAmount < this.activeDiscount.required
      const isUnlocked = this.activeDiscount.current >= this.activeDiscount.required

      if (wasLocked && isUnlocked) {
        console.log("🎉 Discount unlocked!")
      }
    }

    this.previousAmount = this.currentAmount
  }

  // Public getters and methods
  get progressPercentage(): number {
    if (!this.activeDiscount) return 100
    return this.activeDiscount.percentage
  }

  get remainingAmount(): number {
    if (!this.activeDiscount) return 0
    return this.activeDiscount.remaining
  }

  get isCompleted(): boolean {
    if (!this.activeDiscount) return false
    return this.activeDiscount.isUnlocked
  }

  get progressText(): string {
    if (!this.activeDiscount) return ""

    const discount = this.activeDiscount.discount
    const discountLabel = this.formatDiscountLabel(discount)

    if (this.activeDiscount.isUnlocked) {
      return `🎉 ${discountLabel} unlocked!`
    }

    return `${discountLabel}: ${this.activeDiscount.shortConditionText}`
  }

  get shortProgressText(): string {
    if (!this.activeDiscount) return ""

    const discountLabel = this.formatDiscountLabel(this.activeDiscount.discount)

    if (this.activeDiscount.isUnlocked) {
      return `🎉 ${discountLabel} unlocked!`
    }

    return `${discountLabel}: ${this.activeDiscount.shortConditionText}`
  }

  formatDiscountLabel(discount: DiscountDisplayDTO): string {
    if (discount.shortLabel) {
      return discount.shortLabel
    }

    if (discount.mechanismType === "freeGift") {
      return "Free Gift"
    }

    if (discount.discountType === "PERCENTAGE" && discount.value) {
      return `${discount.value}% Off`
    } else if (discount.discountType === "FIXED" && discount.value) {
      return `${this.currency} ${discount.value} Off`
    }

    return discount.name || "Discount"
  }

  toggleDetailedConditions(): void {
    this.showDetailedConditions = !this.showDetailedConditions
  }

  selectDiscount(index: number): void {
    this.selectedDiscountIndex = index

    // Update the active discount to the selected one
    // First, clear all isClosest flags
    this.discountProgresses.forEach((progress) => (progress.isClosest = false))

    // Set the selected discount as active
    if (this.discountProgresses[index]) {
      this.discountProgresses[index].isClosest = true
      this.activeDiscount = this.discountProgresses[index]
    }
  }

  dismissProgress(): void {
    this.isDismissed = true
    localStorage.setItem("stickyProgressDismissed", "true")
    this.dismissed.emit()
  }

  onAddMoreItems(): void {
    this.addMoreClicked.emit()
  }

  shouldShow(): boolean {
    const hasActiveDiscount = this.activeDiscount !== null
    const hasDiscounts = this.conditionalDiscounts.length > 0
    const notDismissed = !this.isDismissed

    return notDismissed && hasActiveDiscount && hasDiscounts
  }

  getAllDiscountProgresses(): DiscountProgress[] {
    return this.discountProgresses
  }

  getPendingDiscounts(): DiscountProgress[] {
    return this.discountProgresses.filter((p) => !p.isUnlocked)
  }

  resetDismissedState(): void {
    this.isDismissed = false
    localStorage.removeItem("stickyProgressDismissed")
  }

  private getConditionProgressPercentage(condition: ConditionDisplay): number {
    if (condition.type === "ORDER" && condition.detail === "order_total") {
      const required = Number.parseInt(condition.value[0] || "0")
      const current = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      return required > 0 ? Math.min((current / required) * 100, 100) : 0
    } else if (condition.type === "ORDER" && condition.detail === "item_count") {
      const required = Number.parseInt(condition.value[0] || "0")
      const current = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
      return required > 0 ? Math.min((current / required) * 100, 100) : 0
    }
    return condition.isFulfilled ? 100 : 0
  }

  private filterCartByProductConditions(cart: CartItem[], conditions: any[]): CartItem[] {
    if (conditions.length === 0) return cart;

    return cart.filter((item) => {
      return conditions.every((condition) => {
        const values = JSON.parse(condition.value || "[]").map(Number);
        switch (condition.conditionDetail) {
          case "brand":
            return values.includes(item.brandId);
          case "category":
            return values.includes(item.categoryId);
          case "product":
            return values.includes(item.productId);
          default:
            return true;
        }
      });
    });
  }

}
