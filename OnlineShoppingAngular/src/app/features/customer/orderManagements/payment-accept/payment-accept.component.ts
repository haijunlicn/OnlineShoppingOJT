import { ChangeDetectorRef, Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { PaymentMethodService } from '../../../../core/services/paymentmethod.service';
import { OrderService } from '../../../../core/services/order.service';
import { VariantService, StockUpdateResponse } from '../../../../core/services/variant.service';
import { PaymentMethodDTO } from '../../../../core/models/payment';
import { OrderRequestDTO, OrderItemRequestDTO } from '../../../../core/models/order.dto';
import Swal from 'sweetalert2';

import { OrderDiscountMechanismDTO } from '../../../../core/models/discount';


export interface CreditCardPayment {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardHolderName: string
  amount: number
}

export interface QRPayment {
  method: string
  amount: number
  qrCode: string
}

export interface PaymentMethod {
  id: string
  name: string
  icon: string
  color: string
  description: string
  logo?: string
  qrPath?: string
}

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean
}

@Component({
  selector: "app-payment-accept",
  standalone: false,
  templateUrl: "./payment-accept.component.html",
  styleUrl: "./payment-accept.component.css",
})
export class PaymentAcceptComponent implements OnInit, OnDestroy {
  // Browser check
  isBrowser = false
  L: any

  // Order Data from navigation
  orderItems: any[] = []
  orderItemsWithDiscounts: OrderItemRequestDTO[] = [] // NEW: Items with attached discounts
  selectedAddress: any = null
  shippingFee = 0
  totalAmount = 0
  itemSubtotal = 0
  currentUserId = 0

  // Discount summary data (for display only)
  originalSubtotal = 0
  autoDiscountSavings = 0
  couponSavings = 0
  totalSavings = 0

  // User state
  currentUser: any = null
  isLoggedIn = false

  // Enhanced Order Summary Properties
  orderNumber = ""
  orderDate: Date = new Date()
  estimatedDeliveryDate: Date = new Date()
  totalItems = 0
  deliveryMethod = "Standard Delivery"
  deliveryTimeRange = "3-5 business days"
  orderStatus = "Pending Payment"
  customerName = ""
  customerEmail = ""
  customerPhone = ""

  // Payment Properties
  selectedPaymentMethod = ""
  selectedQRMethod = ""
  showCreditCardForm = false
  showQRCode = false
  selectedCreditMethod: string | number = ""

  // Available QR Payment Methods (dynamic)
  qrPaymentMethods: PaymentMethodDTO[] = []
  creditCardMethods: PaymentMethodDTO[] = []

  creditCardData: CreditCardPayment = {
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
    amount: 0,
  }

  qrPaymentData: QRPayment | null = null
  paymentAmount = 0
  isProcessing = false
  paymentSuccess = false
  paymentMessage = ""

  // QR Code Upload and Translation
  uploadedImage: File | null = null
  uploadedImageUrl: string | null = null
  translatedText = ""


  selectedDeliveryMethod: any = null
  private subscriptions: Subscription[] = []

  paymentFailed = false

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private paymentMethodService: PaymentMethodService,
    private orderService: OrderService,
    private variantService: VariantService,
  ) {
    this.isBrowser = window.navigator.userAgent.includes("Chrome") || window.navigator.userAgent.includes("Firefox")
  }



  ngOnInit(): void {
    this.authService.initializeUserFromToken()
    const user = this.authService.getCurrentUser()
    this.currentUserId = user ? user.id : 0

    this.authService.user$.subscribe((user: any) => {
      this.currentUser = user
      this.currentUserId = user ? user.id : 0
      this.isLoggedIn = !!user
    })

    // Always reset payment UI state
    this.selectedPaymentMethod = ""
    this.selectedQRMethod = ""
    this.showCreditCardForm = false
    this.showQRCode = false
    this.paymentSuccess = false
    this.paymentFailed = false
    this.paymentMessage = ""
    this.qrPaymentData = null
    this.uploadedImage = null
    this.uploadedImageUrl = null
    this.translatedText = ""

    // Initialize enhanced order summary
    this.orderNumber = this.generateOrderNumber()
    this.orderDate = new Date()
    this.estimatedDeliveryDate = new Date()
    this.estimatedDeliveryDate.setDate(this.estimatedDeliveryDate.getDate() + 5)

    // Try to get state from router navigation
    let state = this.router.getCurrentNavigation()?.extras?.state as any

    if (!state || Object.keys(state).length === 0) {
      state = history.state
    }

    if (!state || Object.keys(state).length === 0) {
      const localData = localStorage.getItem("paymentData")
      if (localData) {
        state = JSON.parse(localData)
      }
    }

    if (state) {
      this.orderItemsWithDiscounts = state.orderItemsWithDiscounts || [] // NEW: Load items with discounts
      this.selectedAddress = state.selectedAddress || null
      this.shippingFee = state.shippingFee || 0
      this.totalAmount = state.totalAmount || 0
      this.itemSubtotal = state.itemSubtotal || 0
      this.uploadedImageUrl = state.uploadedImageUrl || null
      this.translatedText = state.translatedText || ""
      this.selectedPaymentMethod = state.selectedPaymentMethod || ""
      this.selectedQRMethod = state.selectedQRMethod || ""
      this.creditCardData = state.creditCardData || this.creditCardData
      this.qrPaymentData = state.qrPaymentData || null
      this.selectedDeliveryMethod = state.selectedDeliveryMethod || null

      // Load discount summary data (for display)
      this.originalSubtotal = state.originalSubtotal || 0
      this.autoDiscountSavings = state.autoDiscountSavings || 0
      this.couponSavings = state.couponSavings || 0
      this.totalSavings = state.totalSavings || 0

      console.log("Loaded order items with attached discounts:", this.orderItemsWithDiscounts)
    }

    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0)
    this.loadCustomerInformation()
    this.initPaymentAccept()

    this.paymentMethodService.getPaymentMethodsByType("qr").subscribe((methods) => {
      this.qrPaymentMethods = methods
      if (this.qrPaymentMethods.length === 1) {
        this.selectQRMethod((this.qrPaymentMethods[0].id ?? "").toString())
      }
    })

    this.paymentMethodService.getPaymentMethodsByType("credit").subscribe((methods) => {
      this.creditCardMethods = methods
      if (this.creditCardMethods.length === 1) {
        if (this.creditCardMethods[0].id !== undefined) {
          this.selectedCreditMethod = String(this.creditCardMethods[0].id)
        }
      }
    })
  }

  ngOnDestroy(): void {
    console.log("on destroy called");

    this.subscriptions.forEach((sub) => {
      if (sub) {
        sub.unsubscribe()
      }
    })
  }



  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Allow navigation without any restrictions since stock is not reserved
    return true
  }

  private initPaymentAccept(): void {
    this.paymentAmount = this.totalAmount
    this.initializeOrderSummary(this.authService.getCurrentUser())

    this.paymentMethodService.getAllPublicPaymentMethods().subscribe({
      next: (methods: PaymentMethodDTO[]) => {
        this.qrPaymentMethods = (methods || []).filter((m) => Number(m.status) === 1 && m.type === "qr")
        this.creditCardMethods = (methods || []).filter((m) => Number(m.status) === 1 && m.type === "credit")
        if (this.creditCardMethods.length === 1) {
          if (this.creditCardMethods[0].id !== undefined) {
            this.selectedCreditMethod = String(this.creditCardMethods[0].id)
          }
        }
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error("Failed to load payment methods:", err)
        this.qrPaymentMethods = []
      },
    })
  }

  private initializeOrderSummary(user: any): void {
    this.orderNumber = this.generateOrderNumber()
    this.orderDate = new Date()
    this.estimatedDeliveryDate = this.calculateEstimatedDeliveryDate()
    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0)

    if (user) {
      this.customerName = user.name || "Guest User"
      this.customerEmail = user.email || ""
      this.customerPhone = user.phone || ""
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `ORD-${timestamp}-${random}`
  }

  private calculateEstimatedDeliveryDate(): Date {
    const deliveryDate = new Date()
    let businessDays = 0
    let daysToAdd = 0

    while (businessDays < 4) {
      daysToAdd++
      const checkDate = new Date(deliveryDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      const dayOfWeek = checkDate.getDay()

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++
      }
    }

    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)
    return deliveryDate
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  formatDeliveryRange(): string {
    const startDate = new Date(this.orderDate)
    startDate.setDate(startDate.getDate() + 3)

    const endDate = new Date(this.orderDate)
    endDate.setDate(endDate.getDate() + 5)

    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`
  }

  getItemCountText(): string {
    if (this.totalItems === 1) {
      return "1 item"
    }
    return `${this.totalItems} items`
  }

  getDeliveryAddressSummary(): string {
    if (!this.selectedAddress) return "No address selected"

    const address = this.selectedAddress
    const parts = [address.streetAddress, address.city, address.state, address.postalCode, address.phoneNumber].filter(
      (part) => part && part.trim(),
    )

    return parts.join(", ")
  }

  selectPaymentMethod(method: string): void {
    if (!method) return
    this.selectedPaymentMethod = method
    this.showCreditCardForm = method === "credit-card"
    this.showQRCode = method === "qr-payment"
    this.paymentSuccess = false
    this.paymentFailed = false
    this.paymentMessage = ""
    if (method !== "qr-payment") {
      this.selectedQRMethod = ""
    }
  }

  backToPaymentMethods(): void {
    if (this.selectedPaymentMethod && (this.uploadedImage || this.creditCardData.cardNumber)) {
      Swal.fire({
        title: "Are you sure?",
        text: "You will lose your current payment progress. Do you want to continue?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, go back",
        cancelButtonText: "Stay here",
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetPaymentState()
        }
      })
    } else {
      this.resetPaymentState()
    }
  }

  private resetPaymentState(): void {
    this.selectedPaymentMethod = ""
    this.selectedQRMethod = ""
    this.showQRCode = false
    this.showCreditCardForm = false
    this.paymentSuccess = false
    this.paymentFailed = false
    this.paymentMessage = ""
    this.clearUploadedImage()
    this.creditCardData = {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "",
      amount: 0,
    }
  }

  selectQRMethod(methodId: string): void {
    if (!methodId) return
    this.selectedQRMethod = methodId
    this.generateQRCode(methodId)
  }

  generateQRCode(method: string): void {
    if (!method || this.isProcessing) return
    this.isProcessing = true
    setTimeout(() => {
      try {
        this.qrPaymentData = {
          method: method,
          amount: this.paymentAmount,
          qrCode: `${method.toUpperCase()}_QR_CODE_${Date.now()}_${this.paymentAmount}_MMK`,
        }
        this.isProcessing = false
        this.cdr.detectChanges()
      } catch (error) {
        console.error("Error generating QR code:", error)
        this.isProcessing = false
      }
    }, 1500)
  }

  processCreditCardPayment(): void {
    if (!this.isValidCreditCard()) {
      this.paymentMessage = "Please fill in all required fields correctly."
      return
    }
    if (!this.selectedCreditMethod) {
      this.paymentMessage = "Please select a credit card payment method."
      return
    }
    if (!this.uploadedImage) {
      this.paymentMessage = "Please upload a payment proof image."
      return
    }
    if (this.isProcessing) return
    this.isProcessing = true
    this.creditCardData.amount = this.paymentAmount
    setTimeout(() => {
      try {
        this.isProcessing = false
        this.placeOrder("PENDING")
      } catch (error) {
        console.error("Error processing payment:", error)
        this.isProcessing = false
        this.paymentMessage = "An unexpected error occurred during payment processing."
        this.paymentSuccess = false
        this.paymentFailed = true
        this.cdr.detectChanges()
      }
    }, 2000)
  }

  verifyQRPayment(): void {
    if (!this.qrPaymentData || this.isProcessing) return
    if (!this.uploadedImage) {
      this.paymentMessage = "Please upload a payment proof image."
      return
    }
    this.isProcessing = true
    this.cdr.detectChanges()
    this.placeOrder("PENDING")
  }

  placeOrder(paymentStatus: "PAID" | "PENDING" | "Payment Failed"): void {
    if (!this.selectedAddress || !this.selectedAddress.id) {
      alert("Please select a delivery address.")
      this.isProcessing = false
      return
    }

    if (this.orderItemsWithDiscounts.length === 0) {
      alert("Your cart is empty.")
      this.isProcessing = false
      return
    }

    let paymentMethodId: number | null = null
    if (this.selectedPaymentMethod === "qr-payment") {
      paymentMethodId = this.selectedQRMethod ? Number(this.selectedQRMethod) : null
    } else if (this.selectedPaymentMethod === "credit-card") {
      paymentMethodId = this.selectedCreditMethod ? Number(this.selectedCreditMethod) : null
    }

    // Reduce stock before creating order
    this.variantService.recudeStock(this.orderItemsWithDiscounts).subscribe({
      next: (responses: StockUpdateResponse[]) => {
        const allSuccessful = responses.every((response) => response.success)
        if (allSuccessful) {
          // Stock reduction successful, proceed with order creation
          this.createOrder(paymentStatus, paymentMethodId)
        } else {
          // Stock reduction failed
          const failedItems = responses
            .filter((response) => !response.success)
            .map((response, index) => {
              const orderItem = this.orderItems[index]
              if (orderItem) {
                return `${orderItem.productName} (${orderItem.variantSku}) - ${response.message}`
              }
              return response.message
            })
            .join(", ")
          
          this.isProcessing = false
          this.paymentFailed = true
          this.paymentMessage = `Insufficient stock: ${failedItems}`
          
          Swal.fire({
            icon: "error",
            title: "Stock Unavailable",
            text: `Some items are out of stock: ${failedItems}`,
            confirmButtonText: "OK"
          })
        }
      },
      error: (error) => {
        const attemptedItems = this.orderItems
          .map((item) => `${item.productName} (${item.variantSku})`)
          .join(", ")
        
        this.isProcessing = false
        this.paymentFailed = true
        this.paymentMessage = `Stock error: ${attemptedItems}. ${error?.error || "Server error"}`
        
        Swal.fire({
          icon: "error",
          title: "Stock Error",
          text: `Failed to check stock: ${attemptedItems}`,
          confirmButtonText: "OK"
        })
      },
    })
  }

  private createOrder(paymentStatus: "PAID" | "PENDING" | "Payment Failed", paymentMethodId: number | null): void {
    // SIMPLIFIED: Use order items with attached discount mechanisms
    const orderRequest: OrderRequestDTO = {
      userId: this.currentUserId,
      shippingAddressId: this.selectedAddress.id,
      paymentMethodId: paymentMethodId,
      paymentType: this.selectedPaymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: this.totalAmount,
      shippingFee: this.shippingFee,
      deliveryMethod: this.selectedDeliveryMethod,
      items: this.orderItemsWithDiscounts, // Use items with attached discounts
    }

    const formData = new FormData()
    formData.append("order", new Blob([JSON.stringify(orderRequest)], { type: "application/json" }))
    if (this.uploadedImage) {
      formData.append("paymentImage", this.uploadedImage)
    }

    console.log("Creating order with discount mechanisms attached to items:", orderRequest)

    this.orderService.createOrderWithImage(formData).subscribe({
      next: (response) => {
        this.isProcessing = false
        this.paymentSuccess = true
        this.paymentFailed = false
        this.paymentMessage = `Order placed successfully`

        const orderData = response.body || response
        this.orderStatus = orderData.paymentStatus || "PENDING"

        Swal.fire({
          icon: "success",
          title: "Payment Successful!",
          text: `Your order #${orderData.trackingNumber || orderData.id} has been placed successfully. You will receive a confirmation email shortly.`,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "View Order Details",
          showCancelButton: true,
          cancelButtonText: "Continue Shopping",
          cancelButtonColor: "#6c757d",
        }).then((result) => {
          if (result.isConfirmed) {
            this.navigateToOrderDetail(orderData.id)
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            this.router.navigate(["/customer/home"])
          } else {
            setTimeout(() => {
              this.navigateToOrderDetail(orderData.id)
            }, 2000)
          }
        })

        this.clearCartAfterOrder()
        this.showQRCode = false
        this.uploadedImage = null
        this.uploadedImageUrl = null
        this.cdr.detectChanges()
      },
      error: (err) => {
        this.isProcessing = false
        this.paymentSuccess = false
        this.paymentFailed = true
        console.error("Order creation error:", err)

        let errorMessage = "Order failed"
        if (err.error) {
          if (typeof err.error === "string") {
            errorMessage = err.error
          } else if (err.error.message) {
            errorMessage = err.error.message
          } else if (err.message) {
            errorMessage = err.message
          }
        } else if (err.message) {
          errorMessage = err.message
        }

        this.paymentMessage = `Order failed: ${errorMessage}`
        this.orderStatus = "Payment Failed"

        Swal.fire({
          icon: "error",
          title: "Order Failed",
          text: errorMessage,
          confirmButtonText: "OK"
        })
      },
    })
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0]
    if (file && file.type.startsWith("image/")) {
      this.uploadedImage = file
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.uploadedImageUrl = e.target.result
        this.cdr.detectChanges()
      }
      reader.readAsDataURL(file)
    }
  }

  translateImage(): void {
    if (!this.uploadedImage) return
    this.translatedText = ""
    setTimeout(() => {
      try {
        this.translatedText = `Translated QR Code Information:\n\nPayment Method: ${this.getPaymentMethodName(this.selectedQRMethod)}\nAmount: ${this.paymentAmount.toLocaleString()} MMK\nMerchant: Sample Store\nTransaction ID: ${Date.now()}\nStatus: Ready for Payment\n\nPlease confirm the payment in your mobile app.`
        this.cdr.detectChanges()
      } catch (error) {
        console.error("Error translating image:", error)
      }
    }, 2000)
  }

  clearUploadedImage(): void {
    this.uploadedImage = null
    this.uploadedImageUrl = null
    this.translatedText = ""
  }

  isValidCreditCard(): boolean {
    try {
      return !!(
        this.creditCardData.cardNumber &&
        this.creditCardData.expiryDate &&
        this.creditCardData.cvv &&
        this.creditCardData.cardHolderName &&
        this.creditCardData.cardNumber.replace(/\s/g, "").length >= 16 &&
        this.creditCardData.cvv.length >= 3
      )
    } catch (error) {
      console.error("Error validating credit card:", error)
      return false
    }
  }

  formatCardNumber(event: any): void {
    try {
      if (!event?.target?.value) return
      const value = event.target.value.replace(/\s/g, "")
      const formattedValue = value.replace(/(.{4})/g, "$1 ").trim()
      this.creditCardData.cardNumber = formattedValue
    } catch (error) {
      console.error("Error formatting card number:", error)
    }
  }

  formatExpiryDate(event: any): void {
    try {
      if (!event?.target?.value) return
      let value = event.target.value.replace(/\D/g, "")
      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4)
      }
      this.creditCardData.expiryDate = value
    } catch (error) {
      console.error("Error formatting expiry date:", error)
    }
  }

  getPaymentMethodName(method: string | number): string {
    if (!method) return ""
    const qrMethod = this.qrPaymentMethods.find((m) => m.id === Number(method))
    if (qrMethod) return qrMethod.methodName
    switch (method) {
      case "credit-card":
        return "Credit Card"
      default:
        return String(method)
    }
  }

  getSelectedQRMethod(): PaymentMethodDTO | null {
    return this.qrPaymentMethods.find((m) => m.id === Number(this.selectedQRMethod)) || null
  }

  trackByMethodId(index: number, method: PaymentMethodDTO): number | undefined {
    return method.id
  }

  private clearCartAfterOrder(): void {
    this.cartService.clearCart()
    localStorage.removeItem("paymentData")
  }

  goBackToOrderManagement(): void {
    // Navigate back to order management page
    this.router.navigate(["/customer/order"])
  }

  continueShopping(): void {
    // Navigate back to home page to continue shopping
    this.router.navigate(["/customer/home"])
  }



  trackByItemId(index: number, item: any): string {
    return `${item.id}-${item.variantId}`
  }

  onImageError(event: any): void {
    event.target.src = "assets/img/default-product.jpg"
  }

  private loadCustomerInformation(): void {
    const user = this.authService.getCurrentUser()
    if (user) {
      this.customerName = user.name || "Guest User"
      this.customerEmail = user.email || ""
      this.customerPhone = user.phone || ""
    }
  }

  get deliveryPhoneNumber(): string {
    return this.selectedAddress && this.selectedAddress.phoneNumber ? this.selectedAddress.phoneNumber : ""
  }

  selectCreditMethod(id: string | number): void {
    this.selectedCreditMethod = id
    this.paymentMessage = ""
  }

  getDeliveryMethodIconClass(): string {
    if (!this.selectedDeliveryMethod) return ""
    switch (this.selectedDeliveryMethod.name.toLowerCase()) {
      case "standard":
        return "fas fa-truck"
      case "express":
        return "fas fa-shipping-fast"
      case "pickup":
        return "fas fa-store"
      default:
        return "fas fa-truck"
    }
  }

  navigateToOrderDetail(orderId: number): void {
    this.router.navigate(["/customer/orderDetail", orderId])
  }

  Math = Math
}
