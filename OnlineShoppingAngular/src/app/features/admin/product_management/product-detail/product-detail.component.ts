import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { ProductCardItem, ProductImageDTO, ProductListItemDTO, ProductVariantDTO } from '../../../../core/models/product.model';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { AccessControlService } from '@app/core/services/AccessControl.service';
import { AuditLogService } from '@app/core/services/audit-log.service';
import { AuditLog } from '@app/core/models/audit-log';
import { User } from '@app/core/models/User';


interface AuditLogDisplay {
  description: string
  details: string[]
  actionColor: string
  actionIcon: string
  deviceInfo: {
    device: string
    browser: string
  }
}

@Component({
  selector: "app-product-detail",
  standalone: false,
  templateUrl: "./product-detail.component.html",
  styleUrl: "./product-detail.component.css",
})
export class ProductDetailComponent implements OnInit {
  product?: ProductCardItem
  mainImageUrl = "/assets/img/default-product.jfif"
  showStockModal = false
  auditLogs: AuditLog[] = []
  formattedAuditLogs: Array<{ log: AuditLog; formatted: AuditLogDisplay }> = []
  activeTab = "variants"
  loading = true

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private accessControl: AccessControlService,
    private auditLogService: AuditLogService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.loadProductData(+id)
    } else {
      this.router.navigate(["/admin/productList"])
    }
  }

  loadProductData(productId: number): void {
    this.loading = true

    this.productService.getProductById(productId).subscribe({
      next: (data) => {
        this.product = data
        this.setMainImage()
        this.buildImagesList()
        this.loadAuditLogs(productId)
        console.log("Product Details:", this.product)
      },
      error: () => {
        this.loading = false
        this.router.navigate(["/admin/productList"])
      },
    })
  }

  loadAuditLogs(productId: number): void {
    this.auditLogService.getLogsForProduct(productId).subscribe({
      next: (logs) => {
        this.auditLogs = logs
        this.loading = false
        console.log("Audit Logs:", logs)
      },
      error: () => {
        this.auditLogs = []
        this.loading = false
      },
    })
  }

  setMainImage(imagePath?: string): void {
    if (imagePath) {
      this.mainImageUrl = imagePath
    } else if (this.product) {
      const images = this.product.product.productImages
      if (images && images.length > 0) {
        const mainImg = images.find((img) => img.mainImageStatus)
        this.mainImageUrl = mainImg?.imgPath || images[0].imgPath || "/assets/img/default-product.jfif"
      }
    }
  }

  allImages: ProductImageDTO[] = []

  buildImagesList(): void {
    this.allImages = []
    const productImages: ProductImageDTO[] = this.product?.product?.productImages || []

    // Step 1: Sort and add product images
    const sortedProductImages = [...productImages].sort((a, b) => a.displayOrder - b.displayOrder)
    this.allImages.push(...sortedProductImages)

    // Optional: re-sort if needed
    this.allImages.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  // Stock Status Methods
  getOverallStockStatus(): string {
    if (!this.product) return ""
    const totalStock = this.getTotalStock()
    if (totalStock === 0) return "Out of Stock"
    if (totalStock <= 10) return "Low Stock"
    return "In Stock"
  }

  getOverallStockClass(): string {
    const status = this.getOverallStockStatus()
    switch (status) {
      case "Out of Stock":
        return "text-danger"
      case "Low Stock":
        return "text-warning"
      default:
        return "text-success"
    }
  }

  getStockIcon(): string {
    const status = this.getOverallStockStatus()
    switch (status) {
      case "Out of Stock":
        return "fas fa-times-circle"
      case "Low Stock":
        return "fas fa-exclamation-triangle"
      default:
        return "fas fa-check-circle"
    }
  }

  getTotalStock(): number {
    if (!this.product) return 0
    return this.product.variants.reduce((total, variant) => total + variant.stock, 0)
  }

  getInStockVariants(): number {
    if (!this.product) return 0
    return this.product.variants.filter((v) => v.stock > 5).length
  }

  getLowStockVariants(): number {
    if (!this.product) return 0
    return this.product.variants.filter((v) => v.stock > 0 && v.stock <= 5).length
  }

  getOutOfStockVariants(): number {
    if (!this.product) return 0
    return this.product.variants.filter((v) => v.stock === 0).length
  }

  // Variant Stock Methods
  getVariantStockStatus(stock: number): string {
    if (stock === 0) return "Out of Stock"
    if (stock <= 5) return "Low Stock"
    return "In Stock"
  }

  getVariantStockClass(stock: number): string {
    if (stock === 0) return "status-inactive"
    if (stock <= 5) return "status-warning"
    return "status-active"
  }

  getVariantStockIcon(stock: number): string {
    if (stock === 0) return "fas fa-times-circle"
    if (stock <= 5) return "fas fa-exclamation-triangle"
    return "fas fa-check-circle"
  }

  // Price Methods
  getPriceRange(): string {
    if (!this.product || this.product.variants.length === 0) {
      return this.product ? `${this.product.product.basePrice.toLocaleString()} MMK` : ""
    }

    const prices = this.product.variants.map((v) => v.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString()} MMK`
    }

    return `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} MMK`
  }

  // Option Methods
  getOptionName(optionId: number): string {
    if (!this.product) return ""
    const option = this.product.options.find((o) => o.id === optionId)
    return option?.name || ""
  }

  getOptionValue(optionId: number, optionValueId: number): string {
    if (!this.product) return ""
    const option = this.product.options.find((o) => o.id === optionId)
    if (!option) return ""
    const value = option.optionValues.find((v) => v.id === optionValueId)
    return value?.value || ""
  }

  formatAuditLogData(log: AuditLog): AuditLogDisplay {
    const { action, entityType, changedData, username } = log

    let description = ""
    const details: string[] = []
    let actionColor = "primary"
    let actionIcon = "fas fa-info-circle"

    // Parse changedData if it's a string
    let parsedData: any = changedData
    if (typeof changedData === "string") {
      try {
        parsedData = JSON.parse(changedData)
      } catch (e) {
        parsedData = changedData // fallback to raw string if not JSON
      }
    }

    // Set color and icon based on action
    switch (action) {
      case "CREATE":
        description = `Created ${entityType.toLowerCase()}`
        actionColor = "success"
        actionIcon = "fas fa-plus-circle"
        break

      case "DELETE":
        description = `Deleted ${entityType.toLowerCase()}`
        actionColor = "danger"
        actionIcon = "fas fa-trash"
        break

      case "UPDATE":
        description = `Updated ${entityType.toLowerCase()}`
        actionColor = "warning"
        actionIcon = "fas fa-edit"

        // Handle different formats of parsedData
        if (typeof parsedData === "string") {
          details.push(parsedData)
        } else if (parsedData.changes) {
          // Handle { changes: { field: { old, new } } }
          Object.entries(parsedData.changes).forEach(([key, val]: any) => {
            if (key === "options" && Array.isArray(val.new)) {
              details.push(`Options: ${val.new.length} configured`)
            } else if (val.old !== undefined && val.new !== undefined) {
              details.push(`${this.formatFieldName(key)}: ${val.old} → ${val.new}`)
            }
          })
          if (parsedData.productId) {
            details.push(`Product ID: ${parsedData.productId}`)
          }
        } else {
          // Flat object with { field: { old, new } }
          Object.entries(parsedData).forEach(([key, val]: any) => {
            if (val.old !== undefined && val.new !== undefined) {
              details.push(`${this.formatFieldName(key)}: ${val.old} → ${val.new}`)
            }
          })
        }

        break

      default:
        description = `${action.toLowerCase()} ${entityType.toLowerCase()}`
        break
    }

    const deviceInfo = this.getDeviceInfo(log.userAgent)

    return {
      description,
      details,
      actionColor,
      actionIcon,
      deviceInfo,
    }
  }

  formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  getDeviceInfo(userAgent: string | null): { device: string; browser: string } {
    if (!userAgent) return { device: "Unknown", browser: "Unknown" }

    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const isChrome = /Chrome/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !isChrome
    const isEdge = /Edge/.test(userAgent)

    let browser = "Unknown"
    if (isChrome) browser = "Chrome"
    else if (isFirefox) browser = "Firefox"
    else if (isSafari) browser = "Safari"
    else if (isEdge) browser = "Edge"

    return {
      device: isMobile ? "Mobile" : "Desktop",
      browser,
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return "Unknown time"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Action Methods
  editProduct(): void {
    if (this.product) {
      this.router.navigate(["/admin/product/edit", this.product.product.id])
    }
  }

  openStockUpdateModal(): void {
    this.showStockModal = true
  }

  onCloseStockModal(): void {
    this.showStockModal = false
  }

  onStockUpdated(): void {
    // Refresh product data after stock update
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.loadProductData(+id)
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  // Soft Delete Methods
  softDeleteProduct(): void {
    if (!this.product) return

    Swal.fire({
      title: "Delete Product",
      text: `Are you sure you want to delete "${this.product.product.name}"? This action can be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-danger",
        cancelButton: "luxury-btn luxury-btn-outline",
      },
    }).then((result) => {
      if (result.isConfirmed && this.product) {
        this.productService.softDeleteProduct(this.product.product.id!).subscribe({
          next: (response) => {
            Swal.fire({
              title: "Deleted!",
              text: "Product has been deleted successfully.",
              icon: "success",
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
              customClass: {
                popup: "luxury-toast luxury-toast-success",
                htmlContainer: "luxury-toast-content",
              },
            })
            this.router.navigate(["/admin/productList"])
          },
          error: (error) => {
            Swal.fire({
              title: "Error!",
              text: "Failed to delete product. Please try again.",
              icon: "error",
              customClass: {
                popup: "luxury-alert",
                confirmButton: "luxury-btn luxury-btn-primary",
              },
            })
          },
        })
      }
    })
  }

  softDeleteVariant(variantId: number): void {
    const variant = this.product?.variants.find((v) => v.id === variantId)
    if (!variant) return

    Swal.fire({
      title: "Delete Variant",
      text: `Are you sure you want to delete variant "${variant.sku}"? This action can be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "luxury-alert",
        confirmButton: "luxury-btn luxury-btn-danger",
        cancelButton: "luxury-btn luxury-btn-outline",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.softDeleteVariant(variantId).subscribe({
          next: (response) => {
            Swal.fire({
              title: "Deleted!",
              text: "Variant has been deleted successfully.",
              icon: "success",
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
              customClass: {
                popup: "luxury-toast luxury-toast-success",
                htmlContainer: "luxury-toast-content",
              },
            })
            // Refresh product data
            const id = this.route.snapshot.paramMap.get("id")
            if (id) {
              this.loadProductData(+id)
            }
          },
          error: (error) => {
            Swal.fire({
              title: "Error!",
              text: "Failed to delete variant. Please try again.",
              icon: "error",
              customClass: {
                popup: "luxury-alert",
                confirmButton: "luxury-btn luxury-btn-primary",
              },
            })
          },
        })
      }
    })
  }

  // TrackBy Methods for Performance
  trackByVariantId(index: number, variant: ProductVariantDTO): number {
    return variant.id || index
  }

  trackByAuditLogIndex(index: number, item: { log: AuditLog; formatted: AuditLogDisplay }): number {
    return item.log.entityId ?? index // fallback to index if undefined
  }

  // Helper getters to check permissions
  get canUpdateStock(): boolean {
    return this.accessControl.hasAny("PRODUCT_STOCK_UPDATE", "SUPERADMIN_PERMISSION")
  }

  get canEditProduct(): boolean {
    return this.accessControl.hasAny("PRODUCT_UPDATE", "SUPERADMIN_PERMISSION")
  }

  selectedAuditLogs: any[] = []
  showAuditModal = false
  selectedCreatedMeta: { createdBy?: User; createdDate?: string } | null = null

  openAuditModal(entityType: string, entityId: string | number) {
    this.selectedAuditLogs = this.auditLogs.filter((log) => log.entityType === entityType && log.entityId == entityId)

    // Dynamically find the source entity based on type
    if (entityType === "Product") {
      const product = this.product?.product // or wherever it's stored
      this.selectedCreatedMeta =
        product?.createdBy && product?.createdDate
          ? {
              createdBy: product.createdBy,
              createdDate: product.createdDate,
            }
          : null
    } else if (entityType === "ProductVariant") {
      console.log(`Audit log requested for entityType: ${entityType}, entityId: ${entityId}`)

      const variant = this.product?.variants?.find((v) => v.id == entityId)
      console.log("Found variant:", variant)

      if (variant) {
        console.log("variant.createdBy:", variant.createdBy)
        console.log("variant.createdDate:", variant.createdDate)
      } else {
        console.warn("No variant found with id:", entityId)
      }

      this.selectedCreatedMeta =
        variant?.createdBy && variant?.createdDate
          ? { createdBy: variant.createdBy, createdDate: variant.createdDate }
          : null

      console.log("selectedCreatedMeta set to:", this.selectedCreatedMeta)
    }

    this.showAuditModal = true
  }
}
