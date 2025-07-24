import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DiscountConditionEA_D, DiscountConditionGroupEA_C, DiscountDisplayDTO, MechanismType } from '@app/core/models/discount';
import { DiscountTextService } from '@app/core/services/discount-text.service';


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

interface ParsedConditionGroup {
  logicOperator: boolean // true = AND, false = OR
  conditions: ParsedCondition[]
  displayText: string
}

interface ParsedDiscount {
  discount: DiscountDisplayDTO
  parsedGroups: ParsedConditionGroup[]
  summaryText: string
  simpleSummary: string
  isExpanded: boolean
  // Cached linked condition text to avoid repeated computation
  linkedConditionText?: { text: string; linkedEntities: any[] }
  renderedTextWithLinks?: string
}

@Component({
  selector: "app-discount-condition-display",
  standalone: false,
  templateUrl: "./discount-condition-display.component.html",
  styleUrl: "./discount-condition-display.component.css",
})
export class DiscountConditionDisplayComponent implements OnInit, OnChanges {
  @Input() discountHints: DiscountDisplayDTO[] = []
  @Input() showTitle = true
  @Input() maxDisplayItems = 3

  parsedDiscounts: ParsedDiscount[] = []

  constructor(
    private discountTextService: DiscountTextService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.parseDiscountConditions()
  }

  ngOnChanges(): void {
    this.parseDiscountConditions()
  }

  private parseDiscountConditions(): void {
    this.parsedDiscounts = this.discountHints.map((discount) => ({
      discount,
      parsedGroups: this.parseConditionGroups(discount.conditionGroups || []),
      summaryText: this.generateSummaryText(discount.conditionGroups || []),
      simpleSummary: this.discountTextService.getSimpleDescription(discount),
      isExpanded: false,
      // Initialize cached properties as undefined - will be computed on first access
      linkedConditionText: undefined,
      renderedTextWithLinks: undefined,
    }))
  }

  private parseConditionGroups(groups: DiscountConditionGroupEA_C[]): ParsedConditionGroup[] {
    return groups.map((group) => {
      const conditions = (group.conditions || group.discountCondition || []).map((condition) =>
        this.parseCondition(condition),
      )

      return {
        logicOperator: group.logicOperator === "true",
        conditions,
        displayText: this.generateGroupDisplayText(conditions, group.logicOperator === "true"),
      }
    })
  }

  private parseCondition(condition: DiscountConditionEA_D): ParsedCondition {
    const entities = this.discountTextService.extractEntitiesFromCondition(condition)
    const displayText = this.generateConditionDisplayText(condition, entities)

    return {
      type: condition.conditionType,
      detail: condition.conditionDetail,
      operator: condition.operator,
      entities,
      displayText,
      value: condition.value,
    }
  }

  private generateConditionDisplayText(condition: DiscountConditionEA_D, entities: ConditionEntity[]): string {
    if (entities.length === 0) {
      const value = this.discountTextService.formatConditionValue(condition)
      return `${this.discountTextService.getConditionTypeLabel(condition.conditionDetail)} ${this.discountTextService.getOperatorLabel(condition.operator)} ${value}`
    }

    const conditionLabel = this.discountTextService.getConditionTypeLabel(condition.conditionDetail)
    const operatorLabel = this.discountTextService.getOperatorLabel(condition.operator)

    if (entities.length <= this.maxDisplayItems) {
      return `${conditionLabel} ${operatorLabel} ${entities.map((e) => e.name).join(", ")}`
    } else {
      const displayNames = entities
        .slice(0, this.maxDisplayItems)
        .map((e) => e.name)
        .join(", ")
      const remainingCount = entities.length - this.maxDisplayItems
      return `${conditionLabel} ${operatorLabel} ${displayNames} and ${remainingCount} more`
    }
  }

  private generateGroupDisplayText(conditions: ParsedCondition[], isAndOperator: boolean): string {
    if (conditions.length === 0) return ""
    if (conditions.length === 1) return conditions[0].displayText

    const operator = isAndOperator ? " AND " : " OR "
    return conditions.map((c) => c.displayText).join(operator)
  }

  private generateSummaryText(groups: DiscountConditionGroupEA_C[]): string {
    if (groups.length === 0) return "No conditions"

    const groupTexts = groups.map((group) => {
      const conditions = group.conditions || group.discountCondition || []
      const parsedConditions = conditions.map((c) => this.parseCondition(c))
      return this.generateGroupDisplayText(parsedConditions, group.logicOperator === "true")
    })

    if (groupTexts.length === 1) {
      return `${groupTexts[0]}`
    }

    return groupTexts.map((text) => `(${text})`).join(" AND ")
  }

  // ===== DELEGATE TO DISCOUNT TEXT SERVICE =====

  getMechanismBasedMessage(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getMechanismBasedMessage(discount)
  }

  isConditionsMet(discount: DiscountDisplayDTO): boolean {
    return this.discountTextService.isConditionsMet(discount)
  }

  getDiscountPercentage(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getDiscountPercentage(discount)
  }

  getDiscountTypeLabel(discount: DiscountDisplayDTO): string {
    return this.discountTextService.getDiscountTypeLabel(discount)
  }

  formatDiscountValue(discount: DiscountDisplayDTO): string {
    return this.discountTextService.formatDiscountValue(discount)
  }

  isHighValueDiscount(discount: DiscountDisplayDTO): boolean {
    return this.discountTextService.isHighValueDiscount(discount)
  }

  formatConditionValue(condition: DiscountConditionEA_D | ParsedCondition): string {
    return this.discountTextService.formatConditionValue(condition)
  }

  getConditionTypeLabel(conditionDetail: string): string {
    return this.discountTextService.getConditionTypeLabel(conditionDetail)
  }

  getOperatorLabel(operator: string): string {
    return this.discountTextService.getOperatorLabel(operator)
  }

  navigateToEntity(entity: ConditionEntity): void {
    this.discountTextService.navigateToEntity(entity)
  }

  copyToClipboard(text: string): void {
    this.discountTextService
      .copyToClipboard(text)
      .then(() => {
        // You can add a toast notification here
        console.log("Copied to clipboard:", text)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  // ===== OPTIMIZED METHODS WITH CACHING =====

  /**
   * Get linked condition text with caching to avoid repeated computation
   */
  getLinkedConditionText(discount: DiscountDisplayDTO): { text: string; linkedEntities: any[] } {
    // Find the parsed discount item
    const parsedItem = this.parsedDiscounts.find((item) => item.discount.id === discount.id)

    if (parsedItem) {
      // Check if we have cached result
      if (!parsedItem.linkedConditionText) {
        // Compute and cache the result
        parsedItem.linkedConditionText = this.discountTextService.generateHumanReadableConditionsWithLinks(discount)
      }
      return parsedItem.linkedConditionText
    }

    // Fallback if not found in parsed discounts
    return this.discountTextService.generateHumanReadableConditionsWithLinks(discount)
  }

  /**
   * Render text with clickable links with caching
   */
  renderTextWithLinks(textOutput: { text: string; linkedEntities: any[] }): SafeHtml {
    let renderedText = textOutput.text;

    textOutput.linkedEntities.forEach((entity, index) => {
      const placeholder = `{{${entity.type.toUpperCase()}${index + 1}}}`; // always use number
      const clickableElement = `<span class="clickable-entity" data-entity-index="${index}">${entity.name}</span>`;
      renderedText = renderedText.replace(placeholder, clickableElement);
    });

    // Mark as safe HTML
    return this.sanitizer.bypassSecurityTrustHtml(renderedText);
  }

  /**
   * Handle entity clicks in template
   */
  onEntityClick(event: Event, linkedEntities: any[]): void {
    const target = event.target as HTMLElement
    const entityIndex = target.getAttribute("data-entity-index")

    if (entityIndex !== null) {
      const entity = linkedEntities[Number.parseInt(entityIndex)]
      if (entity) {
        this.discountTextService.navigateToEntity(entity)
      }
    }
  }

  // ===== UI INTERACTION METHODS =====

  toggleExpanded(index: number): void {
    if (this.parsedDiscounts[index]) {
      this.parsedDiscounts[index].isExpanded = !this.parsedDiscounts[index].isExpanded
    }
  }

  /**
   * Clear cached data for a specific discount (useful when discount data changes)
   */
  clearDiscountCache(discountId: number): void {
    const parsedItem = this.parsedDiscounts.find((item) => item.discount.id === discountId)
    if (parsedItem) {
      parsedItem.linkedConditionText = undefined
      parsedItem.renderedTextWithLinks = undefined
    }
  }

  /**
   * Clear all cached data (useful for memory management)
   */
  clearAllCache(): void {
    this.parsedDiscounts.forEach((item) => {
      item.linkedConditionText = undefined
      item.renderedTextWithLinks = undefined
    })

    // Also clear the service cache
    this.discountTextService.clearAllCache()
  }

  getHumanReadableText(discount: DiscountDisplayDTO): string {
    return this.discountTextService.generateHumanReadableConditions(discount);
  }

  Math = Math
}
