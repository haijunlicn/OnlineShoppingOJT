import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CartItem } from '@app/core/models/cart.model';
import { DiscountConditionEA_D, DiscountDisplayDTO } from '@app/core/models/discount';
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
  // 🔧 Store the actual calculated values from buildConditionDisplay
  progressData: {
    current: number
    required: number
    remaining: number
    percentage: number
  }
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
    this.loadDismissedState()
    this.calculateDiscountProgresses()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["conditionalDiscounts"] || changes["currentAmount"] || changes["cartItems"]) {
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

    if (conditionGroups && conditionGroups.length > 0) {
      for (const group of conditionGroups) {
        const isAndGroup = group.logicOperator

        if (group.conditions && group.conditions.length > 0) {

          if (isAndGroup) {
            const allFulfilled = group.conditions.every((c) => c.isFulfilled)

            if (allFulfilled) {
              console.log("🎯 AND group - All conditions complete")
              return { required: 1, current: 1, remaining: 0, percentage: 100 }
            }

            // ✅ Use the combined progress calculator for AND group
            const combinedProgress = this.calculateCombinedAndProgress(group)
            return combinedProgress
          }
          else {
            // OR Group Logic: Any condition can be met
            const fulfilledConditions = group.conditions.filter((c) => c.isFulfilled)

            if (fulfilledConditions.length > 0) {
              // Show the best fulfilled condition
              const bestFulfilled = fulfilledConditions.reduce((best, current) => {
                return current.progressData.percentage > best.progressData.percentage ? current : best
              })
              return bestFulfilled.progressData
            } else {
              // No condition is complete, show the one with highest progress
              const bestProgress = group.conditions.reduce((best, current) => {
                return current.progressData.percentage > best.progressData.percentage ? current : best
              })
              return bestProgress.progressData
            }
          }
        }
      }
    }

    // Fallback if no conditions are found
    return { required: 0, current: 0, remaining: 0, percentage: 0 }
  }

  calculateCombinedAndProgress(group: any): {
    required: number
    current: number
    remaining: number
    percentage: number
  } {
    // For AND groups with ORDER + PRODUCT conditions, calculate combined progress
    const orderCondition = group.conditions.find((c: ConditionDisplay) => c.type === "ORDER" && c.detail === "item_count")
    const productCondition = group.conditions.find((c: ConditionDisplay) => c.type === "PRODUCT")

    if (orderCondition && productCondition) {
      // Get the required count from the ORDER condition
      const requiredCount = orderCondition.progressData.required

      // Get the current count of matching products
      const currentCount = productCondition.progressData.current

      // Calculate combined progress
      const combinedProgress = {
        required: requiredCount,
        current: Math.min(currentCount, requiredCount), // Cap at required
        remaining: Math.max(requiredCount - currentCount, 0),
        percentage: requiredCount > 0 ? Math.min((currentCount / requiredCount) * 100, 100) : 100,
      }

      return combinedProgress;
    }

    // Fallback to minimum progress approach
    let minProgress = 100
    let limitingCondition = null

    for (const condition of group.conditions) {
      if (condition.progressData.percentage < minProgress) {
        minProgress = condition.progressData.percentage
        limitingCondition = condition
      }
    }

    return limitingCondition ? limitingCondition.progressData : { required: 0, current: 0, remaining: 0, percentage: 0 };
  }


  private buildConditionGroupDisplays(discount: DiscountDisplayDTO): ConditionGroupDisplay[] {
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      return []
    }

    return discount.conditionGroups.map((group) => {
      const conditions = (group.conditions || []).map((condition) =>
        this.buildConditionDisplay(condition, group.conditions || []),
      )

      // Properly handle the logicOperator - ensure it's a boolean
      const isAnd = String(group.logicOperator).toLowerCase() === "true"

      const isFulfilled = isAnd ? conditions.every((c) => c.isFulfilled) : conditions.some((c) => c.isFulfilled)

      const displayText = this.buildGroupDisplayText(isAnd, conditions)

      return {
        logicOperator: isAnd,
        conditions,
        isFulfilled,
        displayText,
      }
    })
  }

  private buildConditionDisplay(condition: any, groupConditions: any[]): ConditionDisplay {
    let values: string[]
    try {
      values = Array.isArray(condition.value) ? condition.value : JSON.parse(condition.value || "[]")
    } catch {
      values = [condition.value || "0"]
    }

    let displayText = ""
    let isFulfilled = false
    let icon = "pi-circle"
    let currentValue: number | string | undefined
    let progressData = { current: 0, required: 1, remaining: 1, percentage: 0 }

    switch (condition.conditionType) {
      case "ORDER":
        if (condition.conditionDetail === "order_total") {
          const requiredAmount = Number.parseInt(values[0] || "0")
          const cartTotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

          currentValue = cartTotal
          isFulfilled = this.evaluateCondition(cartTotal, requiredAmount, condition.operator)
          displayText = `Order total ${this.getOperatorText(condition.operator)} ${this.currency} ${requiredAmount.toLocaleString()}`
          icon = "pi-shopping-cart"

          // 🔧 Calculate progress data once here
          progressData = {
            current: cartTotal,
            required: requiredAmount,
            remaining: Math.max(requiredAmount - cartTotal, 0),
            percentage: requiredAmount > 0 ? Math.min((cartTotal / requiredAmount) * 100, 100) : 100,
          }

        } else if (condition.conditionDetail === "item_count") {
          const requiredCount = Number.parseInt(values[0] || "0")
          const itemCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0)

          currentValue = itemCount
          isFulfilled = this.evaluateCondition(itemCount, requiredCount, condition.operator)
          displayText = `Item count ${this.getOperatorText(condition.operator)} ${requiredCount}`
          icon = "pi-list"

          // 🔧 Calculate progress data once here
          progressData = {
            current: itemCount,
            required: requiredCount,
            remaining: Math.max(requiredCount - itemCount, 0),
            percentage: requiredCount > 0 ? Math.min((itemCount / requiredCount) * 100, 100) : 100,
          }

        }
        break

      case "PRODUCT": {
        // Find associated item_count condition in the same group for better context
        const itemCountCondition = groupConditions.find(
          (c) => c.conditionType === "ORDER" && c.conditionDetail === "item_count",
        )

        let requiredCount = 1 // Default to at least 1 item
        if (itemCountCondition?.value) {
          try {
            const raw = Array.isArray(itemCountCondition.value) ? itemCountCondition.value[0] : itemCountCondition.value
            const parsed =
              typeof raw === "string" && raw.startsWith("[") ? JSON.parse(raw)[0] : Number.parseInt(String(raw))

            if (!isNaN(parsed) && parsed > 0) {
              requiredCount = parsed
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse ORDER.item_count value:", itemCountCondition.value)
          }
        }

        const requiredIds: number[] = values.map((v: string) => Number.parseInt(v)).filter((id) => !isNaN(id))
        let matchingItems: CartItem[] = []
        let matchCount = 0

        switch (condition.conditionDetail) {
          case "brand":
            matchingItems = this.cartItems.filter((item) => requiredIds.includes(item.brandId))
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator)
            currentValue = `${matchCount} of ${requiredCount} required`
            displayText = `${requiredCount} items from selected brands`
            icon = "pi-tag"
            break

          case "category":
            matchingItems = this.cartItems.filter((item) => requiredIds.includes(item.categoryId))
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator)
            currentValue = `${matchCount} of ${requiredCount} required`
            displayText = `${requiredCount} items from selected categories`
            icon = "pi-tags"
            break

          case "product":
            matchingItems = this.cartItems.filter((item) => requiredIds.includes(item.productId))
            matchCount = matchingItems.reduce((sum, item) => sum + item.quantity, 0)
            isFulfilled = this.evaluateCondition(matchCount, requiredCount, condition.operator)
            currentValue = `${matchCount} of ${requiredCount} required`
            displayText = `${requiredCount} specific products`
            icon = "pi-box"
            break

          default:
            console.warn("⚠️ Unknown PRODUCT condition detail:", condition.conditionDetail)
            break
        }

        // 🔧 Calculate progress data once here using the correct matchCount and requiredCount
        progressData = {
          current: matchCount,
          required: requiredCount,
          remaining: Math.max(requiredCount - matchCount, 0),
          percentage: requiredCount > 0 ? Math.min((matchCount / requiredCount) * 100, 100) : 100,
        }

        break
      }

      case "CUSTOMER_GROUP":
        isFulfilled = condition.eligible === true
        displayText = `Customer in specific group`
        icon = "pi-users"
        currentValue = isFulfilled ? "Qualified" : "Not qualified"

        // 🔧 Binary progress for customer group
        progressData = {
          current: isFulfilled ? 1 : 0,
          required: 1,
          remaining: isFulfilled ? 0 : 1,
          percentage: isFulfilled ? 100 : 0,
        }
        break

      default:
        displayText = `${condition.conditionType}: ${condition.conditionDetail}`
        icon = "pi-question-circle"
      // Keep default progressData
    }

    return {
      type: condition.conditionType,
      detail: condition.conditionDetail,
      operator: condition.operator,
      value: values,
      displayText,
      isFulfilled,
      icon,
      currentValue,
      progressData, // 🔧 Store the calculated progress data
    }
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
                return current.progressData.percentage > best.progressData.percentage ? current : best
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
              return current.progressData.percentage > best.progressData.percentage ? current : best
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
}
