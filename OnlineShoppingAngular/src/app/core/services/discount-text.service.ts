import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DiscountConditionEA_D, DiscountConditionGroupEA_C, DiscountDisplayDTO, MechanismType } from '../models/discount';
import { buildPlaceholderList, parseStringArray } from './discountChecker';

interface ConditionEntity {
  id: number
  name: string
  routerLink: string | any[]
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

  // ===== MAIN PUBLIC METHODS =====

  /**
   * Get simple label for available discount badges
   */
  getAvailableDiscountLabel(hint: DiscountDisplayDTO): string {
    switch (hint.mechanismType) {
      case "Coupon":
        return "Coupon Available"
      case "Discount":
        return "Discount Available"
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

    let result = "Hover for conditions"

    if (hint.conditionGroups && hint.conditionGroups.length > 0) {
      const conditions = hint.conditionGroups[0].conditions || []
      const orderCondition = conditions.find((c) => c.conditionType === "ORDER")

      if (orderCondition) {
        if (orderCondition.conditionDetail === "order_total") {
          const values = parseStringArray(orderCondition.value)
          const amount = Number.parseFloat(values[0] || "0")
          result = `Minimum order amount: MMK ${amount.toLocaleString("en-US")}`
        } else if (orderCondition.conditionDetail === "item_count") {
          const values = parseStringArray(orderCondition.value)
          result = `Minimum ${values[0]} items required`
        }
      } else {
        const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")
        const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")

        if (customerGroupCondition) {
          result = "Available for specific customer groups"
        } else if (productCondition) {
          result = "Specific product requirements apply"
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

    if (discount.conditionSummary && discount.conditionSummary.length < 50) {
      result = discount.conditionSummary
    } else {
      const firstGroup = discount.conditionGroups?.[0]
      if (!firstGroup || !firstGroup.conditions?.length) {
        result = "Automatically applied at checkout"
      } else {
        const conditions = firstGroup.conditions
        const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")
        const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")

        if (customerGroupCondition) {
          result = "VIP Member Exclusive"
        } else if (productCondition) {
          if (productCondition.conditionDetail === "product") {
            result = "On selected products"
          } else if (productCondition.conditionDetail === "category") {
            result = "On selected categories"
          } else if (productCondition.conditionDetail === "brand") {
            result = "On selected brands"
          } else {
            result = "On selected items"
          }
        } else {
          result = "Automatically applied at checkout"
        }
      }
    }

    this.setCache(cacheKey, result)
    return result
  }

  // ===== SIMPLIFIED HUMAN-READABLE CONDITIONS GENERATION =====

  /**
   * Generate human-readable conditions text with simplified logic (cached)
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

  private generateSingleGroupConditionsText(group: DiscountConditionGroupEA_C): string {
    if (!group.conditions?.length) {
      return "No specific conditions"
    }

    const conditions = group.conditions
    const isAndGroup = String(group.logicOperator) === "true"

    // Extract different types of conditions (only one per type now)
    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
    const orderCondition = conditions.find((c) => c.conditionType === "ORDER")
    const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")

    const conditionParts: string[] = []

    // Customer group condition
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
      conditionParts.push(`only for ${groupName}`)
    }

    // Order condition
    if (orderCondition) {
      if (orderCondition.conditionDetail === "order_total") {
        const values = parseStringArray(orderCondition.value)
        const amount = Number.parseFloat(values[0] || "0")
        conditionParts.push(`spend at least MMK ${amount.toLocaleString()}`)
      } else if (orderCondition.conditionDetail === "item_count") {
        const values = parseStringArray(orderCondition.value)
        conditionParts.push(`buy at least ${values[0]} items`)
      }
    }

    // Product condition (simplified - only one type)
    if (productCondition) {
      const entityNames = (productCondition.relatedEntities || []).map((e) => e.name).filter(Boolean)

      if (productCondition.conditionDetail === "product") {
        if (entityNames.length === 1) {
          conditionParts.push(`buy ${entityNames[0]}`)
        } else if (entityNames.length > 1) {
          const lastProduct = entityNames.pop()
          conditionParts.push(`buy ${entityNames.join(", ")} or ${lastProduct}`)
        }
      } else if (productCondition.conditionDetail === "category") {
        if (entityNames.length === 1) {
          conditionParts.push(`buy from ${entityNames[0]}`)
        } else if (entityNames.length > 1) {
          const lastCategory = entityNames.pop()
          conditionParts.push(`buy from ${entityNames.join(", ")} or ${lastCategory}`)
        }
      } else if (productCondition.conditionDetail === "brand") {
        if (entityNames.length === 1) {
          conditionParts.push(`buy from ${entityNames[0]}`)
        } else if (entityNames.length > 1) {
          const lastBrand = entityNames.pop()
          conditionParts.push(`buy from ${entityNames.join(", ")} or ${lastBrand}`)
        }
      }
    }

    // Join condition parts
    if (conditionParts.length === 0) {
      return "Meet specified conditions"
    }

    if (conditionParts.length === 1) {
      return conditionParts[0]
    }

    // Use AND or OR based on logic operator
    const connector = isAndGroup ? " and " : " or "
    return conditionParts.join(connector)
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

  private generateSingleGroupConditionsTextWithLinks(group: DiscountConditionGroupEA_C): DiscountTextOutput {
    if (!group.conditions?.length) {
      return {
        text: "No specific conditions",
        linkedEntities: [],
      }
    }

    const conditions = group.conditions
    const isAndGroup = String(group.logicOperator) === "true"

    const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
    const orderCondition = conditions.find((c) => c.conditionType === "ORDER")
    const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")

    const conditionParts: string[] = []
    const linkedEntities: DiscountTextOutput["linkedEntities"] = []

    // -- Customer Group Condition --
    if (customerGroupCondition) {
      const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
      conditionParts.push(`for ${groupName}`)
    }
    
    let productPhrase = ""
    let productEntities: typeof linkedEntities = []

    if (productCondition && productCondition.relatedEntities?.length) {
      const entities = productCondition.relatedEntities.map((entity, index) => ({
        name: entity.name,
        routerLink: this.generateRouterLink(productCondition.conditionDetail, entity),
        type: this.getEntityType(productCondition.conditionDetail),
      }))

      let label = ""
      switch (productCondition.conditionDetail) {
        case "product":
          label = "PRODUCT"
          break
        case "category":
          label = "CATEGORY"
          break
        case "brand":
          label = "BRAND"
          break
      }

      const placeholders = entities.map((_, i) => `{{${label}${i + 1}}}`)
      const joined = placeholders.length === 1
        ? placeholders[0]
        : placeholders.slice(0, -1).join(", ") + " or " + placeholders[placeholders.length - 1]

      productPhrase = joined
      productEntities = entities
    }


    // -- Order Condition Parsing --
    let orderPhrase = ""
    if (orderCondition) {
      const values = parseStringArray(orderCondition.value)
      if (orderCondition.conditionDetail === "order_total") {
        const amount = Number.parseFloat(values[0] || "0")
        orderPhrase = `spend at least MMK ${amount.toLocaleString()}`
      } else if (orderCondition.conditionDetail === "item_count") {
        orderPhrase = `buy at least ${values[0]} items`
      }
    }

    // -- Merge Order + Product Logic Smartly --
    if (isAndGroup && orderCondition && productCondition) {
      const conditionText = `${orderPhrase} on ${productPhrase}`
      conditionParts.push(conditionText)
      linkedEntities.push(...productEntities)
    } else {
      if (productPhrase) {
        const prefix = ["brand", "category"].includes(productCondition?.conditionDetail || "") ? "buy from" : "buy"
        conditionParts.push(`${prefix} ${productPhrase}`)
        linkedEntities.push(...productEntities)
      }
      if (orderPhrase) conditionParts.push(orderPhrase)
    }

    // if (isAndGroup && orderCondition && productCondition) {
    //   // Combine: "Spend at least X on {{PRODUCT1}} or {{PRODUCT2}}"
    //   const conditionText = orderPhrase + " on " + productPhrase
    //   conditionParts.push(conditionText)
    // } else {
    //   // Add each condition separately
    //   if (orderPhrase) conditionParts.push(orderPhrase)
    //   if (productPhrase) conditionParts.push(productPhrase)
    // }

    // -- Final Join --
    const finalText = conditionParts.length === 1
      ? conditionParts[0]
      : conditionParts.slice(0, -1).join(", ") + (isAndGroup ? " and " : " or ") + conditionParts[conditionParts.length - 1]

    return {
      text: finalText.charAt(0).toUpperCase() + finalText.slice(1),
      linkedEntities,
    }
  }


  // private generateSingleGroupConditionsTextWithLinks(group: DiscountConditionGroupEA_C): DiscountTextOutput {
  //   if (!group.conditions?.length) {
  //     return {
  //       text: "No specific conditions",
  //       linkedEntities: [],
  //     }
  //   }

  //   const conditions = group.conditions
  //   const isAndGroup = String(group.logicOperator) === "true"

  //   const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
  //   const orderCondition = conditions.find((c) => c.conditionType === "ORDER")
  //   const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")

  //   const conditionParts: string[] = []
  //   const linkedEntities: DiscountTextOutput["linkedEntities"] = []

  //   // Customer group condition
  //   if (customerGroupCondition) {
  //     const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
  //     conditionParts.push(`for ${groupName}`)
  //   }

  //   // Order condition
  //   if (orderCondition) {
  //     const values = parseStringArray(orderCondition.value)
  //     if (orderCondition.conditionDetail === "order_total") {
  //       const amount = Number.parseFloat(values[0] || "0")
  //       conditionParts.push(`spend at least MMK ${amount.toLocaleString()}`)
  //     } else if (orderCondition.conditionDetail === "item_count") {
  //       conditionParts.push(`buy at least ${values[0]} items`)
  //     }
  //   }

  //   // Product condition
  //   if (productCondition && productCondition.relatedEntities?.length) {
  //     const entities = productCondition.relatedEntities.map((entity, index) => ({
  //       name: entity.name,
  //       routerLink: this.generateRouterLink(productCondition.conditionDetail, entity),
  //       type: this.getEntityType(productCondition.conditionDetail),
  //     }))

  //     let phrasePrefix = "buy"
  //     let entityTypeLabel = ""

  //     switch (productCondition.conditionDetail) {
  //       case "product":
  //         entityTypeLabel = "PRODUCT"
  //         break
  //       case "category":
  //         entityTypeLabel = "CATEGORY"
  //         phrasePrefix = "buy from"
  //         break
  //       case "brand":
  //         entityTypeLabel = "BRAND"
  //         phrasePrefix = "buy from"
  //         break
  //     }

  //     const placeholders = entities.map((_, index) => `{{${entityTypeLabel}${index + 1}}}`)
  //     const joined = placeholders.length === 1
  //       ? placeholders[0]
  //       : placeholders.slice(0, -1).join(", ") + " or " + placeholders[placeholders.length - 1]

  //     conditionParts.push(`${phrasePrefix} ${joined}`)
  //     linkedEntities.push(...entities)
  //   }

  //   // Build final condition string
  //   if (conditionParts.length === 0) {
  //     return {
  //       text: "Meet specified conditions",
  //       linkedEntities: [],
  //     }
  //   }

  //   const joinedText =
  //     conditionParts.length === 1
  //       ? conditionParts[0]
  //       : conditionParts.slice(0, -1).join(", ") + (isAndGroup ? " and " : " or ") + conditionParts[conditionParts.length - 1]

  //   return {
  //     text: joinedText.charAt(0).toUpperCase() + joinedText.slice(1),
  //     linkedEntities,
  //   }
  // }

  // private generateSingleGroupConditionsTextWithLinks(group: DiscountConditionGroupEA_C): DiscountTextOutput {
  //   if (!group.conditions?.length) {
  //     return {
  //       text: "No specific conditions",
  //       linkedEntities: [],
  //     }
  //   }

  //   const conditions = group.conditions
  //   const isAndGroup = String(group.logicOperator) === "true"

  //   // Extract different types of conditions (only one per type now)
  //   const customerGroupCondition = conditions.find((c) => c.conditionType === "CUSTOMER_GROUP")
  //   const orderCondition = conditions.find((c) => c.conditionType === "ORDER")
  //   const productCondition = conditions.find((c) => c.conditionType === "PRODUCT")

  //   const conditionParts: string[] = []
  //   const linkedEntities: DiscountTextOutput["linkedEntities"] = []

  //   // Customer group condition
  //   if (customerGroupCondition) {
  //     const groupName = customerGroupCondition.relatedEntities?.[0]?.name || "VIP members"
  //     conditionParts.push(`Only for ${groupName}`)
  //   }

  //   // Order condition
  //   if (orderCondition) {
  //     if (orderCondition.conditionDetail === "order_total") {
  //       const values = parseStringArray(orderCondition.value)
  //       const amount = Number.parseFloat(values[0] || "0")
  //       conditionParts.push(`Spend at least MMK ${amount.toLocaleString()}`)
  //     } else if (orderCondition.conditionDetail === "item_count") {
  //       const values = parseStringArray(orderCondition.value)
  //       conditionParts.push(`buy at least ${values[0]} items`)
  //     }
  //   }

  //   // Product condition with links (simplified - only one type)
  //   if (productCondition && productCondition.relatedEntities?.length) {
  //     const entities = productCondition.relatedEntities.map((entity, index) => ({
  //       name: entity.name,
  //       routerLink: this.generateRouterLink(productCondition.conditionDetail, entity),
  //       type: this.getEntityType(productCondition.conditionDetail),
  //     }))

  //     if (productCondition.conditionDetail === "product") {
  //       if (entities.length === 1) {
  //         conditionParts.push(`buy {{PRODUCT1}}`)
  //         linkedEntities.push(entities[0])
  //       } else if (entities.length > 1) {
  //         const placeholders = entities.map((_, index) => `{{PRODUCT${index + 1}}}`).join(" or ")
  //         conditionParts.push(`buy ${placeholders}`)
  //         linkedEntities.push(...entities)
  //       }
  //     } else if (productCondition.conditionDetail === "category") {
  //       if (entities.length === 1) {
  //         conditionParts.push(`buy from {{CATEGORY1}}`)
  //         linkedEntities.push(entities[0])
  //       } else if (entities.length > 1) {
  //         const placeholders = entities.map((_, index) => `{{CATEGORY${index + 1}}}`).join(" or ")
  //         conditionParts.push(`buy from ${placeholders}`)
  //         linkedEntities.push(...entities)
  //       }
  //     } else if (productCondition.conditionDetail === "brand") {
  //       if (entities.length === 1) {
  //         conditionParts.push(`buy from {{BRAND1}}`)
  //         linkedEntities.push(entities[0])
  //       } else if (entities.length > 1) {
  //         const placeholders = entities.map((_, index) => `{{BRAND${index + 1}}}`).join(" or ")
  //         conditionParts.push(`buy from ${placeholders}`)
  //         linkedEntities.push(...entities)
  //       }
  //     }
  //   }

  //   // Join condition parts
  //   if (conditionParts.length === 0) {
  //     return {
  //       text: "Meet specified conditions",
  //       linkedEntities: [],
  //     }
  //   }

  //   if (conditionParts.length === 1) {
  //     return {
  //       text: conditionParts[0],
  //       linkedEntities,
  //     }
  //   }

  //   // Use AND or OR based on logic operator
  //   const connector = isAndGroup ? " and " : " or "
  //   return {
  //     text: conditionParts.join(connector),
  //     linkedEntities,
  //   }
  // }

  private generateMultipleGroupConditionsTextWithLinks(groups: DiscountConditionGroupEA_C[]): DiscountTextOutput {
    const groupResults = groups.map((group) => this.generateSingleGroupConditionsTextWithLinks(group))

    const allLinkedEntities = groupResults.flatMap((result) => result.linkedEntities)
    const groupTexts = groupResults.map((result, index) => (groups.length > 1 ? `(${result.text})` : result.text))

    return {
      text: groupTexts.join(" and "),
      linkedEntities: allLinkedEntities,
    }
  }

  private getEntityType(conditionDetail: string): "product" | "category" | "brand" {
    switch (conditionDetail) {
      case "product":
        return "product"
      case "category":
        return "category"
      case "brand":
        return "brand"
      default:
        return "product"
    }
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
  formatConditionValue(condition: DiscountConditionEA_D | any): string {
    const value = this.parseConditionValue(Array.isArray(condition.value) ? condition.value : [condition.value])
    const detail = condition.conditionDetail || condition.detail

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
    this.cache.clear()
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
