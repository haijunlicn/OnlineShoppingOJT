import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DiscountConditionEA_D, DiscountConditionGroupEA_C, DiscountDisplayDTO, MechanismType } from '../models/discount';
import { buildPlaceholderList, parseStringArray } from './discountChecker';

interface ConditionEntity {
  id: number
  name: string
  routerLink: string | any[]
}

interface ParsedCondition {
  type: string
  detail: string
  operator: string
  entities: ConditionEntity[]
  displayText: string
  value: string | string[]
}

export interface DiscountTextOutput {
  text: string
  linkedEntities: {
    name: string
    routerLink: string | any[]
    type: "product" | "category" | "brand"
  }[]
}

// Cache interface for storing computed results
interface CacheEntry<T> {
  value: T
  timestamp: number
}

@Injectable({
  providedIn: "root",
})
export class DiscountTextService {
  // Cache for expensive operations (5 minute TTL)
  private cache = new Map<string, CacheEntry<any>>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(private router: Router) { }

  // ===== CACHE MANAGEMENT =====

  private getCacheKey(discount: DiscountDisplayDTO, operation: string): string {
    return `${operation}_${discount.id}_${JSON.stringify(discount.conditionGroups)}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  private clearCache(): void {
    this.cache.clear()
  }

  // ===== MAIN PUBLIC METHODS FOR PRODUCT CARDS =====

  /**
   * Get simple label for available discount badges
   */
  getAvailableDiscountLabel(hint: DiscountDisplayDTO): string {
    switch (hint.mechanismType) {
      case "Coupon":
        return "Coupon Available"
      case "Discount":
        return "Discount Available"
      case "freeGift":
        return "Gift Available"
      case "B2B":
        return "B2B Discount"
      default:
        return "Offer Available"
    }
  }

  getCombinedDiscountLabel(hints: DiscountDisplayDTO[]): string {
    const types = new Set<string>()

    for (const hint of hints) {
      switch (hint.mechanismType) {
        case "Coupon":
          types.add("Coupons")
          break
        case "Discount":
          types.add("Discounts")
          break
        case "freeGift":
          types.add("Gifts")
          break
        case "B2B":
          types.add("B2B Offers")
          break
        default:
          types.add("Offers")
      }
    }

    return Array.from(types).join(" and ") + " Available"
  }

  /**
   * Get tooltip text explaining discount conditions for badges
   */
  getDiscountConditionTooltip(hint: DiscountDisplayDTO): string {
    const cacheKey = this.getCacheKey(hint, "tooltip")
    const cached = this.getFromCache<string>(cacheKey)
    if (cached) return cached

    // Generate basic condition text
    let result = "Hover for conditions"

    if (hint.conditionGroups && hint.conditionGroups.length > 0) {
      const conditions = hint.conditionGroups[0].conditions || []
      if (conditions.length > 0) {
        const condition = conditions[0]

        switch (condition.conditionType) {
          case "ORDER":
            if (condition.conditionDetail === "order_total") {
              let values: string[] = []

              try {
                if (typeof condition.value === "string") {
                  values = JSON.parse(condition.value)
                } else {
                  values = condition.value
                }
              } catch (e) {
                console.warn("Failed to parse condition.value:", condition.value)
              }

              const amount = Number.parseFloat(values?.[0] || "0")
              result = `Minimum order amount: MMK ${amount.toLocaleString("en-US")}`
            }
            if (condition.conditionDetail === "item_count") {
              result = `Minimum ${condition.value[0]} items required`
            }
            break
          case "PRODUCT":
            result = "Specific product requirements apply"
            break
          case "CUSTOMER_GROUP":
            result = "Available for specific customer groups"
            break
          default:
            result = "Conditions apply - see details"
        }
      }
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get mechanism-based message for discount display (cached)
   */
  getMechanismBasedMessage(discount: DiscountDisplayDTO): string {
    const cacheKey = this.getCacheKey(discount, "mechanism_message")
    const cached = this.getFromCache<string>(cacheKey)
    if (cached) return cached

    const humanReadable = this.generateHumanReadableConditions(discount)
    let result: string

    switch (discount.mechanismType) {
      case MechanismType.DISCOUNT:
        result = humanReadable || "Applied automatically at checkout"
        break

      case MechanismType.FREE_GIFT:
        result = humanReadable || "Buy qualifying items for free gift"
        break

      case MechanismType.Coupon:
        if (discount.couponcode) {
          result = humanReadable
            ? `${humanReadable} - Use code ${discount.couponcode}`
            : `Use code ${discount.couponcode}`
        } else {
          result = humanReadable || "Use coupon code for discount"
        }
        break

      default:
        result = humanReadable || "Discount available"
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get discount percentage or fixed amount for display
   */
  getDiscountPercentage(discount: DiscountDisplayDTO): string {
    if (discount.discountType === "PERCENTAGE" && discount.value) {
      const numValue = Number(discount.value)
      if (!isNaN(numValue)) {
        return `${numValue}%`
      }
    } else if (discount.discountType === "FIXED" && discount.value) {
      const numValue = Number(discount.value)
      if (!isNaN(numValue)) {
        return `MMK ${numValue.toLocaleString()}`
      }
    }
    return discount.shortLabel || "DISCOUNT"
  }

  /**
   * Format discount value with OFF suffix
   */
  formatDiscountValue(discount: DiscountDisplayDTO): string {
    if (discount.discountType === "PERCENTAGE" && discount.value) {
      const numValue = Number(discount.value)
      if (!isNaN(numValue)) {
        return `${numValue}% OFF`
      }
    } else if (discount.discountType === "FIXED" && discount.value) {
      const numValue = Number(discount.value)
      if (!isNaN(numValue)) {
        return `MMK ${numValue.toLocaleString()} OFF`
      }
    }
    return discount.shortLabel || discount.name || "DISCOUNT"
  }

  /**
   * Get discount type label
   */
  getDiscountTypeLabel(discount: DiscountDisplayDTO): string {
    if (discount.discountType === "PERCENTAGE") {
      return "Additional Discount"
    } else if (discount.discountType === "FIXED") {
      return "Off"
    }
    return discount.mechanismType === MechanismType.Coupon ? "Coupon Discount" : "Auto Discount"
  }

  /**
   * Check if discount is high value for featuring
   */
  isHighValueDiscount(discount: DiscountDisplayDTO): boolean {
    if (discount.discountType === "PERCENTAGE" && discount.value) {
      const numValue = Number(discount.value)
      return !isNaN(numValue) && numValue >= 15 // 15% or more gets featured
    } else if (discount.discountType === "FIXED" && discount.value) {
      const numValue = Number(discount.value)
      return !isNaN(numValue) && numValue >= 30000 // MMK 30,000 or more gets featured
    }
    return false
  }

  /**
   * Get simple description for discount (cached)
   */
  getSimpleDescription(discount: DiscountDisplayDTO): string {
    const cacheKey = this.getCacheKey(discount, "simple_description")
    const cached = this.getFromCache<string>(cacheKey)
    if (cached) return cached

    let result: string

    // Return a very simple description
    if (discount.conditionSummary && discount.conditionSummary.length < 50) {
      result = discount.conditionSummary
    } else {
      // Generate simple description based on conditions
      const firstGroup = discount.conditionGroups?.[0]
      if (!firstGroup || !firstGroup.conditions?.length) {
        result = "Automatically applied at checkout"
      } else {
        const conditions = firstGroup.conditions || []
        const productCondition = conditions.find((c) => c.conditionDetail === "product")
        const brandCondition = conditions.find((c) => c.conditionDetail === "brand")
        const customerGroupCondition = conditions.find((c) => c.conditionDetail === "1" || c.conditionDetail === "4")

        if (customerGroupCondition) {
          result = "VIP Member Exclusive"
        } else if (productCondition) {
          result = "On selected products"
        } else if (brandCondition) {
          result = "On selected brands"
        } else {
          result = "Automatically applied at checkout"
        }
      }
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Generate detailed discount information with HTML formatting (cached)
   */
  generateDiscountDetails(discount: DiscountDisplayDTO): string {
    const cacheKey = this.getCacheKey(discount, "discount_details")
    const cached = this.getFromCache<string>(cacheKey)
    if (cached) return cached

    let details = `<div style="text-align: left; line-height: 1.6;">`

    // Discount value
    details += `<p><strong>Discount:</strong> ${this.getDiscountPercentage(discount)}</p>`

    // Mechanism type
    details += `<p><strong>Type:</strong> ${this.getDiscountTypeLabel(discount)}</p>`

    // Human-readable conditions
    const humanReadableConditions = this.generateHumanReadableConditions(discount)
    if (humanReadableConditions) {
      details += `<p><strong>How to qualify:</strong> ${humanReadableConditions}</p>`
    }

    // Coupon code
    if (discount.mechanismType === "Coupon" && discount.couponcode) {
      details += `<p><strong>Coupon Code:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${discount.couponcode}</code></p>`
    }

    // Valid dates
    if (discount.startDate && discount.endDate) {
      const startDate = new Date(discount.startDate).toLocaleDateString()
      const endDate = new Date(discount.endDate).toLocaleDateString()
      details += `<p><strong>Valid:</strong> ${startDate} - ${endDate}</p>`
    }

    // Usage limit
    if (discount.usageLimit) {
      details += `<p><strong>Usage Limit:</strong> ${discount.usageLimit} times</p>`
    }

    details += `</div>`

    this.setCache(cacheKey, details)
    return details
  }

  // ===== ROUTER LINK GENERATION =====

  /**
   * Generate router link for condition entities
   */
  generateRouterLink(conditionDetail: string, entity: any): any[] | string {
    const detail = conditionDetail.toLowerCase()

    switch (detail) {
      case "product":
        return ["/customer/product", entity.id]
      case "brand":
        return `/customer/productList?brands=${encodeURIComponent(entity.name)}`
      case "category":
        return `/customer/productList?categories=${encodeURIComponent(entity.name)}`
      default:
        return `/customer/productList`
    }
  }

  /**
   * Navigate to entity (product, brand, category)
   */
  navigateToEntity(entity: ConditionEntity): void {
    if (Array.isArray(entity.routerLink)) {
      this.router.navigate(entity.routerLink).then((success) => {
        if (!success) {
          console.warn("Navigation failed!")
        }
      })
    } else {
      this.router.navigateByUrl(entity.routerLink).then((success) => {
        if (!success) {
          console.warn("Navigation failed!")
        }
      })
    }
  }

  // ===== CONDITION PARSING AND FORMATTING =====

  /**
   * Parse condition value from string array
   */
  parseConditionValue(value: string | string[]): string {
    // Normalize input to a single string
    let strValue: string

    if (Array.isArray(value)) {
      if (value.length === 0) return ""
      strValue = value[0]
    } else {
      strValue = value
    }

    strValue = strValue.trim()

    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(strValue)
      if (Array.isArray(parsed)) {
        return parsed[0]?.toString() || ""
      }
      return parsed?.toString() || ""
    } catch {
      // Not valid JSON, return the raw string
      return strValue
    }
  }

  /**
   * Format condition value with appropriate units
   */
  formatConditionValue(condition: DiscountConditionEA_D | ParsedCondition): string {
    const value = this.parseConditionValue(Array.isArray(condition.value) ? condition.value : [condition.value])

    const detail = "conditionDetail" in condition ? condition.conditionDetail : condition.detail

    if (detail === "order_total") {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        return `MMK ${numValue.toLocaleString()}`
      }
    }

    return value
  }

  /**
   * Get human-readable condition type label
   */
  getConditionTypeLabel(conditionDetail: string): string {
    switch (conditionDetail.toLowerCase()) {
      case "product":
        return "Product"
      case "brand":
        return "Brand"
      case "category":
        return "Category"
      case "order_total":
        return "Order total"
      case "item_count":
        return "Quantity"
      case "shipping_city":
        return "Shipping to"
      case "shipping_cost":
        return "Shipping cost"
      case "1":
      case "4":
        return "Customer Group"
      default:
        return conditionDetail.charAt(0).toUpperCase() + conditionDetail.slice(1).replace("_", " ")
    }
  }

  /**
   * Get human-readable operator label
   */
  getOperatorLabel(operator: string): string {
    switch (operator) {
      case "IS_ONE_OF":
        return "is one of"
      case "GREATER_THAN":
        return "more than"
      case "LESS_THAN":
        return "less than"
      case "GREATER_THAN_OR_EQUAL":
        return "at least"
      case "LESS_THAN_OR_EQUAL":
        return "at most"
      default:
        return operator.toLowerCase().replace("_", " ")
    }
  }

  /**
   * Extract entities from condition with router links
   */
  extractEntitiesFromCondition(condition: DiscountConditionEA_D): ConditionEntity[] {
    if (!condition.relatedEntities || condition.relatedEntities.length === 0) {
      return []
    }

    return condition.relatedEntities.map((entity) => ({
      id: entity.id,
      name: entity.name || `Unknown ${condition.conditionDetail}`,
      routerLink: this.generateRouterLink(condition.conditionDetail, entity),
    }))
  }

  // ===== ENHANCED HUMAN-READABLE CONDITIONS GENERATION =====

  /**
   * Generate human-readable conditions text with proper AND/OR logic (cached)
   */
  generateHumanReadableConditions(discount: DiscountDisplayDTO): string {
    const cacheKey = this.getCacheKey(discount, "human_readable")
    const cached = this.getFromCache<string>(cacheKey)
    if (cached) {
      return cached
    }

    let result: string

    // No condition groups - simple cases
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      if (discount.couponcode) {
        result = `Use code ${discount.couponcode} (available for everyone)`
      } else {
        result = "Available for everyone"
      }
    } else if (discount.mechanismType === MechanismType.FREE_GIFT) {
      // Handle free gift mechanism specially
      result = this.generateFreeGiftConditionsText(discount)
    } else if (discount.conditionGroups.length === 1) {
      // Handle single condition group
      result = this.generateSingleGroupConditionsText(discount.conditionGroups[0])
    } else {
      // Handle multiple condition groups
      result = this.generateMultipleGroupConditionsText(discount.conditionGroups)
    }
    this.setCache(cacheKey, result)
    return result
  }

  private generateFreeGiftConditionsText(discount: DiscountDisplayDTO): string {
    const firstGroup = discount.conditionGroups?.[0]
    if (!firstGroup || !firstGroup.conditions?.length) {
      return "Buy qualifying items to get free gift"
    }

    const conditions = firstGroup.conditions
    const productCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "product")
    const categoryCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "category")
    const brandCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "brand")
    const itemCountCondition = conditions.find((c) => c.conditionDetail === "item_count")
    const orderTotalCondition = conditions.find((c) => c.conditionDetail === "order_total")
    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")

    // Customer group condition
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
      return `Only for ${groupName}`
    }

    // Product/Category + Item count combination
    if ((productCondition || categoryCondition || brandCondition) && itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)

      if (productCondition) {
        const productName = productCondition.relatedEntities?.[0]?.name || "selected product"
        return `Buy ${count} × ${productName} to get free gift`
      }

      if (categoryCondition) {
        const categoryName = categoryCondition.relatedEntities?.[0]?.name || "selected category"
        return `Buy ${count} items from ${categoryName} to get free gift`
      }

      if (brandCondition) {
        const brandName = brandCondition.relatedEntities?.[0]?.name || "selected brand"
        return `Buy ${count} items from ${brandName} to get free gift`
      }
    }

    // Only item count
    if (itemCountCondition && !productCondition && !categoryCondition && !brandCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)
      return `Buy ${count} items to get free gift`
    }

    // Only order total
    if (orderTotalCondition) {
      const amount = this.parseConditionValue(orderTotalCondition.value)
      return `Spend at least MMK ${Number(amount).toLocaleString()} to get free gift`
    }

    // Product/Category/Brand alone
    if (productCondition) {
      const productName = productCondition.relatedEntities?.[0]?.name || "selected product"
      return `Buy ${productName} to get free gift`
    }

    if (categoryCondition) {
      const categoryName = categoryCondition.relatedEntities?.[0]?.name || "selected category"
      return `Buy from ${categoryName} to get free gift`
    }

    if (brandCondition) {
      const brandName = brandCondition.relatedEntities?.[0]?.name || "selected brand"
      return `Buy from ${brandName} to get free gift`
    }

    return "Buy qualifying items to get free gift"
  }

  private generateSingleGroupConditionsText(group: DiscountConditionGroupEA_C): string {
    if (!group.conditions?.length) {
      return "No specific conditions"
    }

    const conditions = group.conditions
    const isAndGroup = String(group.logicOperator) === "true"

    // Extract different types of conditions
    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
    const orderTotalCondition = conditions.find((c) => c.conditionDetail === "order_total")
    const itemCountCondition = conditions.find((c) => c.conditionDetail === "item_count")
    const productConditions = conditions.filter((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "product")
    const categoryConditions = conditions.filter(
      (c) => c.conditionType === "PRODUCT" && c.conditionDetail === "category",
    )
    const brandConditions = conditions.filter((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "brand")

    // Customer group takes priority
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"

      if (orderTotalCondition) {
        const amount = parseStringArray(orderTotalCondition.value)[0]
        return `Only for ${groupName} - spend at least MMK ${Number(amount).toLocaleString()}`
      }

      return `Only for ${groupName}`
    }

    // ===== IMPROVED AND LOGIC FOR NATURAL TEXT GENERATION =====
    if (isAndGroup) {
      return this.generateNaturalAndConditionsText({
        orderTotalCondition,
        itemCountCondition,
        productConditions,
        categoryConditions,
        brandConditions,
      })
    }

    // ===== OR LOGIC (EXISTING LOGIC) =====
    const conditionParts: string[] = []

    // Order total condition
    if (orderTotalCondition) {
      const amount = parseStringArray(orderTotalCondition.value)[0]
      conditionParts.push(`spend at least MMK ${Number(amount).toLocaleString()}`)
    }

    // Item count condition
    if (itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)
      conditionParts.push(`buy at least ${count} items`)
    }

    // Product conditions - show all products
    if (productConditions.length > 0) {
      const productNames = productConditions
        .map((c) => c.relatedEntities?.[0]?.name || "selected product")
        .filter(Boolean)

      if (productNames.length === 1) {
        conditionParts.push(`buy ${productNames[0]}`)
      } else if (productNames.length > 1) {
        const lastProduct = productNames.pop()
        conditionParts.push(`buy ${productNames.join(", ")} or ${lastProduct}`)
      }
    }

    // Category conditions - show all categories
    if (categoryConditions.length > 0) {
      const categoryNames = categoryConditions
        .map((c) => c.relatedEntities?.[0]?.name || "selected category")
        .filter(Boolean)

      console.log("human cates : ", categoryNames);

      if (categoryNames.length === 1) {
        conditionParts.push(`buy from ${categoryNames[0]}`)
      } else if (categoryNames.length > 1) {
        const lastCategory = categoryNames.pop()
        conditionParts.push(`buy from ${categoryNames.join(", ")} or ${lastCategory}`)
      }
    }

    // Brand conditions - show all brands
    if (brandConditions.length > 0) {
      const brandNames = brandConditions.map((c) => c.relatedEntities?.[0]?.name || "selected brand").filter(Boolean)
      console.log("human brands : ", brandNames);

      if (brandNames.length === 1) {
        conditionParts.push(`buy from ${brandNames[0]}`)
      } else if (brandNames.length > 1) {
        const lastBrand = brandNames.pop()
        conditionParts.push(`buy from ${brandNames.join(", ")} or ${lastBrand}`)
      }
    }

    // Join all condition parts with OR
    if (conditionParts.length === 0) {
      return "Meet specified conditions"
    }

    if (conditionParts.length === 1) {
      return conditionParts[0]
    }

    return conditionParts.join(" or ")
  }

  /**
   * Generate natural text for AND conditions by intelligently merging related conditions
   */
  private generateNaturalAndConditionsText(conditions: {
    orderTotalCondition?: DiscountConditionEA_D
    itemCountCondition?: DiscountConditionEA_D
    productConditions: DiscountConditionEA_D[]
    categoryConditions: DiscountConditionEA_D[]
    brandConditions: DiscountConditionEA_D[]
  }): string {
    const { orderTotalCondition, itemCountCondition, productConditions, categoryConditions, brandConditions } =
      conditions

    // Helper function to get all entity names (not limited to 2)
    const getAllEntityNames = (entityConditions: DiscountConditionEA_D[]) => {
      return entityConditions.flatMap(c => (c.relatedEntities || []).map(e => e.name)).filter(Boolean)
    }

    // ===== CASE 1: Order Total + Brand/Category/Product =====
    if (orderTotalCondition) {
      const amount = parseStringArray(orderTotalCondition.value)[0]
      const formattedAmount = `MMK ${Number(amount).toLocaleString()}`

      const brandNames = getAllEntityNames(brandConditions)
      const categoryNames = getAllEntityNames(categoryConditions)
      const productNames = getAllEntityNames(productConditions)

      const entityParts: string[] = []

      if (brandNames.length > 0) {
        entityParts.push(
          brandNames.length === 1
            ? brandNames[0]
            : brandNames.slice(0, -1).join(", ") + " or " + brandNames.slice(-1)
        )
      }

      if (categoryNames.length > 0) {
        entityParts.push(
          categoryNames.length === 1
            ? categoryNames[0]
            : categoryNames.slice(0, -1).join(", ") + " or " + categoryNames.slice(-1)
        )
      }

      if (productNames.length > 0) {
        entityParts.push(
          productNames.length === 1
            ? productNames[0]
            : productNames.slice(0, -1).join(", ") + " or " + productNames.slice(-1)
        )
      }

      if (entityParts.length > 0) {
        const entitiesText = entityParts.length === 1
          ? entityParts[0]
          : entityParts.slice(0, -1).join(", ") + " or " + entityParts.slice(-1)

        return `Spend at least ${formattedAmount} on ${entitiesText} products`
      }

      // If no brand/category/product conditions, just show order total
      return `Spend at least ${formattedAmount}`
    }

    // ===== CASE 2: Item Count + Brand/Category/Product =====
    if (itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)

      // Item Count + Brand - show all brands
      if (brandConditions.length > 0) {
        const brandNames = getAllEntityNames(brandConditions)
        if (brandNames.length === 1) {
          return `Buy at least ${count} items from ${brandNames[0]}`
        } else if (brandNames.length > 1) {
          const lastBrand = brandNames.pop()
          return `Buy at least ${count} items from ${brandNames.join(", ")} and ${lastBrand}`
        }
      }

      // Item Count + Category - show all categories
      if (categoryConditions.length > 0) {
        const categoryNames = getAllEntityNames(categoryConditions)
        if (categoryNames.length === 1) {
          return `Buy at least ${count} items from ${categoryNames[0]}`
        } else if (categoryNames.length > 1) {
          const lastCategory = categoryNames.pop()
          return `Buy at least ${count} items from ${categoryNames.join(", ")} and ${lastCategory}`
        }
      }

      // Item Count + Product - show all products
      if (productConditions.length > 0) {
        const productNames = getAllEntityNames(productConditions)
        if (productNames.length === 1) {
          return `Buy at least ${count} of ${productNames[0]}`
        } else if (productNames.length > 1) {
          const lastProduct = productNames.pop()
          return `Buy at least ${count} of ${productNames.join(", ")} and ${lastProduct}`
        }
      }

      // Item Count alone
      return `Buy at least ${count} items`
    }

    // ===== CASE 3: Only Brand/Category/Product conditions =====
    if (brandConditions.length > 0) {
      const brandNames = getAllEntityNames(brandConditions)
      if (brandNames.length === 1) {
        return `Buy from ${brandNames[0]}`
      } else if (brandNames.length > 1) {
        const lastBrand = brandNames.pop()
        return `Buy from ${brandNames.join(", ")} and ${lastBrand}`
      }
    }

    if (categoryConditions.length > 0) {
      const categoryNames = getAllEntityNames(categoryConditions)
      if (categoryNames.length === 1) {
        return `Buy from ${categoryNames[0]}`
      } else if (categoryNames.length > 1) {
        const lastCategory = categoryNames.pop()
        return `Buy from ${categoryNames.join(", ")} and ${lastCategory}`
      }
    }

    if (productConditions.length > 0) {
      const productNames = getAllEntityNames(productConditions)
      if (productNames.length === 1) {
        return `Buy ${productNames[0]}`
      } else if (productNames.length > 1) {
        const lastProduct = productNames.pop()
        return `Buy ${productNames.join(", ")} and ${lastProduct}`
      }
    }

    return "Meet specified conditions"
  }

  private generateMultipleGroupConditionsText(groups: DiscountConditionGroupEA_C[]): string {
    const groupTexts = groups.map((group) => {
      const singleGroupText = this.generateSingleGroupConditionsText(group)
      return groups.length > 1 ? `(${singleGroupText})` : singleGroupText
    })

    // Multiple groups are typically joined with AND logic
    return groupTexts.join(" and ")
  }

  /**
   * Generate human-readable conditions with clickable entities (cached)
   */
  generateHumanReadableConditionsWithLinks(discount: DiscountDisplayDTO): DiscountTextOutput {
    const cacheKey = this.getCacheKey(discount, "conditions_with_links")
    const cached = this.getFromCache<DiscountTextOutput>(cacheKey)
    if (cached) return cached

    let result: DiscountTextOutput

    // No condition groups - simple cases
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      if (discount.couponcode) {
        result = {
          text: `Use code ${discount.couponcode} (available for everyone)`,
          linkedEntities: [],
        }
      } else {
        result = {
          text: "Available for everyone",
          linkedEntities: [],
        }
      }
    } else if (discount.mechanismType === MechanismType.FREE_GIFT) {
      // Handle free gift mechanism specially
      result = this.generateFreeGiftConditionsTextWithLinks(discount)
    } else if (discount.conditionGroups.length === 1) {
      // Handle single condition group
      result = this.generateSingleGroupConditionsTextWithLinks(discount.conditionGroups[0])
    } else {
      // Handle multiple condition groups
      result = this.generateMultipleGroupConditionsTextWithLinks(discount.conditionGroups)
    }

    this.setCache(cacheKey, result)
    return result
  }

  private generateFreeGiftConditionsTextWithLinks(discount: DiscountDisplayDTO): DiscountTextOutput {
    const firstGroup = discount.conditionGroups?.[0]
    if (!firstGroup || !firstGroup.conditions?.length) {
      return {
        text: "Buy qualifying items to get free gift",
        linkedEntities: [],
      }
    }

    const conditions = firstGroup.conditions
    const productCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "product")
    const categoryCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "category")
    const brandCondition = conditions.find((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "brand")
    const itemCountCondition = conditions.find((c) => c.conditionDetail === "item_count")
    const orderTotalCondition = conditions.find((c) => c.conditionDetail === "order_total")
    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")

    // Customer group condition
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
      return {
        text: `Only for ${groupName}`,
        linkedEntities: [],
      }
    }

    // Product/Category + Item count combination
    if ((productCondition || categoryCondition || brandCondition) && itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)

      if (productCondition && productCondition.relatedEntities?.[0]) {
        const entity = productCondition.relatedEntities[0]
        return {
          text: `Buy ${count} × {{PRODUCT}} to get free gift`,
          linkedEntities: [
            {
              name: entity.name,
              routerLink: this.generateRouterLink(productCondition.conditionDetail, entity),
              type: "product" as const,
            },
          ],
        }
      }

      if (categoryCondition && categoryCondition.relatedEntities?.[0]) {
        const entity = categoryCondition.relatedEntities[0]
        return {
          text: `Buy ${count} items from {{CATEGORY}} to get free gift`,
          linkedEntities: [
            {
              name: entity.name,
              routerLink: this.generateRouterLink(categoryCondition.conditionDetail, entity),
              type: "category" as const,
            },
          ],
        }
      }

      if (brandCondition && brandCondition.relatedEntities?.[0]) {
        const entity = brandCondition.relatedEntities[0]
        return {
          text: `Buy ${count} items from {{BRAND}} to get free gift`,
          linkedEntities: [
            {
              name: entity.name,
              routerLink: this.generateRouterLink(brandCondition.conditionDetail, entity),
              type: "brand" as const,
            },
          ],
        }
      }
    }

    // Only order total
    if (orderTotalCondition) {
      const amount = this.parseConditionValue(orderTotalCondition.value)
      return {
        text: `Spend at least MMK ${Number(amount).toLocaleString()} to get free gift`,
        linkedEntities: [],
      }
    }

    // Product/Category/Brand alone
    if (productCondition && productCondition.relatedEntities?.[0]) {
      const entity = productCondition.relatedEntities[0]
      return {
        text: `Buy {{PRODUCT}} to get free gift`,
        linkedEntities: [
          {
            name: entity.name,
            routerLink: this.generateRouterLink(productCondition.conditionDetail, entity),
            type: "product" as const,
          },
        ],
      }
    }

    if (categoryCondition && categoryCondition.relatedEntities?.[0]) {
      const entity = categoryCondition.relatedEntities[0]
      return {
        text: `Buy from {{CATEGORY}} to get free gift`,
        linkedEntities: [
          {
            name: entity.name,
            routerLink: this.generateRouterLink(categoryCondition.conditionDetail, entity),
            type: "category" as const,
          },
        ],
      }
    }

    if (brandCondition && brandCondition.relatedEntities?.[0]) {
      const entity = brandCondition.relatedEntities[0]
      return {
        text: `Buy from {{BRAND}} to get free gift`,
        linkedEntities: [
          {
            name: entity.name,
            routerLink: this.generateRouterLink(brandCondition.conditionDetail, entity),
            type: "brand" as const,
          },
        ],
      }
    }

    return {
      text: "Buy qualifying items to get free gift",
      linkedEntities: [],
    }
  }

  private generateSingleGroupConditionsTextWithLinks(group: DiscountConditionGroupEA_C): DiscountTextOutput {
    if (!group.conditions?.length) {
      return {
        text: "No specific conditions",
        linkedEntities: [],
      }
    }

    const conditions = group.conditions
    const isAndGroup = String(group.logicOperator) === "true"

    // Extract different types of conditions
    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
    const orderTotalCondition = conditions.find((c) => c.conditionDetail === "order_total")
    const itemCountCondition = conditions.find((c) => c.conditionDetail === "item_count")
    const productConditions = conditions.filter((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "product")
    const categoryConditions = conditions.filter(
      (c) => c.conditionType === "PRODUCT" && c.conditionDetail === "category",
    )
    const brandConditions = conditions.filter((c) => c.conditionType === "PRODUCT" && c.conditionDetail === "brand")

    // Customer group takes priority
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"

      if (orderTotalCondition) {
        const amount = parseStringArray(orderTotalCondition.value)[0]
        return {
          text: `Only for ${groupName} - spend at least MMK ${Number(amount).toLocaleString()}`,
          linkedEntities: [],
        }
      }

      return {
        text: `Only for ${groupName}`,
        linkedEntities: [],
      }
    }

    // ===== IMPROVED AND LOGIC FOR NATURAL TEXT GENERATION WITH LINKS =====
    if (isAndGroup) {
      return this.generateNaturalAndConditionsTextWithLinks({
        orderTotalCondition,
        itemCountCondition,
        productConditions,
        categoryConditions,
        brandConditions,
      })
    }

    // ===== OR LOGIC WITH LINKS =====
    return this.generateOrConditionsTextWithLinks({
      orderTotalCondition,
      itemCountCondition,
      productConditions,
      categoryConditions,
      brandConditions,
    })
  }

  private generateNaturalAndConditionsTextWithLinks(conditions: {
    orderTotalCondition?: DiscountConditionEA_D
    itemCountCondition?: DiscountConditionEA_D
    productConditions: DiscountConditionEA_D[]
    categoryConditions: DiscountConditionEA_D[]
    brandConditions: DiscountConditionEA_D[]
  }): DiscountTextOutput {
    const { orderTotalCondition, itemCountCondition, productConditions, categoryConditions, brandConditions } =
      conditions

    // Helper function to get all entity data (not limited)
    const getAllEntityData = (entityConditions: DiscountConditionEA_D[], type: "product" | "category" | "brand") => {
      return entityConditions.flatMap((condition) =>
        (condition.relatedEntities || []).map((entity) => ({
          name: entity.name || `selected ${type}`,
          routerLink: this.generateRouterLink(condition.conditionDetail, entity),
          type,
        })),
      )
    }

    // Helper function to build dynamic placeholders for all entities
    const buildDynamicPlaceholders = (entities: any[], type: string): string => {
      console.log(`buildDynamicPlaceholders called with type="${type}" and entities:`, entities);

      if (entities.length === 0) {
        console.log("No entities, returning empty string.");
        return "";
      }

      // Always use numbered placeholders, even if only 1 entity
      const placeholders = entities.map((_, index) => `{{${type.toUpperCase()}${index + 1}}}`);


      if (placeholders.length === 1) {
        return placeholders[0]; // e.g. {{BRAND1}}
      }

      const lastPlaceholder = placeholders.pop();

      if (placeholders.length === 0) {
        return lastPlaceholder || "";
      }

      const result = `${placeholders.join(", ")} or ${lastPlaceholder}`;
      return result;
    }

    // ===== CASE 1: Order Total + Brand/Category/Product =====
    if (orderTotalCondition) {
      const amount = parseStringArray(orderTotalCondition.value)[0]
      const formattedAmount = `MMK ${Number(amount).toLocaleString()}`

      // Order Total + Brand - show all brands
      if (brandConditions.length > 0) {
        const entities = getAllEntityData(brandConditions, "brand")
        const placeholders = buildDynamicPlaceholders(entities, "brand")
        return {
          text: `Spend at least ${formattedAmount} on ${placeholders} products`,
          linkedEntities: entities,
        }
      }

      // Order Total + Category - show all categories
      if (categoryConditions.length > 0) {
        const entities = getAllEntityData(categoryConditions, "category")
        const placeholders = buildDynamicPlaceholders(entities, "category")
        return {
          text: `Spend at least ${formattedAmount} on ${placeholders} products`,
          linkedEntities: entities,
        }
      }

      // Order Total + Product - show all products
      if (productConditions.length > 0) {
        const entities = getAllEntityData(productConditions, "product")
        const placeholders = buildDynamicPlaceholders(entities, "product")
        return {
          text: `Spend at least ${formattedAmount} on ${placeholders}`,
          linkedEntities: entities,
        }
      }

      // Order Total alone
      return {
        text: `Spend at least ${formattedAmount}`,
        linkedEntities: [],
      }
    }

    // ===== CASE 2: Item Count + Brand/Category/Product =====
    if (itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)

      // Item Count + Brand - show all brands
      if (brandConditions.length > 0) {
        const entities = getAllEntityData(brandConditions, "brand")
        const placeholders = buildDynamicPlaceholders(entities, "brand")
        return {
          text: `Buy at least ${count} items from ${placeholders}`,
          linkedEntities: entities,
        }
      }

      // Item Count + Category - show all categories
      if (categoryConditions.length > 0) {
        const entities = getAllEntityData(categoryConditions, "category")
        const placeholders = buildDynamicPlaceholders(entities, "category")
        return {
          text: `Buy at least ${count} items from ${placeholders}`,
          linkedEntities: entities,
        }
      }

      // Item Count + Product - show all products
      if (productConditions.length > 0) {
        const entities = getAllEntityData(productConditions, "product")
        const placeholders = buildDynamicPlaceholders(entities, "product")
        return {
          text: `Buy at least ${count} of ${placeholders}`,
          linkedEntities: entities,
        }
      }

      // Item Count alone
      return {
        text: `Buy at least ${count} items`,
        linkedEntities: [],
      }
    }

    // ===== CASE 3: Only Brand/Category/Product conditions =====
    if (brandConditions.length > 0) {
      const entities = getAllEntityData(brandConditions, "brand")
      const placeholders = buildDynamicPlaceholders(entities, "brand")
      return {
        text: `Buy from ${placeholders}`,
        linkedEntities: entities,
      }
    }

    if (categoryConditions.length > 0) {
      const entities = getAllEntityData(categoryConditions, "category")
      const placeholders = buildDynamicPlaceholders(entities, "category")
      return {
        text: `Buy from ${placeholders}`,
        linkedEntities: entities,
      }
    }

    if (productConditions.length > 0) {
      const entities = getAllEntityData(productConditions, "product")
      const placeholders = buildDynamicPlaceholders(entities, "product")
      return {
        text: `Buy ${placeholders}`,
        linkedEntities: entities,
      }
    }

    return {
      text: "Meet specified conditions",
      linkedEntities: [],
    }
  }

  private generateOrConditionsTextWithLinks(conditions: {
    orderTotalCondition?: DiscountConditionEA_D
    itemCountCondition?: DiscountConditionEA_D
    productConditions: DiscountConditionEA_D[]
    categoryConditions: DiscountConditionEA_D[]
    brandConditions: DiscountConditionEA_D[]
  }): DiscountTextOutput {
    const { orderTotalCondition, itemCountCondition, productConditions, categoryConditions, brandConditions } =
      conditions

    const conditionParts: string[] = []
    const linkedEntities: DiscountTextOutput["linkedEntities"] = []

    // Order total condition
    if (orderTotalCondition) {
      const amount = parseStringArray(orderTotalCondition.value)[0]
      conditionParts.push(`spend at least MMK ${Number(amount).toLocaleString()}`)
    }

    // Item count condition
    if (itemCountCondition) {
      const count = this.parseConditionValue(itemCountCondition.value)
      conditionParts.push(`buy at least ${count} items`)
    }

    // Product conditions - handle multiple products
    if (productConditions.length > 0) {
      const entities = productConditions.flatMap((condition) =>
        (condition.relatedEntities || []).map((entity) => ({
          name: entity.name,
          routerLink: this.generateRouterLink(condition.conditionDetail, entity),
          type: "product" as const,
        })),
      )

      if (entities.length === 1) {
        conditionParts.push(`buy {{PRODUCT1}}`)
        linkedEntities.push(entities[0])
      } else if (entities.length > 1) {
        const placeholders = entities.map((_, index) => `{{PRODUCT${index + 1}}}`).join(" or ")
        conditionParts.push(`buy ${placeholders}`)
        linkedEntities.push(...entities)
      }
    }

    // Category conditions - handle multiple categories
    if (categoryConditions.length > 0) {
      const entities = categoryConditions.flatMap((condition) =>
        (condition.relatedEntities || []).map((entity) => ({
          name: entity.name,
          routerLink: this.generateRouterLink(condition.conditionDetail, entity),
          type: "category" as const,
        })),
      )

      if (entities.length === 1) {
        conditionParts.push(`buy from {{CATEGORY1}}`)
        linkedEntities.push(entities[0])
      } else if (entities.length > 1) {
        const placeholders = entities.map((_, index) => `{{CATEGORY${index + 1}}}`).join(" or ")
        conditionParts.push(`buy from ${placeholders}`)
        linkedEntities.push(...entities)
      }
    }

    // Brand conditions - handle multiple brands
    if (brandConditions.length > 0) {
      const entities = brandConditions.flatMap((condition) =>
        (condition.relatedEntities || []).map((entity) => ({
          name: entity.name,
          routerLink: this.generateRouterLink(condition.conditionDetail, entity),
          type: "brand" as const,
        })),
      )

      if (entities.length === 1) {
        conditionParts.push(`buy from {{BRAND1}}`)
        linkedEntities.push(entities[0])
      } else if (entities.length > 1) {
        const placeholders = entities.map((_, index) => `{{BRAND${index + 1}}}`).join(" or ")
        conditionParts.push(`buy from ${placeholders}`)
        linkedEntities.push(...entities)
      }
    }

    // Join all condition parts with OR
    if (conditionParts.length === 0) {
      return {
        text: "Meet specified conditions",
        linkedEntities: [],
      }
    }

    if (conditionParts.length === 1) {
      return {
        text: conditionParts[0],
        linkedEntities,
      }
    }

    return {
      text: conditionParts.join(" or "),
      linkedEntities,
    }
  }

  private generateMultipleGroupConditionsTextWithLinks(groups: DiscountConditionGroupEA_C[]): DiscountTextOutput {
    const groupResults = groups.map((group) => this.generateSingleGroupConditionsTextWithLinks(group))

    const allLinkedEntities = groupResults.flatMap((result) => result.linkedEntities)
    const groupTexts = groupResults.map((result, index) => (groups.length > 1 ? `(${result.text})` : result.text))

    return {
      text: groupTexts.join(" and "),
      linkedEntities: allLinkedEntities,
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Copy text to clipboard
   */
  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Copied to clipboard:", text)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        throw err
      })
  }

  /**
   * Check if conditions are met for coupon code availability
   */
  isConditionsMet(discount: DiscountDisplayDTO): boolean {
    // For now, return true if it's not a coupon or if there are no conditions
    if (discount.mechanismType !== MechanismType.Coupon) {
      return true
    }

    // Check if all conditions have eligible === true or null
    if (!discount.conditionGroups || discount.conditionGroups.length === 0) {
      return true
    }

    const allConditions = discount.conditionGroups.flatMap((group) => group.conditions || [])
    return allConditions.every((condition) => condition.eligible !== false)
  }

  /**
   * Clear all cached data (useful for testing or memory management)
   */
  clearAllCache(): void {
    this.clearCache()
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}
