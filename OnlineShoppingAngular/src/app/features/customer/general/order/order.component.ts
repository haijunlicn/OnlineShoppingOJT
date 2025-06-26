import { Component, OnInit } from '@angular/core';
export interface UserAddress {
  id: number
  address: string
  city: string
  latitude: number
  longitude: number
  township: string
  zipcode: string
  country: string
  created_date: Date
  updated_date: Date
  user_id: number
}

export interface CreditCardPayment {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardHolderName: string
  amount: number
}

export interface QRPayment {
  method: "kpay" | "wavepay"
  amount: number
  qrCode: string
}
@Component({
  selector: 'app-order',
  standalone: false,
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit {
  // Location Management Properties
  addresses: UserAddress[] = [
    {
      id: 1,
      address: "No. 123, Pyay Road, Kamayut Township",
      city: "Yangon",
      latitude: 16.8409,
      longitude: 96.1735,
      township: "Kamayut",
      zipcode: "11041",
      country: "Myanmar",
      created_date: new Date("2024-01-15"),
      updated_date: new Date("2024-01-15"),
      user_id: 1,
    },
    {
      id: 2,
      address: "Building 45, Inya Road, Bahan Township",
      city: "Yangon",
      latitude: 16.8156,
      longitude: 96.1511,
      township: "Bahan",
      zipcode: "11201",
      country: "Myanmar",
      created_date: new Date("2024-02-10"),
      updated_date: new Date("2024-02-10"),
      user_id: 1,
    },
    {
      id: 3,
      address: "No. 67, Strand Road, Pabedan Township",
      city: "Yangon",
      latitude: 16.7834,
      longitude: 96.15,
      township: "Pabedan",
      zipcode: "11141",
      country: "Myanmar",
      created_date: new Date("2024-03-05"),
      updated_date: new Date("2024-03-05"),
      user_id: 1,
    },
  ]

  selectedAddress: UserAddress | null = null
  showAddressForm = false
  isEditing = false
  currentUserId = 1

  newAddress: UserAddress = {
    id: 0,
    address: "",
    city: "",
    latitude: 0,
    longitude: 0,
    township: "",
    zipcode: "",
    country: "Myanmar",
    created_date: new Date(),
    updated_date: new Date(),
    user_id: 1,
  }

  // Payment Properties
  selectedPaymentMethod = ""
  showCreditCardForm = false
  showQRCode = false

  creditCardData: CreditCardPayment = {
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
    amount: 0,
  }

  qrPaymentData: QRPayment | null = null
  paymentAmount = 50000 // Default amount in MMK
  isProcessing = false
  paymentSuccess = false
  paymentMessage = ""

  // Static QR codes for demo
  staticQRCodes = {
    kpay: "KPAY_QR_CODE_12345_50000_MMK",
    wavepay: "WAVE_QR_CODE_67890_50000_MMK",
  }

  ngOnInit(): void {
    // Set first address as selected by default
    if (this.addresses.length > 0) {
      this.selectedAddress = this.addresses[0]
    }
  }

  // Location Management Methods
  selectAddress(address: UserAddress): void {
    this.selectedAddress = address
  }

  showAddForm(): void {
    this.showAddressForm = true
    this.isEditing = false
    this.resetAddressForm()
  }

  editAddress(address: UserAddress): void {
    this.showAddressForm = true
    this.isEditing = true
    this.newAddress = { ...address }
  }

  saveAddress(): void {
    if (this.isEditing) {
      // Update existing address
      const index = this.addresses.findIndex((addr) => addr.id === this.newAddress.id)
      if (index !== -1) {
        this.newAddress.updated_date = new Date()
        this.addresses[index] = { ...this.newAddress }

        // Update selected address if it's the one being edited
        if (this.selectedAddress?.id === this.newAddress.id) {
          this.selectedAddress = { ...this.newAddress }
        }
      }
    } else {
      // Add new address
      const newId = Math.max(...this.addresses.map((addr) => addr.id)) + 1
      const addressToAdd: UserAddress = {
        ...this.newAddress,
        id: newId,
        created_date: new Date(),
        updated_date: new Date(),
      }
      this.addresses.push(addressToAdd)
    }
    this.showAddressForm = false
    this.resetAddressForm()
  }

  deleteAddress(id: number): void {
    if (confirm("Are you sure you want to delete this address?")) {
      this.addresses = this.addresses.filter((addr) => addr.id !== id)

      // If deleted address was selected, select first available address
      if (this.selectedAddress?.id === id) {
        this.selectedAddress = this.addresses.length > 0 ? this.addresses[0] : null
      }
    }
  }

  cancelAddressForm(): void {
    this.showAddressForm = false
    this.resetAddressForm()
  }

  private resetAddressForm(): void {
    this.newAddress = {
      id: 0,
      address: "",
      city: "",
      latitude: 0,
      longitude: 0,
      township: "",
      zipcode: "",
      country: "Myanmar",
      created_date: new Date(),
      updated_date: new Date(),
      user_id: this.currentUserId,
    }
  }

  // Payment Methods
  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method
    this.showCreditCardForm = method === "credit-card"
    this.showQRCode = false
    this.paymentSuccess = false
    this.paymentMessage = ""

    if (method === "kpay" || method === "wavepay") {
      this.generateQRCode(method as "kpay" | "wavepay")
    }
  }

  generateQRCode(method: "kpay" | "wavepay"): void {
    this.isProcessing = true

    // Simulate API call delay
    setTimeout(() => {
      this.qrPaymentData = {
        method: method,
        amount: this.paymentAmount,
        qrCode: this.staticQRCodes[method],
      }
      this.showQRCode = true
      this.isProcessing = false
    }, 1500)
  }

  processCreditCardPayment(): void {
    if (!this.isValidCreditCard()) {
      this.paymentMessage = "Please fill in all required fields correctly."
      return
    }

    this.isProcessing = true
    this.creditCardData.amount = this.paymentAmount

    // Simulate payment processing
    setTimeout(() => {
      this.isProcessing = false

      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.2 // 80% success rate

      if (isSuccess) {
        this.paymentSuccess = true
        this.paymentMessage = `Payment of ${this.paymentAmount.toLocaleString()} MMK processed successfully! Transaction ID: CC${Date.now()}`
        this.resetPaymentForms()
      } else {
        this.paymentSuccess = false
        this.paymentMessage = "Payment failed. Please check your card details and try again."
      }
    }, 2000)
  }

  verifyQRPayment(): void {
    if (!this.qrPaymentData) return

    this.isProcessing = true

    // Simulate payment verification
    setTimeout(() => {
      this.isProcessing = false

      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.1 // 90% success rate

      if (isSuccess) {
        this.paymentSuccess = true
        this.paymentMessage = `${this.qrPaymentData?.method.toUpperCase()} payment of ${this.paymentAmount.toLocaleString()} MMK completed successfully! Transaction ID: QR${Date.now()}`
        this.showQRCode = false
        this.qrPaymentData = null
        this.selectedPaymentMethod = ""
      } else {
        this.paymentSuccess = false
        this.paymentMessage = "Payment verification failed. Please try again or contact support."
      }
    }, 2000)
  }

  isValidCreditCard(): boolean {
    return !!(
      this.creditCardData.cardNumber &&
      this.creditCardData.expiryDate &&
      this.creditCardData.cvv &&
      this.creditCardData.cardHolderName &&
      this.creditCardData.cardNumber.replace(/\s/g, "").length >= 16 &&
      this.creditCardData.cvv.length >= 3
    )
  }

  formatCardNumber(event: any): void {
    const value = event.target.value.replace(/\s/g, "")
    const formattedValue = value.replace(/(.{4})/g, "$1 ").trim()
    this.creditCardData.cardNumber = formattedValue
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\D/g, "")
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4)
    }
    this.creditCardData.expiryDate = value
  }

  resetPaymentForms(): void {
    this.creditCardData = {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "",
      amount: 0,
    }
    this.selectedPaymentMethod = ""
    this.showCreditCardForm = false
    this.showQRCode = false
    this.qrPaymentData = null
  }

  // Utility method to get payment method display name
  getPaymentMethodName(method: string): string {
    switch (method) {
      case "kpay":
        return "KPay"
      case "wavepay":
        return "Wave Pay"
      case "credit-card":
        return "Credit Card"
      default:
        return method
    }
  }
}
