import { ChangeDetectorRef, Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { PaymentMethodService } from '../../../../core/services/paymentmethod.service';
import { PaymentMethodDTO } from '../../../../core/models/payment';
import { OrderService } from '../../../../core/services/order.service';
import { OrderRequestDTO } from '../../../../core/models/order.dto';
import { VariantService } from '../../../../core/services/variant.service';
import Swal from 'sweetalert2';

export interface CreditCardPayment {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
  amount: number;
}

export interface QRPayment {
  method: string;
  amount: number;
  qrCode: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  logo?: string;
  qrPath?: string;
}

@Component({
  selector: 'app-payment-accept',
  standalone: false,
  templateUrl: './payment-accept.component.html',
  styleUrl: './payment-accept.component.css'
})
export class PaymentAcceptComponent implements OnInit, OnDestroy {
  // Browser check
  isBrowser: boolean = false;
  L: any; // Leaflet namespace

  // Order Data from navigation
  orderItems: any[] = [];
  selectedAddress: any = null;
  shippingFee: number = 0;
  totalAmount: number = 0;
  itemSubtotal: number = 0;
  currentUserId = 0;

  // User state
  currentUser: any = null;
  isLoggedIn = false;

  // Enhanced Order Summary Properties
  orderNumber: string = '';
  orderDate: Date = new Date();
  estimatedDeliveryDate: Date = new Date();
  totalItems: number = 0;
  deliveryMethod: string = 'Standard Delivery';
  deliveryTimeRange: string = '3-5 business days';
  orderStatus: string = 'Pending Payment';
  customerName: string = '';
  customerEmail: string = '';
  customerPhone: string = '';

  // Payment Properties
  selectedPaymentMethod = '';
  selectedQRMethod = '';
  showCreditCardForm = false;
  showQRCode = false;

  // Available QR Payment Methods (dynamic)
  qrPaymentMethods: PaymentMethod[] = [];

  creditCardData: CreditCardPayment = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    amount: 0,
  };

  qrPaymentData: QRPayment | null = null;
  paymentAmount = 0;
  isProcessing = false;
  paymentSuccess = false;
  paymentMessage = '';

  // QR Code Upload and Translation
  uploadedImage: File | null = null;
  uploadedImageUrl: string | null = null;
  translatedText = '';

  // Timer properties
  timer: any = null;
  timeLeft: number = 10; // 5 minutes in seconds
  timerDisplay: string = '00:10';
  timerExpired: boolean = false;

  stockReserved: boolean = false;

  selectedDeliveryMethod: any = null;

  private subscriptions: Subscription[] = [];

  private paymentMethodIconMap: { [key: string]: string } = {
    kpay: 'fas fa-mobile-alt',
    wavepay: 'fas fa-wave-square',
    ayapay: 'fas fa-university',
    cbpay: 'fas fa-credit-card',
    uabpay: 'fas fa-building',
    okdollar: 'fas fa-dollar-sign',
    onepay: 'fas fa-wallet',
    mpitesan: 'fas fa-money-bill-wave',
  };

  private paymentMethodColorMap: { [key: string]: string } = {
    kpay: '#ff6b35',
    wavepay: '#00d4aa',
    ayapay: '#1e88e5',
    cbpay: '#4caf50',
    uabpay: '#ff9800',
    okdollar: '#9c27b0',
    onepay: '#f44336',
    mpitesan: '#607d8b',
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private cartService: CartService,
    private formBuilder: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object,
    private paymentMethodService: PaymentMethodService,
    private orderService: OrderService,
    private variantService: VariantService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Initialize user ID first (like HeaderComponent)
    this.authService.initializeUserFromToken();
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.id : 0;

    // Listen to auth changes (reactively tracks login/logout)
    this.authService.user$.subscribe((user: any) => {
      this.currentUser = user;
      this.currentUserId = user ? user.id : 0;
      this.isLoggedIn = !!user;
    });

    // Always reset payment UI state
    this.selectedPaymentMethod = '';
    this.selectedQRMethod = '';
    this.showCreditCardForm = false;
    this.showQRCode = false;
    this.paymentSuccess = false;
    this.paymentMessage = '';
    this.qrPaymentData = null;
    this.uploadedImage = null;
    this.uploadedImageUrl = null;
    this.translatedText = '';

    // Initialize enhanced order summary
    this.orderNumber = this.generateOrderNumber();
    this.orderDate = new Date();
    this.estimatedDeliveryDate = new Date();
    this.estimatedDeliveryDate.setDate(this.estimatedDeliveryDate.getDate() + 5);

    // Try to get state from router navigation
    let state = this.router.getCurrentNavigation()?.extras?.state as any;

    // Fallback: if state is undefined, get it from history.state
    if (!state || Object.keys(state).length === 0) {
      state = history.state;
    }

    // NEW: If still no state, try to load from localStorage
    if (!state || Object.keys(state).length === 0) {
      const localData = localStorage.getItem('paymentData');
      if (localData) {
        state = JSON.parse(localData);
      }
    }

    if (state) {
      this.orderItems = state.orderItems || [];
      this.selectedAddress = state.selectedAddress || null;
      this.shippingFee = state.shippingFee || 0;
      this.totalAmount = state.totalAmount || 0;
      this.itemSubtotal = state.itemSubtotal || 0;
      this.uploadedImageUrl = state.uploadedImageUrl || null;
      this.translatedText = state.translatedText || '';
      this.selectedPaymentMethod = state.selectedPaymentMethod || '';
      this.selectedQRMethod = state.selectedQRMethod || '';
      this.creditCardData = state.creditCardData || this.creditCardData;
      this.qrPaymentData = state.qrPaymentData || null;
      this.selectedDeliveryMethod = state.selectedDeliveryMethod || null;
    }

    // Calculate total items
    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0);

    // Get customer information
    this.loadCustomerInformation();

    this.initPaymentAccept();

    // Reserve stock when payment page is loaded
    // if (this.orderItems && this.orderItems.length > 0) {
    //   this.variantService.recudeStock(this.orderItems).subscribe({
    //     next: (res) => {
    //       this.stockReserved = true;
    //       console.log('Stock reserved:', res);
    //     },
    //     error: (err) => {
    //       this.stockReserved = false;
    //       console.error('Failed to reserve stock:', err);
    //     }
    //   });
    // }
  }

  ngOnDestroy(): void {
  if (this.timer) clearInterval(this.timer);
  this.subscriptions.forEach(sub => sub.unsubscribe());

  // Auto rollback if payment not completed
  if (!this.paymentSuccess && this.stockReserved && this.orderItems && this.orderItems.length > 0) {
    this.rollbackReservedStock(); // call rollback
  }
}

  private initPaymentAccept(): void {
    // Remove duplicate user initialization since it's done in ngOnInit
    this.paymentAmount = this.totalAmount;

    // Initialize enhanced order summary data
    this.initializeOrderSummary(this.authService.getCurrentUser());

    // Fetch payment methods dynamically
    this.paymentMethodService.getAllPaymentMethods().subscribe({
      next: (methods: PaymentMethodDTO[]) => {
        this.qrPaymentMethods = (methods || [])
          .filter(m => m.status === 1) // Only active methods
          .map(m => ({
            id: m.id ? m.id.toString() : m.methodName.toLowerCase().replace(/\s/g, ''),
            name: m.methodName,
            icon: this.paymentMethodIconMap[m.methodName.toLowerCase()] || 'fas fa-qrcode',
            color: this.paymentMethodColorMap[m.methodName.toLowerCase()] || '#007bff',
            description: m.description || '',
            logo: m.logo || '',
            qrPath: m.qrPath || '',
          }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load payment methods:', err);
        this.qrPaymentMethods = [];
      }
    });
  }

  private initializeOrderSummary(user: any): void {
    // Generate order number
    this.orderNumber = this.generateOrderNumber();
    
    // Set order date
    this.orderDate = new Date();
    
    // Calculate estimated delivery date (3-5 business days from now)
    this.estimatedDeliveryDate = this.calculateEstimatedDeliveryDate();
    
    // Calculate total items
    this.totalItems = this.orderItems.reduce((total, item) => total + item.quantity, 0);
    
    // Set customer information
    if (user) {
      this.customerName = user.name || 'Guest User';
      this.customerEmail = user.email || '';
      this.customerPhone = user.phone || '';
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  private calculateEstimatedDeliveryDate(): Date {
    const deliveryDate = new Date();
    let businessDays = 0;
    let daysToAdd = 0;
    
    // Add 3-5 business days (excluding weekends)
    while (businessDays < 4) { // 4 business days (3-5 range)
      daysToAdd++;
      const checkDate = new Date(deliveryDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      const dayOfWeek = checkDate.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate;
  }

  // Helper method to format date
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to format delivery date range
  formatDeliveryRange(): string {
    const startDate = new Date(this.orderDate);
    startDate.setDate(startDate.getDate() + 3);
    
    const endDate = new Date(this.orderDate);
    endDate.setDate(endDate.getDate() + 5);
    
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  // Helper method to get item count text
  getItemCountText(): string {
    if (this.totalItems === 1) {
      return '1 item';
    }
    return `${this.totalItems} items`;
  }

  // Helper method to get delivery address summary
  getDeliveryAddressSummary(): string {
    if (!this.selectedAddress) return 'No address selected';
    
    const address = this.selectedAddress;
    const parts = [
      address.streetAddress,
      address.city,
      address.state,
      address.postalCode
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  // Payment Methods
  selectPaymentMethod(method: string): void {
    if (!method) return;
    this.selectedPaymentMethod = method;
    this.showCreditCardForm = method === 'credit-card';
    this.showQRCode = method === 'qr-payment';
    this.paymentSuccess = false;
    this.paymentMessage = '';
    if (method !== 'qr-payment') {
      this.selectedQRMethod = '';
    }
  }

  /**
   * Fix: Back to Payment Methods from QR selection
   */
  backToPaymentMethods(): void {
    this.selectedPaymentMethod = '';
    this.selectedQRMethod = '';
    this.showQRCode = false;
    this.showCreditCardForm = false;
    this.paymentSuccess = false;
    this.paymentMessage = '';
  }

  selectQRMethod(methodId: string): void {
    if (!methodId) return;
    this.selectedQRMethod = methodId;
    this.generateQRCode(methodId);
  }

  generateQRCode(method: string): void {
    if (!method || this.isProcessing) return;
    this.isProcessing = true;
    setTimeout(() => {
      try {
        this.qrPaymentData = {
          method: method,
          amount: this.paymentAmount,
          qrCode: `${method.toUpperCase()}_QR_CODE_${Date.now()}_${this.paymentAmount}_MMK`,
        };
        this.isProcessing = false;
        this.cdr.detectChanges();
        this.startTimer();
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.isProcessing = false;
      }
    }, 1500);
  }

  processCreditCardPayment(): void {
    if (!this.isValidCreditCard()) {
      this.paymentMessage = 'Please fill in all required fields correctly.';
      return;
    }
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.creditCardData.amount = this.paymentAmount;
    setTimeout(() => {
      try {
        this.isProcessing = false;
        if (this.timer) clearInterval(this.timer);
        this.placeOrder('PENDING');
      } catch (error) {
        console.error('Error processing payment:', error);
        this.isProcessing = false;
        this.paymentMessage = 'An unexpected error occurred during payment processing.';
        this.paymentSuccess = false;
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  verifyQRPayment(): void {
    if (!this.qrPaymentData || this.isProcessing) return;
    
    this.isProcessing = true;
    this.cdr.detectChanges();
    if (this.timer) clearInterval(this.timer);
    this.placeOrder('PENDING');
  }

  placeOrder(paymentStatus: 'PAID' | 'PENDING' | 'Payment Failed'): void {
    if (!this.selectedAddress || !this.selectedAddress.id) {
      alert('Please select a delivery address.');
      this.isProcessing = false;
      return;
    }

    if (this.orderItems.length === 0) {
      alert('Your cart is empty.');
      this.isProcessing = false;
      return;
    }

    const orderRequest: OrderRequestDTO = {
      userId: this.currentUserId,
      shippingAddressId: this.selectedAddress.id,
      paymentMethodId: this.selectedQRMethod ? Number(this.selectedQRMethod) : null,
      paymentType: this.selectedPaymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: this.totalAmount,
      shippingFee: this.shippingFee,
      deliveryMethod: this.selectedDeliveryMethod,
      items: this.orderItems.map(item => ({
        variantId: item.variantId,
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        variantSku: item.variantSku,
        productName: item.name,
        imgPath: item.imgPath
      }))
    };

    const formData = new FormData();
    formData.append('order', new Blob([JSON.stringify(orderRequest)], { type: 'application/json' }));
    if (this.uploadedImage) {
      formData.append('paymentImage', this.uploadedImage);
    }
    this.isProcessing = true;

    console.log("order req : ", orderRequest);
    

    this.orderService.createOrderWithImage(formData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.paymentSuccess = true;
        this.paymentMessage = `Order placed successfully`;
        this.orderStatus = response.paymentStatus;

        // Show SweetAlert on success
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: `Your order #${response.trackingNumber || response.id} has been placed successfully. You will receive a confirmation email shortly.`,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'View Order Details',
          showCancelButton: true,
          cancelButtonText: 'Continue Shopping',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate to order detail page with the order ID
            this.navigateToOrderDetail(response.id);
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Navigate to home page to continue shopping
            this.router.navigate(['/customer/home']);
          } else {
            // If user closes the dialog, navigate to order detail after a delay
            setTimeout(() => {
              this.navigateToOrderDetail(response.id);
            }, 2000);
          }
        });

        this.clearCartAfterOrder();
        this.showQRCode = false;
        this.uploadedImage = null;
        this.uploadedImageUrl = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isProcessing = false;
        this.paymentSuccess = false;
        this.paymentMessage = `Order failed: ${err?.error}`;
        this.orderStatus = 'Payment Failed';
        this.cdr.detectChanges();
      }
    });
  }

  // Image Upload and Translation Methods
  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.uploadedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImageUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  translateImage(): void {
    if (!this.uploadedImage) return;
    this.translatedText = '';
    setTimeout(() => {
      try {
        this.translatedText = `Translated QR Code Information:\n\nPayment Method: ${this.getPaymentMethodName(this.selectedQRMethod)}\nAmount: ${this.paymentAmount.toLocaleString()} MMK\nMerchant: Sample Store\nTransaction ID: ${Date.now()}\nStatus: Ready for Payment\n\nPlease confirm the payment in your mobile app.`;
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error translating image:', error);
      }
    }, 2000);
  }

  clearUploadedImage(): void {
    this.uploadedImage = null;
    this.uploadedImageUrl = null;
    this.translatedText = '';
  }

  isValidCreditCard(): boolean {
    try {
      return !!(
        this.creditCardData.cardNumber &&
        this.creditCardData.expiryDate &&
        this.creditCardData.cvv &&
        this.creditCardData.cardHolderName &&
        this.creditCardData.cardNumber.replace(/\s/g, '').length >= 16 &&
        this.creditCardData.cvv.length >= 3
      );
    } catch (error) {
      console.error('Error validating credit card:', error);
      return false;
    }
  }

  formatCardNumber(event: any): void {
    try {
      if (!event?.target?.value) return;
      const value = event.target.value.replace(/\s/g, '');
      const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
      this.creditCardData.cardNumber = formattedValue;
    } catch (error) {
      console.error('Error formatting card number:', error);
    }
  }

  formatExpiryDate(event: any): void {
    try {
      if (!event?.target?.value) return;
      let value = event.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      this.creditCardData.expiryDate = value;
    } catch (error) {
      console.error('Error formatting expiry date:', error);
    }
  }

  getPaymentMethodName(method: string): string {
    if (!method) return '';
    const qrMethod = this.qrPaymentMethods.find((m) => m.id === method);
    if (qrMethod) return qrMethod.name;
    switch (method) {
      case 'credit-card':
        return 'Credit Card';
      default:
        return method;
    }
  }

  getSelectedQRMethod(): PaymentMethod | null {
    return this.qrPaymentMethods.find((m) => m.id === this.selectedQRMethod) || null;
  }

  trackByMethodId(index: number, method: PaymentMethod): string {
    return method.id;
  }

  private clearCartAfterOrder(): void {
    this.cartService.clearCart();
    localStorage.removeItem('paymentData');
  }

  goBackToOrderManagement(): void {
    this.rollbackReservedStock();
    this.router.navigate(['/customer/home'], {
      state: {
        orderItems: this.orderItems,
        selectedAddress: this.selectedAddress,
        shippingFee: this.shippingFee,
        totalAmount: this.totalAmount,
        itemSubtotal: this.itemSubtotal,
        uploadedImageUrl: this.uploadedImageUrl,
        translatedText: this.translatedText,
        selectedPaymentMethod: this.selectedPaymentMethod,
        selectedQRMethod: this.selectedQRMethod,
        creditCardData: this.creditCardData,
        qrPaymentData: this.qrPaymentData,
        selectedDeliveryMethod: this.selectedDeliveryMethod
      }
    });
  }

  // Timer methods
  startTimer() {
    this.timeLeft = 10;
    this.timerExpired = false;
    this.updateTimerDisplay();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateTimerDisplay();
        this.cdr.detectChanges();
      } else {
        this.timerExpired = true;
        clearInterval(this.timer);
        this.handleTimerExpired();
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    this.timerDisplay = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  handleTimerExpired() {
    this.paymentMessage = 'QR code expired. Your reserved stock has been released.';
    this.paymentSuccess = false;
    this.orderStatus = 'Payment Failed';
    this.rollbackReservedStock();
  }

 rollbackReservedStock() {
  
  this.variantService.rollbackStock(this.orderItems).subscribe({
    next: (res) => {
      console.log("roll back stock list : ", this.orderItems);
      console.log('Stock rolled AHHHHHH :', res);
    },
    error: (err) => {
      console.error('Failed to rollback stock:', err);
    }
  });
}

  // Helper method to track items by ID
  trackByItemId(index: number, item: any): string {
    return `${item.id}-${item.variantId}`;
  }

  // Helper method to handle image errors
  onImageError(event: any): void {
    event.target.src = 'assets/img/default-product.jpg';
  }

  private loadCustomerInformation(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.customerName = user.name || 'Guest User';
      this.customerEmail = user.email || '';
      this.customerPhone = user.phone || '';
    }
  }

  getDeliveryMethodIconClass(): string {
    if (!this.selectedDeliveryMethod) return 'fas fa-shipping-fast';
    const name = this.selectedDeliveryMethod.name?.toLowerCase() || '';
    if (name.includes('bike')) return 'fas fa-bicycle';
    if (name.includes('car')) return 'fas fa-car';
    if (name.includes('truck')) return 'fas fa-truck';
    return 'fas fa-shipping-fast';
  }

  private navigateToOrderDetail(orderId: number): void {
    this.router.navigate(['/customer/orderDetail', orderId]);
  }

}
