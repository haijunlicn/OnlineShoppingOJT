import { ChangeDetectorRef, Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { PaymentMethodService } from '../../../../core/services/paymentmethod.service';
import { PaymentMethodDTO } from '../../../../core/models/payment';
import { OrderService } from '../../../../core/services/order.service';
import { OrderRequestDTO } from '../../../../core/models/order.dto';
import { VariantService } from '../../../../core/services/variant.service';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { NavigationBlockerService } from '@app/core/services/navigation-blocker.service';
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
export class PaymentAcceptComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  // Browser check
  isBrowser = false
  L: any // Leaflet namespace

  // Order Data from navigation
  orderItems: any[] = []
  selectedAddress: any = null
  shippingFee = 0
  totalAmount = 0
  itemSubtotal = 0
  currentUserId = 0

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

  // Enhanced Timer properties
  timer: any = null
  timeLeft = 600 // 10 minutes in seconds
  timerDisplay = "10:00"
  timerExpired = false
  timerWarning = false // For last 2 minutes warning
  timerProgressPercent = 100

  stockReserved = false
  selectedDeliveryMethod: any = null
  private subscriptions: Subscription[] = []

  // Payment state tracking
  paymentInProgress = true // timer မပြည့်သေးရင် true
  paymentFailed = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private paymentMethodService: PaymentMethodService,
    private orderService: OrderService,
    private variantService: VariantService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Listen for browser navigation events (back button, etc.)
  @HostListener("window:beforeunload", ["$event"])
  unloadNotification($event: any): void {
    if (this.shouldBlockNavigation()) {
      $event.returnValue =
        "You have an incomplete payment. Leaving this page will cancel your order. Are you sure you want to leave?"
    }
  }

  ngOnInit(): void {
    // Initialize user ID first (like HeaderComponent)
    this.authService.initializeUserFromToken()
    const user = this.authService.getCurrentUser()
    this.currentUserId = user ? user.id : 0

    // Listen to auth changes (reactively tracks login/logout)
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

    // Fallback: if state is undefined, get it from history.state
    if (!state || Object.keys(state).length === 0) {
      state = history.state
    }

    // NEW: If still no state, try to load from localStorage
    if (!state || Object.keys(state).length === 0) {
      const localData = localStorage.getItem("paymentData")
      if (localData) {
        state = JSON.parse(localData)
      }
    }

    if (state) {
      this.orderItems = state.orderItems || []
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
    }

    // Calculate total items
    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0)

    // Get customer information
    this.loadCustomerInformation()

    this.initPaymentAccept()

    this.paymentMethodService.getPaymentMethodsByType("qr").subscribe((methods) => {
      this.qrPaymentMethods = methods
      // Auto-select if only one method
      if (this.qrPaymentMethods.length === 1) {
        this.selectQRMethod((this.qrPaymentMethods[0].id ?? "").toString())
      }
    })
    this.paymentMethodService.getPaymentMethodsByType("credit").subscribe((methods) => {
      this.creditCardMethods = methods
      // Auto-select if only one credit card method
      if (this.creditCardMethods.length === 1) {
        if (this.creditCardMethods[0].id !== undefined) {
          this.selectedCreditMethod = String(this.creditCardMethods[0].id)
        }
      }
    })

    // Start global timer for payment
    this.startGlobalTimer()
  }

  ngOnDestroy(): void {
    console.log("on destroy called")

    if (this.timer) clearInterval(this.timer)
    this.subscriptions.forEach((sub) => sub.unsubscribe())

    // Auto rollback if payment not completed
    if (this.paymentInProgress || !this.paymentSuccess && !this.paymentFailed && !this.timerExpired) {
      this.rollbackReservedStock() // call rollback
    }
  }

  /**
   * Determines if navigation should be blocked based on payment state
   */
  private shouldBlockNavigation(): boolean {
    return this.paymentInProgress && !this.paymentSuccess && !this.paymentFailed && !this.timerExpired
  }

  /**
   * CanDeactivate implementation - this is the main navigation guard
   */
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Allow navigation if payment is completed, failed, or timer expired
    if (!this.shouldBlockNavigation()) {
      return true
    }

    // Show confirmation dialog for incomplete payments
    return new Promise((resolve) => {
      Swal.fire({
        title: "Leave Payment Page?",
        text: "You have an incomplete payment. Leaving this page will cancel your order and release reserved stock. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, leave page",
        cancelButtonText: "Stay and complete payment",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          this.paymentInProgress = false
          // this.rollbackReservedStock()
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  private initPaymentAccept(): void {
    // Remove duplicate user initialization since it's done in ngOnInit
    this.paymentAmount = this.totalAmount

    // Initialize enhanced order summary data
    this.initializeOrderSummary(this.authService.getCurrentUser())

    // Fetch payment methods dynamically
    this.paymentMethodService.getAllPaymentMethods().subscribe({
      next: (methods: PaymentMethodDTO[]) => {
        this.qrPaymentMethods = (methods || []).filter((m) => Number(m.status) === 1 && m.type === "qr")
        this.creditCardMethods = (methods || []).filter((m) => Number(m.status) === 1 && m.type === "credit")
        // Auto-select if only one credit card method
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
    // Generate order number
    this.orderNumber = this.generateOrderNumber()

    // Set order date
    this.orderDate = new Date()

    // Calculate estimated delivery date (3-5 business days from now)
    this.estimatedDeliveryDate = this.calculateEstimatedDeliveryDate()

    // Calculate total items
    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0)

    // Set customer information
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

    // Add 3-5 business days (excluding weekends)
    while (businessDays < 4) {
      // 4 business days (3-5 range)
      daysToAdd++
      const checkDate = new Date(deliveryDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      const dayOfWeek = checkDate.getDay()

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++
      }
    }

    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)
    return deliveryDate
  }

  // Helper method to format date
  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper method to format delivery date range
  formatDeliveryRange(): string {
    const startDate = new Date(this.orderDate)
    startDate.setDate(startDate.getDate() + 3)

    const endDate = new Date(this.orderDate)
    endDate.setDate(endDate.getDate() + 5)

    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`
  }

  // Helper method to get item count text
  getItemCountText(): string {
    if (this.totalItems === 1) {
      return "1 item"
    }
    return `${this.totalItems} items`
  }

  // Helper method to get delivery address summary
  getDeliveryAddressSummary(): string {
    if (!this.selectedAddress) return "No address selected"

    const address = this.selectedAddress
    const parts = [address.streetAddress, address.city, address.state, address.postalCode, address.phoneNumber].filter(
      (part) => part && part.trim(),
    )

    return parts.join(", ")
  }

  // Payment Methods
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

  /**
   * Enhanced back to payment methods with confirmation
   */
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
        // No per-QR timer, only global timer
      } catch (error) {
        console.error("Error generating QR code:", error)
        this.isProcessing = false
      }
    }, 1500)
  }

  processCreditCardPayment(): void {
    if (this.timerExpired) {
      this.paymentMessage = "Payment time expired. Please try again."
      this.paymentFailed = true
      return
    }
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
        if (this.timer) clearInterval(this.timer)
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
    if (this.timerExpired) {
      this.paymentMessage = "Payment time expired. Please try again."
      this.paymentFailed = true
      return
    }
    if (!this.qrPaymentData || this.isProcessing) return
    if (!this.uploadedImage) {
      this.paymentMessage = "Please upload a payment proof image."
      return
    }
    this.isProcessing = true
    this.cdr.detectChanges()
    if (this.timer) clearInterval(this.timer)
    this.placeOrder("PENDING")
  }

  placeOrder(paymentStatus: "PAID" | "PENDING" | "Payment Failed"): void {
    if (!this.selectedAddress || !this.selectedAddress.id) {
      alert("Please select a delivery address.")
      this.isProcessing = false
      return
    }

    if (this.orderItems.length === 0) {
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
    const orderRequest: OrderRequestDTO = {
      userId: this.currentUserId,
      shippingAddressId: this.selectedAddress.id,
      paymentMethodId: paymentMethodId,
      paymentType: this.selectedPaymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: this.totalAmount,
      shippingFee: this.shippingFee,
      deliveryMethod: this.selectedDeliveryMethod,
      items: this.orderItems.map((item) => ({
        variantId: item.variantId,
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        variantSku: item.variantSku,
        productName: item.name,
        imgPath: item.imgPath,
      })),
    }

    const formData = new FormData()
    formData.append("order", new Blob([JSON.stringify(orderRequest)], { type: "application/json" }))
    if (this.uploadedImage) {
      formData.append("paymentImage", this.uploadedImage)
    }
    this.isProcessing = true

    console.log("order req : ", orderRequest)

    this.orderService.createOrderWithImage(formData).subscribe({
      next: (response) => {
        this.isProcessing = false
        this.paymentSuccess = true
        this.paymentInProgress = false // Payment completed successfully
        this.paymentFailed = false
        this.paymentMessage = `Order placed successfully`

        // Handle both direct response and ResponseEntity wrapper
        const orderData = response.body || response
        this.orderStatus = orderData.paymentStatus || "PENDING"

        // Show SweetAlert on success
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
            // Navigate to order detail page with the order ID
            this.navigateToOrderDetail(orderData.id)
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Navigate to home page to continue shopping
            this.router.navigate(["/customer/home"])
          } else {
            // If user closes the dialog, navigate to order detail after a delay
            setTimeout(() => {
              this.navigateToOrderDetail(orderData.id)
            }, 2000)
          }
        })

        // Only clear cart on successful payment
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

        // Handle different error response formats
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

        // Show error alert
        Swal.fire({
          icon: "error",
          title: "Order Failed",
          text: errorMessage,
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        })

        // DON'T clear cart on payment failure - keep items for retry
        this.cdr.detectChanges()
      },
    })
  }

  // Image Upload and Translation Methods
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
    if (this.shouldBlockNavigation()) {
      Swal.fire({
        title: "Leave Payment Page?",
        text: "You have an incomplete payment. Leaving this page will cancel your order and release reserved stock. Are you sure?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, leave page",
        cancelButtonText: "Stay and complete payment",
      }).then((result) => {
        if (result.isConfirmed) {
          this.paymentInProgress = false
          this.router.navigate(["/customer/cart"])
        }
      })
    } else {
      this.router.navigate(["/customer/home"])
    }
  }

  rollbackReservedStock() {
    this.variantService.rollbackStock(this.orderItems).subscribe({
      next: (res) => {
        console.log("roll back stock list : ", this.orderItems)
        console.log("Stock rolled back successfully:", res)
      },
      error: (err) => {
        console.error("Failed to rollback stock:", err)
      },
    })
  }

  // Helper method to track items by ID
  trackByItemId(index: number, item: any): string {
    return `${item.id}-${item.variantId}`
  }

  // Helper method to handle image errors
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

  // Enhanced timer with modern design
  startGlobalTimer() {
    this.timeLeft = 15 // 10 minutes
    this.timerExpired = false
    this.timerWarning = false
    this.updateTimerDisplay()

    if (this.timer) clearInterval(this.timer)

    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--
        this.updateTimerDisplay()
        this.updateTimerProgress()

        // Warning state for last 2 minutes (120 seconds)
        if (this.timeLeft <= 120 && !this.timerWarning) {
          this.timerWarning = true
          // Show warning notification
          Swal.fire({
            title: "Payment Time Warning!",
            text: "Only 2 minutes left to complete your payment!",
            icon: "warning",
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          })
        }

        this.cdr.detectChanges()
      } else {
        this.timerExpired = true
        this.timerWarning = false
        this.paymentInProgress = false
        clearInterval(this.timer)
        this.handleGlobalTimerExpired()
        this.cdr.detectChanges()
      }
    }, 1000)
  }

  handleGlobalTimerExpired() {
    this.timerExpired = true
    this.paymentInProgress = false
    Swal.fire({
      icon: "error",
      title: "Payment Time Expired",
      text: "Your payment session has expired and reserved stock has been released. Please start a new order.",
      confirmButtonColor: "#d33",
      confirmButtonText: "Return to Shopping",
    }).then(() => {
      this.rollbackReservedStock()
      this.router.navigate(["/customer/home"])
    })
  }

  selectCreditMethod(id: string | number): void {
    this.selectedCreditMethod = id
    this.paymentMessage = ""
  }

  updateTimerDisplay() {
    const min = Math.floor(this.timeLeft / 60)
    const sec = this.timeLeft % 60
    this.timerDisplay = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  updateTimerProgress() {
    this.timerProgressPercent = (this.timeLeft / 600) * 100
  }

  getTimerStatus(): string {
    if (this.timerExpired) return "expired"
    if (this.timerWarning) return "warning"
    return "active"
  }

  getTimerStatusText(): string {
    if (this.timerExpired) return "Expired"
    if (this.timerWarning) return "Urgent"
    return "Active"
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
