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
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { StoreLocationDto } from '../../../../core/models/storeLocationDto';
import { VariantService, StockUpdateResponse } from '../../../../core/services/variant.service';
import { DeliveryMethodService } from '../../../../core/services/delivery-method.service';
import { DeliveryMethod } from '../../../../core/models/delivery-method.model';
import Swal from 'sweetalert2';
import { DiscountDisplayDTO } from '@app/core/models/discount';


// Enhanced cart item interface with discount information
interface CartItemWithDiscounts extends CartItem {
  originalPrice: number
  discountedPrice: number
  appliedDiscounts: DiscountDisplayDTO[]
  discountBreakdown: { label: string; amount: number }[]
}

// Applied coupon interface
interface AppliedCoupon {
  discount: DiscountDisplayDTO
  appliedAmount: number
  appliedToItems: { productId: number; variantId: number; discountAmount: number }[]
}

@Component({
  selector: "app-order-management",
  standalone: false,
  templateUrl: "./order-management.component.html",
  styleUrl: "./order-management.component.css",
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  // Browser check
  isBrowser = false
  L: any // Leaflet namespace

  // Location Management Properties
  addresses: LocationDto[] = []
  selectedAddress: LocationDto | null = null
  showAddressForm = false
  showAddressList = false
  isEditing = false
  currentUserId = 0
  newAddress: LocationDto = this.getEmptyAddress()

  // Map and Location Properties
  map: any
  marker: any
  addressForm: FormGroup
  searchControl: FormControl
  currentLatLng: any = null
  isLoading = false

  // Enhanced Order Summary Properties with discount support
  orderItems: CartItemWithDiscounts[] = []
  originalSubtotal = 0
  discountedSubtotal = 0
  autoDiscountSavings = 0
  couponSavings = 0
  totalSavings = 0
  shippingFee = 0
  totalAmount = 0

  // Discount information from cart
  appliedCoupon: AppliedCoupon | null = null

  // Store location (dynamic)
  storeLocation: StoreLocationDto | null = null

  // Delivery method integration
  deliveryMethods: DeliveryMethod[] = []
  selectedDeliveryMethod: DeliveryMethod | null = null
  allDeliveryMethods: DeliveryMethod[] = []

  private subscriptions: Subscription[] = []
  // private platformId: Object

  constructor(
    private cdr: ChangeDetectorRef,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private formBuilder: FormBuilder,
    private storeLocationService: StoreLocationService,
    private variantService: VariantService,
    private deliveryMethodService: DeliveryMethodService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.platformId = platformId
    this.isBrowser = isPlatformBrowser(this.platformId)

    this.addressForm = this.formBuilder.group({
      address: ["", Validators.required],
      township: [""],
      city: ["", Validators.required],
      zipCode: [""],
      country: ["", Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      phoneNumber: ["", [Validators.required, Validators.pattern(/^09\d{7,9}$/)]],
    })

    this.searchControl = new FormControl("")
  }

  async ngOnInit(): Promise<void> {
    // Initialize user ID first (like HeaderComponent)
    this.authService.initializeUserFromToken()
    const user = this.authService.getCurrentUser()
    this.currentUserId = user ? user.id : 0

    // Fetch store location dynamically
    this.storeLocationService.getActive().subscribe({
      next: (store: StoreLocationDto) => {
        this.storeLocation = store
        this.initOrderManagement()
      },
      error: (err) => {
        console.error("Failed to load active store location:", err)
        this.initOrderManagement()
      },
    })
  }

  private initOrderManagement(): void {
    // Remove duplicate user initialization since it's done in ngOnInit
    this.loadAddresses()
    this.loadCartData()

    if (this.isBrowser) {
      import("leaflet").then((L) => {
        this.L = L
        this.setupCustomMarkerIcon()
      })
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  setupCustomMarkerIcon(): void {
    const defaultIcon = this.L.icon({
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    this.L.Marker.prototype.options.icon = defaultIcon
  }

  private loadCartData(): void {
    const savedState = this.cartService.getCartWithDiscounts()

    if (savedState && savedState.cartItems.length > 0) {
      console.log('Loaded cart with discounts from CartService:', savedState)

      // assign data like before, then clear saved state if needed
      this.orderItems = savedState.cartItems
      this.discountedSubtotal = savedState.cartTotal
      this.appliedCoupon = savedState.appliedCoupon
      this.autoDiscountSavings = savedState.autoDiscountSavings
      this.totalAmount = this.discountedSubtotal
      this.calculateDiscountTotals()
      
    } else {
      console.warn("No saved cart with discounts in CartService, fallback to basic cart")
      // fallback code here...
      const currentCart = this.cartService.getCartItemsOnly()
      console.log("🔹 Current cart from CartService:", currentCart)

      if (currentCart && currentCart.length > 0) {
        console.log(`🔸 CartService returned ${currentCart.length} items`)

        this.orderItems = currentCart.map((item: CartItem) => {
          const mappedItem = {
            id: item.productId,
            variantId: item.variantId,
            name: item.productName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.price,
            discountedPrice: item.price,
            appliedDiscounts: [],
            discountBreakdown: [],
            total: item.price * item.quantity,
            variantSku: item.variantSku,
            imgPath: item.imgPath,
            productId: item.productId,
            productName: item.productName,
            stock: item.stock,
            brandId: item.brandId,
            categoryId: item.categoryId,
          }
          console.log("   ➡️ mapped fallback cart item:", mappedItem)
          return mappedItem
        })

        this.calculateDiscountTotals()
        console.log("🔸 Discount totals calculated (fallback):", {
          originalSubtotal: this.originalSubtotal,
          autoDiscountSavings: this.autoDiscountSavings,
          couponSavings: this.couponSavings,
          totalSavings: this.totalSavings,
        })

        this.discountedSubtotal = this.calculateDiscountedSubtotal()
        this.totalAmount = this.discountedSubtotal

        console.log("🔸 Final totals (fallback):", {
          discountedSubtotal: this.discountedSubtotal,
          totalAmount: this.totalAmount,
        })
      } else {
        console.warn("⚠️ CartService returned empty cart")
        this.handleEmptyCart()
      }
    }
  }

  private calculateDiscountTotals(): void {
    this.originalSubtotal = this.orderItems.reduce((total, item) => total + item.originalPrice * item.quantity, 0);

    // Auto-discounted subtotal (before coupon)
    const autoDiscountedSubtotal = this.orderItems.reduce(
      (total, item) => total + item.discountedPrice * item.quantity,
      0
    );

    this.autoDiscountSavings = this.originalSubtotal - autoDiscountedSubtotal;

    // Coupon discount from all applicable items
    this.couponSavings = this.orderItems.reduce((total, item) => {
      return total + (this.getCouponDiscountForItem(item.productId, item.variantId) || 0);
    }, 0);

    // Final discounted subtotal after auto + coupon discounts
    this.discountedSubtotal = autoDiscountedSubtotal - this.couponSavings;

    this.totalSavings = this.autoDiscountSavings + this.couponSavings;
  }

  private calculateDiscountedSubtotal(): number {
    return this.orderItems.reduce((total, item) => {
      const coupon = this.getCouponDiscountForItem(item.productId, item.variantId) || 0;
      const baseDiscounted = item.discountedPrice * item.quantity;
      return total + (baseDiscounted - coupon);
    }, 0);
  }

  // private calculateDiscountedSubtotal(): number {
  //   return this.orderItems.reduce((total, item) => total + item.discountedPrice * item.quantity, 0)
  // }

  private handleEmptyCart(): void {
    Swal.fire("No items in cart. Please add items before proceeding to checkout.", "", "warning")
    this.router.navigate(["/customer/cart"])
  }

  private getEmptyAddress(): LocationDto {
    return {
      id: 0,
      address: "",
      city: "",
      lat: 0,
      lng: 0,
      township: "",
      zipCode: "",
      country: "Myanmar",
      userId: this.currentUserId,
      phoneNumber: "",
    }
  }

  loadAddresses(): void {
    this.locationService.getUserLocations(this.currentUserId).subscribe({
      next: (data: LocationDto[]) => {
        this.addresses = data
        if (this.addresses.length > 0) {
          this.selectedAddress = { ...this.addresses[0] }
          this.fetchDeliveryMethodsAndCalculateFee()
        } else {
          this.selectedAddress = null
        }
        this.cdr.detectChanges()
      },
      error: (err: any) => {
        console.error("Error loading addresses:", err)
      },
    })
  }

  // Address Form Methods
  showAddForm(): void {
    this.showAddressForm = true
    this.isEditing = false
    this.newAddress = this.getEmptyAddress()
    this.addressForm.reset()
    this.currentLatLng = null

    // Initialize map after modal is shown
    setTimeout(() => {
      if (this.isBrowser) {
        this.initMap()
      }
    }, 100)
  }

  editAddress(address: LocationDto): void {
    if (!address) return
    this.showAddressForm = true
    this.isEditing = true
    this.newAddress = { ...address }
    this.addressForm.patchValue(address)

    // Initialize map and set marker
    setTimeout(() => {
      if (this.isBrowser) {
        this.initMap()
        if (address.lat && address.lng) {
          const latlng = this.L.latLng(address.lat, address.lng)
          this.addMarker(latlng)
        }
      }
    }, 100)
  }

  initMap(): void {
    if (!this.isBrowser || !this.L) return

    // Remove existing map if any
    if (this.map) {
      this.map.remove()
    }

    // Myanmar bounds
    const myanmarBounds = this.L.latLngBounds(
      this.L.latLng(9.5, 92.2), // Southwest
      this.L.latLng(28.6, 101.2), // Northeast
    )

    this.map = this.L.map("address-map", {
      zoomControl: false,
      attributionControl: false,
      maxBounds: myanmarBounds,
      maxBoundsViscosity: 1.0,
    }).setView([20, 96], 5) // Myanmar center

    this.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.map)

    this.L.control.zoom({ position: "topright" }).addTo(this.map)

    this.map.on("click", (e: any) => {
      this.addMarker(e.latlng)
      this.reverseGeocodeLocation(e.latlng.lat, e.latlng.lng)
    })

    // Prevent panning outside Myanmar
    this.map.on("drag", () => {
      this.map.panInsideBounds(myanmarBounds, { animate: false })
    })

    // Fix map rendering
    setTimeout(() => this.map.invalidateSize(), 100)
  }

  addMarker(latlng: any): void {
    if (!this.isBrowser || !this.L) return

    // Myanmar bounds
    const myanmarBounds = this.L.latLngBounds(this.L.latLng(9.5, 92.2), this.L.latLng(28.6, 101.2))
    if (!myanmarBounds.contains(latlng)) {
      Swal.fire("Please select a location within Myanmar.", "", "warning")
      return
    }

    if (this.marker) {
      this.map.removeLayer(this.marker)
    }
    this.marker = this.L.marker(latlng).addTo(this.map)
    this.currentLatLng = latlng

    // Update form lat/lng without triggering valueChanges
    this.addressForm.patchValue(
      {
        lat: latlng.lat,
        lng: latlng.lng,
      },
      { emitEvent: false },
    )
  }

  autoLocate(): void {
    if (!this.isBrowser) return

    this.isLoading = true
    const geoSub = this.locationService.getCurrentPosition().subscribe({
      next: (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const latlng = this.L.latLng(lat, lng)
        this.map.setView(latlng, 15)
        this.addMarker(latlng)
        this.reverseGeocodeLocation(lat, lng)
        this.isLoading = false
      },
      error: () => {
        Swal.fire("Unable to retrieve your location.", "", "error")
        this.isLoading = false
      },
    })
    this.subscriptions.push(geoSub)
  }

  reverseGeocodeLocation(lat: number, lng: number): void {
    const geocodeSub = this.locationService.reverseGeocode(lat, lng).subscribe({
      next: (data) => this.populateAddressFields(data),
      error: (error) => console.error("Reverse geocoding error:", error),
    })
    this.subscriptions.push(geocodeSub)
  }

  populateAddressFields(data: any): void {
    const address = data.address || {}
    const streetAddress = [address.house_number, address.road || address.street].filter(Boolean).join(" ")

    const township =
      address.township || address.suburb || address.neighbourhood || address.village || address.county || ""

    this.addressForm.patchValue({
      address: streetAddress || data.display_name?.split(",")[0] || "",
      township: township,
      city: address.city || address.town || address.village || "",
      zipCode: address.postcode || "",
      country: address.country || "",
    })
  }

  onSearch(): void {
    const query = this.searchControl.value?.trim()
    if (!query) {
      Swal.fire("Please enter a location to search.", "", "info")
      return
    }

    this.isLoading = true

    const searchSub = this.locationService.geocode(query).subscribe({
      next: (results: any[]) => {
        if (results.length === 0) {
          Swal.fire("Location not found.", "", "warning")
          this.isLoading = false
          return
        }
        const firstResult = results[0]
        const lat = Number.parseFloat(firstResult.lat)
        const lon = Number.parseFloat(firstResult.lon)
        const latlng = this.L.latLng(lat, lon)
        this.map.setView(latlng, 15)
        this.addMarker(latlng)
        this.populateAddressFields(firstResult)
        this.isLoading = false
      },
      error: () => {
        Swal.fire("Failed to search location.", "", "error")
        this.isLoading = false
      },
    })

    this.subscriptions.push(searchSub)
  }

  saveAddress(): void {
    if (!this.currentLatLng) {
      Swal.fire("Please select a location first!", "", "warning")
      return
    }

    if (this.addressForm.invalid) {
      Swal.fire("Please fill in all required fields!", "", "warning")
      return
    }

    console.log("current user Id : ", this.currentUserId)

    const location: LocationDto = {
      lat: this.currentLatLng.lat,
      lng: this.currentLatLng.lng,
      address: this.addressForm.get("address")?.value || "",
      township: this.addressForm.get("township")?.value || "",
      city: this.addressForm.get("city")?.value || "",
      zipCode: String(this.addressForm.get("zipCode")?.value) || "",
      country: this.addressForm.get("country")?.value || "",
      userId: this.currentUserId,
      phoneNumber: this.addressForm.get("phoneNumber")?.value || "",
    }

    if (this.isEditing && this.newAddress.id) {
      location.id = this.newAddress.id
      const updateSub = this.locationService.updateLocation(location).subscribe({
        next: () => {
          Swal.fire("Address updated successfully!", "", "success")
          this.loadAddresses()
          this.showAddressForm = false
          this.cleanupMap()
        },
        error: () => Swal.fire("Failed to update address.", "", "error"),
      })
      this.subscriptions.push(updateSub)
    } else {
      const saveSub = this.locationService.saveLocation(location).subscribe({
        next: () => {
          Swal.fire("Address saved successfully!", "", "success")
          this.loadAddresses()
          this.showAddressForm = false
          this.cleanupMap()
        },
        error: () => Swal.fire("Failed to save address.", "", "error"),
      })
      this.subscriptions.push(saveSub)
    }
  }

  deleteAddress(id: number): void {
    if (!id || !confirm("Are you sure you want to delete this address?")) return
    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.loadAddresses()
        Swal.fire("Address deleted successfully.", "", "success")
      },
      error: (err: any) => {
        console.error("Error deleting address:", err)
        Swal.fire("Failed to delete address.", "", "error")
      },
    })
  }

  cancelAddressForm(): void {
    this.showAddressForm = false
    this.newAddress = this.getEmptyAddress()
    this.addressForm.reset()
    this.currentLatLng = null
    this.cleanupMap()
  }

  private cleanupMap(): void {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
    if (this.marker) {
      this.marker = null
    }
  }

  // New method to toggle address list
  toggleAddressList(): void {
    this.showAddressList = !this.showAddressList
  }

  // New method to select address and close dropdown
  selectAddressAndClose(address: LocationDto): void {
    this.selectAddress(address)
    this.showAddressList = false
  }

  // Location Management Methods
  selectAddress(address: LocationDto): void {
    if (!address) return
    this.selectedAddress = { ...address }
    this.fetchDeliveryMethodsAndCalculateFee()
  }

  fetchDeliveryMethodsAndCalculateFee(): void {
    if (this.selectedAddress && this.storeLocation) {
      const distance = this.getDistanceFromStore(this.selectedAddress)

      // Fetch all methods (not just available by distance)
      this.deliveryMethodService.getAll().subscribe((methods) => {
        this.allDeliveryMethods = methods

        // Filter by distance
        let filtered = methods.filter((method) => {
          // Default method (type === 1) is always included
          if (method.type === 1) return true
          // If min/max are null, skip (unless default)
          if (method.minDistance == null || method.maxDistance == null) return false
          return distance >= method.minDistance && distance <= method.maxDistance
        })

        // Ensure default is present (in case not already)
        const defaultMethod = methods.find((m) => m.type === 1)
        if (defaultMethod && !filtered.some((m) => m.id === defaultMethod.id)) {
          filtered.push(defaultMethod)
        }

        // Optional: sort so default is first
        filtered = filtered.sort((a, b) => (b.type === 1 ? 1 : 0) - (a.type === 1 ? 1 : 0))

        this.deliveryMethods = filtered
        this.selectedDeliveryMethod = filtered.length > 0 ? filtered[0] : null
        this.calculateShippingFee()
        this.cdr.detectChanges()
      })
    } else {
      this.deliveryMethods = []
      this.selectedDeliveryMethod = null
      this.calculateShippingFee()
    }
  }

  goToPaymentPage(): void {
    if (!this.selectedAddress || this.orderItems.length === 0) {
      Swal.fire("Please select a delivery address and ensure your cart is not empty.", "", "warning")
      return
    }

    // Call the stock removal service before navigating
    const stockItems = this.orderItems.map((item) => ({
      id: item.productId,
      variantId: item.variantId,
      name: item.productName,
      quantity: item.quantity,
      price: item.discountedPrice, // Use discounted price
      total: item.discountedPrice * item.quantity,
      variantSku: item.variantSku,
      imgPath: item.imgPath,
    }))

    this.variantService.recudeStock(stockItems).subscribe({
      next: (responses: StockUpdateResponse[]) => {
        const allSuccessful = responses.every((response) => response.success)
        if (allSuccessful) {
          // All stock updates successful, proceed to payment with enhanced data
          this.router
            .navigate(["/customer/payment"], {
              state: {
                orderItems: stockItems,
                selectedAddress: this.selectedAddress,
                shippingFee: this.shippingFee,
                totalAmount: this.totalAmount,
                itemSubtotal: this.discountedSubtotal,
                selectedDeliveryMethod: this.selectedDeliveryMethod,
                // Enhanced discount information
                originalSubtotal: this.originalSubtotal,
                autoDiscountSavings: this.autoDiscountSavings,
                appliedCoupon: this.appliedCoupon,
                couponSavings: this.couponSavings,
                totalSavings: this.totalSavings,
                discountBreakdown: this.getDiscountBreakdown(),
              },
            })
            .then((navigated) => {
              if (navigated) {
                this.cartService.clearCart()
              }
            })
        } else {
          // Some stock updates failed
          const failedItems = responses
            .filter((response) => !response.success)
            .map((response) => response.message)
            .join("\n")
          Swal.fire(`Stock update failed for some items:\n${failedItems}`, "", "error")
        }
      },
      error: (error) => {
        Swal.fire(`Stock update failed: ${error?.error || "Server error"}`, "", "error")
      },
    })
  }

  // Helper method to get discount breakdown for payment page
  private getDiscountBreakdown(): any[] {
    const breakdown: any[] = []

    // Add auto discount breakdown
    this.orderItems.forEach((item) => {
      if (item.discountBreakdown && item.discountBreakdown.length > 0) {
        item.discountBreakdown.forEach((discount) => {
          const existingDiscount = breakdown.find((b) => b.label === discount.label)
          if (existingDiscount) {
            existingDiscount.amount += discount.amount * item.quantity
          } else {
            breakdown.push({
              label: discount.label,
              amount: discount.amount * item.quantity,
              type: "auto",
            })
          }
        })
      }
    })

    // Add coupon discount
    if (this.appliedCoupon) {
      breakdown.push({
        label: this.appliedCoupon.discount.shortLabel || this.appliedCoupon.discount.name,
        amount: this.appliedCoupon.appliedAmount,
        type: "coupon",
      })
    }

    return breakdown
  }

  getEstimatedDeliveryTime(): string {
    if (!this.selectedAddress || !this.storeLocation) return ""
    const destLat = this.selectedAddress.lat
    const destLng = this.selectedAddress.lng
    const storeLat = this.storeLocation.lat
    const storeLng = this.storeLocation.lng
    // Haversine formula
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // Earth radius in km
    const dLat = toRad(destLat - storeLat)
    const dLng = toRad(destLng - storeLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(storeLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    if (distance < 50) {
      return "1-2 days"
    } else if (distance < 300) {
      return "2-4 days"
    } else if (distance < 1000) {
      return "4-7 days"
    } else {
      return "1-2 weeks"
    }
  }

  getShippingFeeForAddress(address: LocationDto): number {
    if (!address || !address.lat || !address.lng || !this.storeLocation || !this.selectedDeliveryMethod) {
      return 0
    }
    const destLat = address.lat
    const destLng = address.lng
    const storeLat = this.storeLocation.lat
    const storeLng = this.storeLocation.lng
    // Haversine formula
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // Earth radius in km
    const dLat = toRad(destLat - storeLat)
    const dLng = toRad(destLng - storeLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(storeLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    const method = this.selectedDeliveryMethod
    const shippingFee = method.baseFee + method.feePerKm * distance
    return Math.round(shippingFee / 100) * 100
  }

  getDistanceFromStore(address: LocationDto): number {
    if (!address || !address.lat || !address.lng || !this.storeLocation) {
      return 0
    }
    const destLat = address.lat
    const destLng = address.lng
    const storeLat = this.storeLocation.lat
    const storeLng = this.storeLocation.lng
    // Haversine formula
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371 // Earth radius in km
    const dLat = toRad(destLat - storeLat)
    const dLng = toRad(destLng - storeLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(storeLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  goBackToCart(): void {
    this.router.navigate(["/customer/cart"])
  }

  calculateShippingFee(): void {
    console.log("calculateShippingFee() called")
    if (this.selectedAddress && this.storeLocation && this.selectedDeliveryMethod) {
      const distance = this.getDistanceFromStore(this.selectedAddress)
      const method = this.selectedDeliveryMethod
      const shippingFee = method.baseFee + method.feePerKm * distance
      this.shippingFee = Math.round(shippingFee / 100) * 100
      this.totalAmount = this.discountedSubtotal + this.shippingFee
    } else {
      console.warn("Missing data to calculate shipping fee:", {
        selectedAddress: this.selectedAddress,
        storeLocation: this.storeLocation,
        selectedDeliveryMethod: this.selectedDeliveryMethod,
      })
      this.shippingFee = 0
      this.totalAmount = this.discountedSubtotal
    }
  }

  trackByAddressId(index: number, address: LocationDto): number | undefined {
    return address.id
  }

  getDeliveryIconClass(methodName: string): string {
    const name = methodName.toLowerCase()
    if (name.includes("bike") || name.includes("bicycle")) {
      return "fas fa-bicycle"
    } else if (name.includes("car")) {
      return "fas fa-car"
    } else if (name.includes("truck")) {
      return "fas fa-truck"
    } else {
      return "fas fa-shipping-fast"
    }
  }

  // Helper methods for discount display
  hasDiscounts(): boolean {
    return this.totalSavings > 0
  }

  hasAutoDiscounts(): boolean {
    return this.autoDiscountSavings > 0
  }

  hasCouponDiscount(): boolean {
    return this.couponSavings > 0
  }

  getAppliedDiscountLabels(): string[] {
    const labels: string[] = []

    // Get unique auto discount labels
    const autoLabels = new Set<string>()
    this.orderItems.forEach((item) => {
      if (item.discountBreakdown) {
        item.discountBreakdown.forEach((discount) => {
          autoLabels.add(discount.label)
        })
      }
    })

    labels.push(...Array.from(autoLabels))

    // Add coupon label
    if (this.appliedCoupon) {
      labels.push(this.appliedCoupon.discount.shortLabel || this.appliedCoupon.discount.name || "Coupon")
    }

    return labels
  }


  getCouponDiscountForItem(productId: number, variantId: number): number {
    // Step 1: Check if any coupon is applied
    if (!this.appliedCoupon) {
      console.log("No coupon applied.")
      return 0
    }

    // Step 2: Find the matching item inside appliedCoupon.appliedToItems
    const itemDiscount = this.appliedCoupon.appliedToItems.find((item) => {
      const match = item.productId === productId && item.variantId === variantId
      return match
    })

    // Step 3: Return the discount amount if match found, else return 0
    if (itemDiscount) {
      return itemDiscount.discountAmount
    } else {
      return 0
    }
  }

  getFinalDiscountedPrice(item: any): number {
    const couponAmount = this.getCouponDiscountForItem(item.productId, item.variantId) || 0;
    const basePrice = item.discountedPrice * item.quantity;
    return basePrice - couponAmount;
  }

}
