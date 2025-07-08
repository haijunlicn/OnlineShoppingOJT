import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';
import { User } from '../../../../core/models/User';
import { AuthService } from '../../../../core/services/auth.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { CategoryService } from '@app/core/services/category.service'; // Add this import

@Component({
  selector: "app-header",
  standalone: false,
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit {
  isWishlistDropdownVisible = false
  isMenuOpen = false
  cartItemCount = 2
  isMobileSearchOpen = false
  isProfileDropdownOpen = false

  // Category dropdown properties
  categories: CategoryDTO[] = []
  loadingCategories = false

  // User state
  currentUser: User | null = null
  isLoggedIn = false
  isCustomer = false

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private cartService: CartService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private authService: AuthService,
    private categoryService: CategoryService,
  ) { }

  ngOnInit(): void {
    // Initialize cart count
    this.cartItemCount = this.cartService.getCart().reduce((sum, item) => sum + item.quantity, 0)

    // Listen to cart changes
    this.cartService.cartCount$.subscribe((count) => {
      this.cartItemCount = count
    })

    // Listen to auth changes
    this.authService.user$.subscribe((user: User | null) => {
      this.currentUser = user
      this.isLoggedIn = !!user
      this.isCustomer = this.authService.isCustomer()
    })

    // Initialize user from stored token
    this.authService.initializeUserFromToken()

    // Load categories for dropdown
    this.loadCategories()
  }

  // Category dropdown methods
  loadCategories() {
    this.loadingCategories = true
    this.categoryService.getAllPublicCategories().subscribe({
      next: (categories) => {
        this.categories = categories
        this.loadingCategories = false
        console.log("Header categories loaded:", this.categories)
      },
      error: (err) => {
        console.error("Failed to load categories", err)
        this.loadingCategories = false
      },
    })
  }

  onCategorySelected(category: CategoryDTO) {
    console.log("Selected category:", category)
    this.router.navigate(["/customer/productList"], {
      queryParams: { category: category.id },
    })
  }

  onViewAllCategories() {
    this.router.navigate(["/customer/productList"])
  }

  // Search method
  onSearch(query?: string) {
    if (query) {
      console.log("Searching for:", query)
      this.router.navigate(["/customer/productList"], {
        queryParams: { search: query },
      })
    } else {
      console.log("Search clicked without query")
    }

    // Close mobile search if open
    this.isMobileSearchOpen = false
  }

  // Existing methods
  get loginVisible$() {
    return this.loginModalService.loginVisible$
  }

  get registerVisible$() {
    return this.registerModalService.registerVisible$
  }

  get forgotVisible$() {
    return this.forgotModalService.forgotVisible$
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen
  }

  onWishlist() {
    this.router.navigate(["/customer/general/wishlist"])
  }

  onRegister(): void {
    this.registerModalService.show()
    console.log("Register clicked")
  }

  onSignIn(): void {
    this.loginModalService.show()
    console.log("Login clicked")
  }

   onProfile(): void {
    this.router.navigate(['/customer/profile-update']); 
    this.isProfileDropdownOpen = false;
}

  

  onSettings(): void {
    this.router.navigate(["/customer/account-settings"])
    this.isProfileDropdownOpen = false
  }

  onLogout(): void {
    this.authService.logout()
    this.isProfileDropdownOpen = false
    console.log("User logged out")
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen
  }

  getUserInitials(name: string): string {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isWishlistDropdownVisible = false
      this.isProfileDropdownOpen = false
    }
  }

  onCart(): void {
    this.router.navigate(["/customer/cart"])
  }

  goToOrderList(): void {
    this.router.navigate(["/customer/orders"])
  }
}
