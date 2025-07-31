import { Injectable } from '@angular/core';
import { DiscountTextService } from './discount-text.service';
import { DiscountDisplayDTO } from '../models/discount';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})


export class DiscountDetailDisplayService {
  constructor(private discountTextService: DiscountTextService) { }

  /**
   * Show discount detail in a SweetAlert popup with clickable links
   */
  showDiscountDetail(discount: DiscountDisplayDTO): void {
    // Get the linked text output
    const linkedTextOutput = this.discountTextService.generateHumanReadableConditionsWithLinks(discount)

    // Generate the detailed HTML with clickable links
    const discountDetails = this.generateClickableDiscountDetails(discount, linkedTextOutput)

    Swal.fire({
      title: discount.name || "Discount Details",
      html: discountDetails,
      confirmButtonText: "Got it!",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-primary",
      },
      width: "500px",
      didOpen: () => {
        // Add click event listeners for the linked entities
        this.attachClickListenersToSwalLinks(linkedTextOutput.linkedEntities)
      },
    })
  }

  /**
   * Generate clickable discount details HTML
   */
  private generateClickableDiscountDetails(discount: DiscountDisplayDTO, linkedTextOutput: any): string {
    let details = `<div style="text-align: left; line-height: 1.6;">`

    // Discount value
    details += `<p><strong>Discount:</strong> ${this.discountTextService.getDiscountPercentage(discount)}</p>`

    // Mechanism type
    details += `<p><strong>Type:</strong> ${this.discountTextService.getDiscountTypeLabel(discount)}</p>`

    // Human-readable conditions with clickable links
    if (linkedTextOutput.text) {
      const clickableText = this.renderTextWithClickableLinks(linkedTextOutput)
      details += `<p><strong>How to qualify:</strong> ${clickableText}</p>`
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
    return details
  }

  private renderTextWithClickableLinks(textOutput: { text: string; linkedEntities: any[] }): string {
    let renderedText = textOutput.text

    textOutput.linkedEntities.forEach((entity, index) => {
      const placeholder = `{{${entity.type.toUpperCase()}${index + 1}}}`
      const clickableElement = `<span class="clickable-entity-link" data-entity-index="${index}" style="color: #3498db; font-weight: 600; cursor: pointer; text-decoration: underline;">${entity.name}</span>`
      renderedText = renderedText.replace(placeholder, clickableElement)
    })
    return renderedText
  }
  
  
  private attachClickListenersToSwalLinks(linkedEntities: any[]): void {
    const clickableElements = document.querySelectorAll(".clickable-entity-link")

    clickableElements.forEach((element) => {
      element.addEventListener("click", (event) => {
        const target = event.target as HTMLElement
        const entityIndex = target.getAttribute("data-entity-index")

        if (entityIndex !== null) {
          const entity = linkedEntities[Number.parseInt(entityIndex)]
          if (entity) {
            // Close the SweetAlert first
            Swal.close()

            // Navigate to the entity
            this.discountTextService.navigateToEntity(entity)
          }
        }
      })
    })
  }

  /**
   * Get linked condition text for template usage
   */
  getLinkedConditionText(discount: DiscountDisplayDTO): { text: string; linkedEntities: any[] } {
    return this.discountTextService.generateHumanReadableConditionsWithLinks(discount)
  }

  /**
   * Render text with clickable links for template usage
   */
  renderTextWithLinks(textOutput: { text: string; linkedEntities: any[] }): string {
    let renderedText = textOutput.text

    textOutput.linkedEntities.forEach((entity, index) => {
      const placeholder =
        index === 0 ? `{{${entity.type.toUpperCase()}}}` : `{{${entity.type.toUpperCase()}${index + 1}}}`
      const clickableElement = `<span class="clickable-entity" data-entity-index="${index}">${entity.name}</span>`
      renderedText = renderedText.replace(placeholder, clickableElement)
    })

    return renderedText
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

  /**
   * Show a simple discount summary popup
   */
  showDiscountSummary(discount: DiscountDisplayDTO): void {
    const summary = this.discountTextService.getSimpleDescription(discount)
    const value = this.discountTextService.getDiscountPercentage(discount)

    Swal.fire({
      title: `${value} OFF`,
      text: summary,
      icon: "info",
      confirmButtonText: "View Details",
      showCancelButton: true,
      cancelButtonText: "Close",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-primary",
        cancelButton: "luxury-btn luxury-btn-secondary",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.showDiscountDetail(discount)
      }
    })
  }

  /**
   * Show discount with copy functionality for coupon codes
   */
  showDiscountWithCopy(discount: DiscountDisplayDTO): void {
    if (discount.mechanismType === "Coupon" && discount.couponcode) {
      const linkedTextOutput = this.discountTextService.generateHumanReadableConditionsWithLinks(discount)
      const clickableText = this.renderTextWithClickableLinks(linkedTextOutput)

      Swal.fire({
        title: discount.name || "Coupon Discount",
        html: `
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem; font-weight: bold; color: #e74c3c; margin-bottom: 1rem;">
              ${this.discountTextService.getDiscountPercentage(discount)} OFF
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <div style="font-size: 1.2rem; font-family: monospace; font-weight: bold; margin-bottom: 0.5rem;">
                ${discount.couponcode}
              </div>
              <button id="copy-coupon-btn" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                <i class="pi pi-copy"></i> Copy Code
              </button>
            </div>
            <div style="font-size: 0.9rem; color: #666;">
              ${clickableText}
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
          popup: "luxury-alert",
        },
        didOpen: () => {
          // Add copy functionality
          const copyBtn = document.getElementById("copy-coupon-btn")
          if (copyBtn) {
            copyBtn.addEventListener("click", () => {
              this.discountTextService
                .copyToClipboard(discount.couponcode!)
                .then(() => {
                  copyBtn.innerHTML = '<i class="pi pi-check"></i> Copied!'
                  copyBtn.style.background = "#28a745"
                  setTimeout(() => {
                    copyBtn.innerHTML = '<i class="pi pi-copy"></i> Copy Code'
                    copyBtn.style.background = "#007bff"
                  }, 2000)
                })
                .catch(() => {
                  copyBtn.innerHTML = '<i class="pi pi-times"></i> Failed'
                  copyBtn.style.background = "#dc3545"
                })
            })
          }

          // Add click listeners for linked entities
          this.attachClickListenersToSwalLinks(linkedTextOutput.linkedEntities)
        },
      })
    } else {
      // For non-coupon discounts, show regular detail
      this.showDiscountDetail(discount)
    }
  }

  /**
   * Show multiple discounts in a carousel-style popup
   */
  showDiscountCarousel(discounts: DiscountDisplayDTO[]): void {
    if (discounts.length === 0) return

    if (discounts.length === 1) {
      this.showDiscountDetail(discounts[0])
      return
    }

    const currentIndex = 0
    const showDiscount = (index: number) => {
      const discount = discounts[index]
      const linkedTextOutput = this.discountTextService.generateHumanReadableConditionsWithLinks(discount)
      const discountDetails = this.generateClickableDiscountDetails(discount, linkedTextOutput)

      Swal.fire({
        title: `${discount.name} (${index + 1}/${discounts.length})`,
        html: discountDetails,
        showConfirmButton: true,
        confirmButtonText: index < discounts.length - 1 ? "Next Offer" : "Got it!",
        showCancelButton: index > 0,
        cancelButtonText: "Previous",
        customClass: {
          popup: "luxury-alert",
          confirmButton: "luxury-btn luxury-btn-primary",
          cancelButton: "luxury-btn luxury-btn-secondary",
        },
        width: "500px",
        didOpen: () => {
          this.attachClickListenersToSwalLinks(linkedTextOutput.linkedEntities)
        },
      }).then((result) => {
        if (result.isConfirmed && index < discounts.length - 1) {
          showDiscount(index + 1)
        } else if (result.dismiss === Swal.DismissReason.cancel && index > 0) {
          showDiscount(index - 1)
        }
      })
    }

    showDiscount(currentIndex)
  }

  /**
 * Render human-readable qualification message without links
 */
  getPlainMechanismMessage(discount: DiscountDisplayDTO): string {
    const output = this.discountTextService.generateHumanReadableConditionsWithLinks(discount)

    let message = output.text

    output.linkedEntities.forEach((entity, index) => {
      const placeholder =
        index === 0 ? `{{${entity.type.toUpperCase()}}}` : `{{${entity.type.toUpperCase()}${index + 1}}}`
      message = message.replace(placeholder, entity.name)
    })

    return message
  }

}
