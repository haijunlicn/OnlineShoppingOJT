import { ChangeDetectorRef, Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LocationDto } from '../../../../core/models/location-dto';
import { LocationService } from '../../../../core/services/location.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../core/models/cart.model';

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
}

@Component({
  selector: 'app-order-management',
  standalone: false,
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  // Browser check
  isBrowser: boolean = false;
  L: any; // Leaflet namespace

  // Location Management Properties
  addresses: LocationDto[] = [];
  selectedAddress: LocationDto | null = null;
  showAddressForm = false;
  showAddressList = false;
  isEditing = false;
  currentUserId = 0;
  newAddress: LocationDto = this.getEmptyAddress();

  // Map and Location Properties
  map: any;
  marker: any;
  addressForm: FormGroup;
  searchControl: FormControl;
  currentLatLng: any = null;
  isLoading = false;

  // Payment Properties
  selectedPaymentMethod = '';
  selectedQRMethod = '';
  showCreditCardForm = false;
  showQRCode = false;

  // Available QR Payment Methods
  qrPaymentMethods: PaymentMethod[] = [
    { id: 'kpay', name: 'KPay', icon: 'fas fa-mobile-alt', color: '#ff6b35', description: 'KBZ Bank Digital Wallet' },
    { id: 'wavepay', name: 'Wave Pay', icon: 'fas fa-wave-square', color: '#00d4aa', description: 'Telenor Digital Payment' },
    { id: 'ayapay', name: 'AYA Pay', icon: 'fas fa-university', color: '#1e88e5', description: 'AYA Bank Digital Wallet' },
    { id: 'cbpay', name: 'CB Pay', icon: 'fas fa-credit-card', color: '#4caf50', description: 'CB Bank Mobile Payment' },
    { id: 'uabpay', name: 'UAB Pay', icon: 'fas fa-building', color: '#ff9800', description: 'United Amara Bank Pay' },
    { id: 'okdollar', name: 'OK Dollar', icon: 'fas fa-dollar-sign', color: '#9c27b0', description: 'OK Dollar Digital Payment' },
    { id: 'onepay', name: 'OnePay', icon: 'fas fa-wallet', color: '#f44336', description: 'One Stop Payment Solution' },
    { id: 'mpitesan', name: 'MPitesan', icon: 'fas fa-money-bill-wave', color: '#607d8b', description: 'Myanmar Payment Integration' },
  ];

  creditCardData: CreditCardPayment = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    amount: 0,
  };

  qrPaymentData: QRPayment | null = null;
  paymentAmount = 0; // Will be set from cart total
  isProcessing = false;
  paymentSuccess = false;
  paymentMessage = '';

  // QR Code Upload and Translation
  uploadedImage: File | null = null;
  uploadedImageUrl: string | null = null;
  translatedText = '';
  isTranslating = false;

  // Static QR codes for demo
  staticQRCodes: { [key: string]: string } = {
    kpay: 'KPAY_QR_CODE_12345_85000_MMK',
    wavepay: 'WAVE_QR_CODE_67890_85000_MMK',
    ayapay: 'AYAPAY_QR_CODE_11111_85000_MMK',
    cbpay: 'CBPAY_QR_CODE_22222_85000_MMK',
    uabpay: 'UABPAY_QR_CODE_33333_85000_MMK',
    okdollar: 'OKDOLLAR_QR_CODE_44444_85000_MMK',
    onepay: 'ONEPAY_QR_CODE_55555_85000_MMK',
    mpitesan: 'MPITESAN_QR_CODE_66666_85000_MMK',
  };

  // Order Summary Properties - Now using cart data
  orderItems: any[] = [];
  itemSubtotal = 0;
  shippingFee = 0;
  totalAmount = 0;

  // Store location (Yangon center) - you can change this to your actual store location
  private readonly STORE_LOCATION = {
    lat: 16.8409, // Yangon center latitude
    lng: 96.1735  // Yangon center longitude
  };

  // Dynamic shipping rate calculation based on distance
  private readonly BASE_SHIPPING_RATE = 500; // Base rate in MMK
  private readonly RATE_PER_KM = 50; // Additional rate per kilometer
  private readonly MAX_SHIPPING_RATE = 6000; // Maximum shipping rate

  private subscriptions: Subscription[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private formBuilder: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    this.addressForm = this.formBuilder.group({
      address: ['', Validators.required],
      township: [''],
      city: ['', Validators.required],
      zipCode: [''],
      country: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required]
    });

    this.searchControl = new FormControl('');
  }

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.id : 0;
    this.loadAddresses();
    this.loadCartData();
    this.resetPaymentForms();

    if (this.isBrowser) {
      this.L = await import('leaflet');
      this.setupCustomMarkerIcon();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupCustomMarkerIcon(): void {
    const defaultIcon = this.L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    this.L.Marker.prototype.options.icon = defaultIcon;
  }

  private loadCartData(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as any;
      if (state.cartItems && state.cartItems.length > 0) {
        // Convert cart items to order items format
        this.orderItems = state.cartItems.map((item: CartItem) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          variantSku: item.variantSku,
          imgPath: item.imgPath
        }));
        
        this.itemSubtotal = state.cartTotal || this.calculateSubtotal();
        this.totalAmount = this.itemSubtotal;
        this.paymentAmount = this.totalAmount;
        
        console.log('Cart data loaded successfully:', {
          items: this.orderItems.length,
          subtotal: this.itemSubtotal,
          total: this.totalAmount
        });
      } else {
        // No cart items, redirect back to cart
        alert('No items in cart. Please add items before proceeding to checkout.');
        this.router.navigate(['/customer/cart']);
        return;
      }
    } else {
      // No navigation state, check if there are items in cart service
      const currentCart = this.cartService.getCart();
      if (currentCart && currentCart.length > 0) {
        // Use current cart data
        this.orderItems = currentCart.map((item: CartItem) => ({
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          variantSku: item.variantSku,
          imgPath: item.imgPath
        }));
        
        this.itemSubtotal = this.calculateSubtotal();
        this.totalAmount = this.itemSubtotal;
        this.paymentAmount = this.totalAmount;
        
        console.log('Using current cart data:', {
          items: this.orderItems.length,
          subtotal: this.itemSubtotal,
          total: this.totalAmount
        });
      } else {
        // No cart data available, redirect back to cart
        alert('No items in cart. Please add items before proceeding to checkout.');
        this.router.navigate(['/customer/cart']);
        return;
      }
    }
  }

  private calculateSubtotal(): number {
    return this.orderItems.reduce((total, item) => total + item.total, 0);
  }

  private getEmptyAddress(): LocationDto {
    return {
      id: 0,
      address: '',
      city: '',
      lat: 0,
      lng: 0,
      township: '',
      zipCode: '',
      country: 'Myanmar',
      userId: this.currentUserId,
    };
  }

  loadAddresses(): void {
    this.locationService.getUserLocations(this.currentUserId).subscribe({
      next: (data: LocationDto[]) => {
        this.addresses = data;
        if (this.addresses.length > 0) {
          this.selectedAddress = { ...this.addresses[0] };
          this.calculateShippingFee();
        } else {
          this.selectedAddress = null;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading addresses:', err);
      },
    });
  }

  // Address Form Methods
  showAddForm(): void {
    this.showAddressForm = true;
    this.isEditing = false;
    this.newAddress = this.getEmptyAddress();
    this.addressForm.reset();
    this.currentLatLng = null;
    
    // Initialize map after modal is shown
    setTimeout(() => {
      if (this.isBrowser) {
        this.initMap();
      }
    }, 100);
  }

  editAddress(address: LocationDto): void {
    if (!address) return;
    this.showAddressForm = true;
    this.isEditing = true;
    this.newAddress = { ...address };
    this.addressForm.patchValue(address);
    
    // Initialize map and set marker
    setTimeout(() => {
      if (this.isBrowser) {
        this.initMap();
        if (address.lat && address.lng) {
          const latlng = this.L.latLng(address.lat, address.lng);
          this.addMarker(latlng);
        }
      }
    }, 100);
  }

  initMap(): void {
    if (!this.isBrowser || !this.L) return;

    // Remove existing map if any
    if (this.map) {
      this.map.remove();
    }

    this.map = this.L.map('address-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([20, 96], 5); // Myanmar center

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.addMarker(e.latlng);
      this.reverseGeocodeLocation(e.latlng.lat, e.latlng.lng);
    });

    // Fix map rendering
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  addMarker(latlng: any): void {
    if (!this.isBrowser || !this.L) return;

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = this.L.marker(latlng).addTo(this.map);
    this.currentLatLng = latlng;

    // Update form lat/lng without triggering valueChanges
    this.addressForm.patchValue({
      lat: latlng.lat,
      lng: latlng.lng
    }, { emitEvent: false });
  }

  autoLocate(): void {
    if (!this.isBrowser) return;
    
    this.isLoading = true;
    const geoSub = this.locationService.getCurrentPosition().subscribe({
      next: (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latlng = this.L.latLng(lat, lng);
        this.map.setView(latlng, 15);
        this.addMarker(latlng);
        this.reverseGeocodeLocation(lat, lng);
        this.isLoading = false;
      },
      error: () => {
        alert('Unable to retrieve your location.');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(geoSub);
  }

  reverseGeocodeLocation(lat: number, lng: number): void {
    const geocodeSub = this.locationService.reverseGeocode(lat, lng).subscribe({
      next: (data) => this.populateAddressFields(data),
      error: (error) => console.error('Reverse geocoding error:', error)
    });
    this.subscriptions.push(geocodeSub);
  }

  populateAddressFields(data: any): void {
    const address = data.address || {};
    const streetAddress = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean).join(' ');

    const township =
      address.township ||
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.county ||
      '';

    this.addressForm.patchValue({
      address: streetAddress || data.display_name?.split(',')[0] || '',
      township: township,
      city: address.city || address.town || address.village || '',
      zipCode: address.postcode || '',
      country: address.country || ''
    });
  }

  onSearch(): void {
    const query = this.searchControl.value?.trim();
    if (!query) {
      alert('Please enter a location to search.');
      return;
    }

    this.isLoading = true;

    const searchSub = this.locationService.geocode(query).subscribe({
      next: (results: any[]) => {
        if (results.length === 0) {
          alert('Location not found.');
          this.isLoading = false;
          return;
        }
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        const latlng = this.L.latLng(lat, lon);
        this.map.setView(latlng, 15);
        this.addMarker(latlng);
        this.populateAddressFields(firstResult);
        this.isLoading = false;
      },
      error: () => {
        alert('Failed to search location.');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(searchSub);
  }

  saveAddress(): void {
    if (!this.currentLatLng) {
      alert('Please select a location first!');
      return;
    }

    if (this.addressForm.invalid) {
      alert('Please fill in all required fields!');
      return;
    }

    const location: LocationDto = {
      lat: this.currentLatLng.lat,
      lng: this.currentLatLng.lng,
      address: this.addressForm.get('address')?.value || '',
      township: this.addressForm.get('township')?.value || '',
      city: this.addressForm.get('city')?.value || '',
      zipCode: String(this.addressForm.get('zipCode')?.value) || '',
      country: this.addressForm.get('country')?.value || '',
      userId: this.currentUserId
    };

    if (this.isEditing && this.newAddress.id) {
      location.id = this.newAddress.id;
      const updateSub = this.locationService.updateLocation(location).subscribe({
        next: () => {
          alert('Address updated successfully!');
          this.loadAddresses();
          this.showAddressForm = false;
          this.cleanupMap();
        },
        error: () => alert('Failed to update address.')
      });
      this.subscriptions.push(updateSub);
    } else {
      const saveSub = this.locationService.saveLocation(location).subscribe({
        next: () => {
          alert('Address saved successfully!');
          this.loadAddresses();
          this.showAddressForm = false;
          this.cleanupMap();
        },
        error: () => alert('Failed to save address.')
      });
      this.subscriptions.push(saveSub);
    }
  }

  deleteAddress(id: number): void {
    if (!id || !confirm('Are you sure you want to delete this address?')) return;
    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.loadAddresses();
        alert('Address deleted successfully.');
      },
      error: (err: any) => {
        console.error('Error deleting address:', err);
        alert('Failed to delete address.');
      },
    });
  }

  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.newAddress = this.getEmptyAddress();
    this.addressForm.reset();
    this.currentLatLng = null;
    this.cleanupMap();
  }

  private cleanupMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.marker) {
      this.marker = null;
    }
  }

  // New method to toggle address list
  toggleAddressList(): void {
    this.showAddressList = !this.showAddressList;
  }

  // New method to select address and close dropdown
  selectAddressAndClose(address: LocationDto): void {
    this.selectAddress(address);
    this.showAddressList = false;
  }

  // Location Management Methods
  selectAddress(address: LocationDto): void {
    if (!address) return;
    this.selectedAddress = { ...address };
    this.calculateShippingFee();
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
          qrCode: this.staticQRCodes[method] || `${method.toUpperCase()}_QR_CODE_${Date.now()}_${this.paymentAmount}_MMK`,
        };
        this.isProcessing = false;
        this.cdr.detectChanges();
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
        const isSuccess = Math.random() > 0.2;
        if (isSuccess) {
          this.paymentSuccess = true;
          this.paymentMessage = `Payment of ${this.paymentAmount.toLocaleString()} MMK processed successfully! Transaction ID: CC${Date.now()}`;
          this.resetPaymentForms();
          // Clear cart after successful payment
          this.clearCartAfterOrder();
        } else {
          this.paymentSuccess = false;
          this.paymentMessage = 'Payment failed. Please check your card details and try again.';
        }
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error processing payment:', error);
        this.isProcessing = false;
      }
    }, 2000);
  }

  verifyQRPayment(): void {
    if (!this.qrPaymentData || this.isProcessing) return;
    this.isProcessing = true;
    setTimeout(() => {
      try {
        this.isProcessing = false;
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
          this.paymentSuccess = true;
          this.paymentMessage = `${this.getPaymentMethodName(this.qrPaymentData?.method || '')} payment of ${this.paymentAmount.toLocaleString()} MMK completed successfully! Transaction ID: QR${Date.now()}`;
          this.showQRCode = false;
          this.qrPaymentData = null;
          this.selectedPaymentMethod = '';
          this.selectedQRMethod = '';
          // Clear cart after successful payment
          this.clearCartAfterOrder();
        } else {
          this.paymentSuccess = false;
          this.paymentMessage = 'Payment verification failed. Please try again or contact support.';
        }
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error verifying payment:', error);
        this.isProcessing = false;
      }
    }, 2000);
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
    this.isTranslating = true;
    this.translatedText = '';
    setTimeout(() => {
      try {
        this.translatedText = `Translated QR Code Information:\n\nPayment Method: ${this.getPaymentMethodName(this.selectedQRMethod)}\nAmount: ${this.paymentAmount.toLocaleString()} MMK\nMerchant: Sample Store\nTransaction ID: ${Date.now()}\nStatus: Ready for Payment\n\nPlease confirm the payment in your mobile app.`;
        this.isTranslating = false;
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error translating image:', error);
        this.isTranslating = false;
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

  resetPaymentForms(): void {
    try {
      this.creditCardData = {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardHolderName: '',
        amount: 0,
      };
      this.selectedPaymentMethod = '';
      this.selectedQRMethod = '';
      this.showCreditCardForm = false;
      this.showQRCode = false;
      this.qrPaymentData = null;
      this.clearUploadedImage();
    } catch (error) {
      console.error('Error resetting payment forms:', error);
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

  trackByAddressId(index: number, address: LocationDto): number | undefined {
    return address.id;
  }

  trackByMethodId(index: number, method: PaymentMethod): string {
    return method.id;
  }

  calculateShippingFee(): void {
    if (this.selectedAddress) {
      const destLat = this.selectedAddress.lat;
      const destLng = this.selectedAddress.lng;

      // Haversine formula
      const toRad = (v: number) => v * Math.PI / 180;
      const R = 6371; // Earth radius in km
      const dLat = toRad(destLat - this.STORE_LOCATION.lat);
      const dLng = toRad(destLng - this.STORE_LOCATION.lng);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(this.STORE_LOCATION.lat)) * Math.cos(toRad(destLat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      let shippingFee = this.BASE_SHIPPING_RATE + this.RATE_PER_KM * distance;
      if (shippingFee > this.MAX_SHIPPING_RATE) {
        shippingFee = this.MAX_SHIPPING_RATE;
      }
      
      // Round to nearest 100 MMK for cleaner display
      this.shippingFee = Math.round(shippingFee / 100) * 100;
      
      this.totalAmount = this.itemSubtotal + this.shippingFee;
      this.paymentAmount = this.totalAmount;
    }
  }

  goBackToCart(): void {
    this.router.navigate(['/customer/cart']);
  }

  goToHome(): void {
    this.router.navigate(['/customer/home']);
  }

  private clearCartAfterOrder(): void {
    // Clear the cart after successful order
    this.cartService.clearCart();
    console.log('Order completed successfully! Cart cleared.');
    // Navigate to home page after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/customer/home']);
    }, 3000);
  }

  getEstimatedDeliveryTime(): string {
    if (!this.selectedAddress) return '';

    const destLat = this.selectedAddress.lat;
    const destLng = this.selectedAddress.lng;

    // Haversine formula
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(destLat - this.STORE_LOCATION.lat);
    const dLng = toRad(destLng - this.STORE_LOCATION.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(this.STORE_LOCATION.lat)) * Math.cos(toRad(destLat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Example logic:
    // - < 50km: 1-2 days
    // - 50-300km: 2-4 days
    // - 300-1000km: 4-7 days
    // - >1000km: 1-2 weeks

    if (distance < 50) {
      return '1-2 days';
    } else if (distance < 300) {
      return '2-4 days';
    } else if (distance < 1000) {
      return '4-7 days';
    } else {
      return '1-2 weeks';
    }
  }

  getShippingFeeForAddress(address: LocationDto): number {
    if (!address || !address.lat || !address.lng) {
      return this.BASE_SHIPPING_RATE;
    }

    const destLat = address.lat;
    const destLng = address.lng;

    // Haversine formula
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(destLat - this.STORE_LOCATION.lat);
    const dLng = toRad(destLng - this.STORE_LOCATION.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(this.STORE_LOCATION.lat)) * Math.cos(toRad(destLat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    let shippingFee = this.BASE_SHIPPING_RATE + this.RATE_PER_KM * distance;
    shippingFee = Math.min(shippingFee, this.MAX_SHIPPING_RATE);
    
    // Round to nearest 100 MMK for cleaner display
    return Math.round(shippingFee / 100) * 100;
  }

  getDistanceFromStore(address: LocationDto): number {
    if (!address || !address.lat || !address.lng) {
      return 0;
    }

    const destLat = address.lat;
    const destLng = address.lng;

    // Haversine formula
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(destLat - this.STORE_LOCATION.lat);
    const dLng = toRad(destLng - this.STORE_LOCATION.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(this.STORE_LOCATION.lat)) * Math.cos(toRad(destLat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }
}


