import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from "@angular/core"
import { Router } from "@angular/router"
import { isPlatformBrowser } from "@angular/common"
import { AuthService } from "@app/core/services/auth.service"
import { AccessControlService } from "@app/core/services/AccessControl.service"

export interface MenuItem {
  label: string
  route: string
  icon: string
  badge?: number
  requiredPermission?: string[]
}

export interface MenuSection {
  heading: string
  items: MenuItem[]
}

@Component({
  selector: "app-admin-sidebar",
  standalone: false,
  templateUrl: "./admin-sidebar.component.html",
  styleUrls: ["./admin-sidebar.component.css"],
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  @Input() accountInfo: any = { name: "Admin User" }
  @Output() sidebarToggle = new EventEmitter<boolean>()

  isExpanded = true
  isMobile = false
  searchQuery = ""
  notificationCount = 15
  private isBrowser: boolean

  filteredMenuSections: MenuSection[] = []
  menuSections: MenuSection[] = [
    {
      heading: "Dashboard",
      items: [
        { label: "Dashboard", route: "/admin/sale-analysis", icon: "fas fa-chart-bar", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "User Overview", route: "/admin/createGroup", icon: "fas fa-chart-line", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Product Management",
      items: [
        { label: "Product List", route: "/admin/productList", icon: "fas fa-box", requiredPermission: ["PRODUCT_READ", "SUPERADMIN_PERMISSION"] },
        { label: "Product Attributes", route: "/admin/productAttributes", icon: "fas fa-tags", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Order Management",
      items: [
        { label: "Order List", route: "/admin/AdminOrder", icon: "fas fa-shopping-cart", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Refund Management",
      items: [
        { label: "Refund Requests", route: "/admin/refundRequestList", icon: "fas fa-undo", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "User Management",
      items: [
        { label: "Customer List", route: "/admin/userList", icon: "fas fa-users", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Admin Accounts", route: "/admin/account/list", icon: "fas fa-user-cog", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Roles & Permissions",
      items: [
        { label: "Roles", route: "/admin/role-list", icon: "fas fa-user-shield", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Permissions", route: "/admin/permission-list", icon: "fas fa-key", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Policy Management",
      items: [
        { label: "Privacy, Terms & Conditions", route: "/admin/policy/policy-list", icon: "fas fa-file-contract", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "FAQ", route: "/admin/policy/faq-list", icon: "fas fa-question-circle", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Payment & Delivery",
      items: [
        { label: "Payments", route: "/admin/payment-list", icon: "fas fa-credit-card", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Delivery Methods", route: "/admin/delivery-method-list", icon: "fas fa-truck", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Store Locations", route: "/admin/storelocation", icon: "fas fa-map-marker-alt", requiredPermission: ["SUPERADMIN_PERMISSION"] }
      ],
    },
    {
      heading: "Notification Center",
      items: [
        { label: "Notification Types", route: "/admin/notificationTypes", icon: "fas fa-tags", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Sent Notifications", route: "/admin/sentNotifications", icon: "fas fa-paper-plane", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Content Management",
      items: [
        { label: "Blog Posts", route: "/admin/bloglist", icon: "fas fa-blog", requiredPermission: ["SUPERADMIN_PERMISSION"] },
        { label: "Q&A", route: "/admin/answerqust", icon: "fas fa-question", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Discounts",
      items: [
        { label: "Discount List", route: "/admin/discountList", icon: "fas fa-percent", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    },
    {
      heading: "Audit & Logs",
      items: [
        { label: "Audit Log", route: "/admin/audit-log", icon: "fas fa-clipboard-list", requiredPermission: ["SUPERADMIN_PERMISSION"] },
      ],
    }
  ];

  router: Router
  authService: AuthService

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    router: Router,
    authService: AuthService,
    private accessControlService: AccessControlService
  ) {
    this.platformId = platformId
    this.router = router
    this.authService = authService
    this.isBrowser = isPlatformBrowser(this.platformId)
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.checkScreenSize()
      window.addEventListener("resize", this.onResize.bind(this))
    }
    // this.filteredMenuSections = this.menuSections
    this.filteredMenuSections = this.menuSections
      .map(section => {
        const filteredItems = section.items.filter(item =>
          !item.requiredPermission || this.accessControlService.hasAny(...item.requiredPermission)
        );
        return { ...section, items: filteredItems };
      })
      .filter(section => section.items.length > 0);
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener("resize", this.onResize.bind(this))
    }
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded
    this.sidebarToggle.emit(this.isExpanded)
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase()

    if (!query) {
      this.filteredMenuSections = this.menuSections
        .map(section => {
          const filteredItems = section.items.filter(item =>
            !item.requiredPermission || this.accessControlService.hasAny(...item.requiredPermission)
          );
          return { ...section, items: filteredItems };
        })
        .filter(section => section.items.length > 0);
      return
    }

    this.filteredMenuSections = this.menuSections
      .map(section => {
        const filteredItems = section.items.filter(item =>
          !item.requiredPermission || this.accessControlService.hasAny(...item.requiredPermission)
        );
        return { ...section, items: filteredItems };
      })
      .filter(section => section.items.length > 0)
      .map(section => {
        const filteredItems = section.items.filter(item =>
          item.label.toLowerCase().includes(query)
        )
        return { ...section, items: filteredItems }
      })
      .filter(section => section.items.length > 0)
  }

  trackBySection(index: number, section: MenuSection) {
    return section.heading
  }

  clearIfEmpty() {
    if (this.searchQuery.trim().length === 0) {
      this.searchQuery = ''
    }
  }

  onNotificationClick(): void {
    console.log("Notifications clicked")
    // Implement notification logic here
  }

  onProfileClick(): void {
    console.log("Profile clicked")
    this.router.navigate(["/admin/profile"])
  }

  onSettingsClick(): void {
    console.log("Settings clicked")
    this.router.navigate(["/admin/settings"])
  }

  onLogout(): void {
    this.authService.logout()
    this.router.navigate(["/admin/login"])
    console.log("User logged out")
  }

  private onResize() {
    this.checkScreenSize()
  }

  private checkScreenSize() {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768
      if (this.isMobile && this.isExpanded) {
        // On mobile, emit the state change when auto-collapsing
        this.isExpanded = false
        this.sidebarToggle.emit(this.isExpanded)
      }
    }
  }
}
