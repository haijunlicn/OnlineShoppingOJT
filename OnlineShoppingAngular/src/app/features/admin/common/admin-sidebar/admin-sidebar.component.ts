import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from "@angular/core"
import { Router } from "@angular/router"
import { isPlatformBrowser } from "@angular/common"
import { AuthService } from "@app/core/services/auth.service"

interface MenuItem {
  label: string
  route: string
  icon: string
  badge?: number
}

interface MenuSection {
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
        { label: "Overview", route: "/admin/dashboard", icon: "fas fa-chart-line" },
        { label: "Analytics", route: "/admin/sale-analysis", icon: "fas fa-chart-bar" },
      ],
    },
    {
      heading: "Product Management",
      items: [
        { label: "Chart Testing", route: "/admin/chartTesting", icon: "fas fa-box" },
        { label: "Product List", route: "/admin/productList", icon: "fas fa-box" },
        { label: "Product Attributes", route: "/admin/productAttributes", icon: "fas fa-tags" },
      ],
    },
    {
      heading: "Roles And Permissions",
      items: [
        { label: "Role", route: "/admin/role-list", icon: "fas fa-user-shield" },
        { label: "Permission", route: "/admin/permission-list", icon: "fas fa-key" },
      ],
    },
    {
      heading: "Refund Management",
      items: [
        { label: "Refund Requests", route: "/admin/refundRequestList", icon: "fas fa-credit-card" },
        { label: "Order List", route: "/admin/AdminOrder", icon: "fas fa-credit-card" },
      ],
    },
    {
      heading: "Policy Management",
      items: [
        { label: "Privacy, Terms & Condition", route: "/admin/policy/policy-list", icon: "fas fa-file-contract" },
        { label: "Faq", route: "/admin/policy/faq-list", icon: "fas fa-question-circle" },
      ],
    },
    {
      heading: "Payment Management",
      items: [{ label: "Payment", route: "/admin/payment-list", icon: "fas fa-credit-card" }],
    },
    {
      heading: "Notification Management",
      items: [
        {
          label: "Notification Types",
          route: "/admin/notificationTypes",
          icon: "fas fa-tags",
        },
        {
          label: "Sent Notifications",
          route: "/admin/sentNotifications",
          icon: "fas fa-paper-plane",
        },
      ],
    }
  ]

  router: Router
  authService: AuthService

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    router: Router,
    authService: AuthService
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
    this.filteredMenuSections = this.menuSections
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
      return
    }

    this.filteredMenuSections = this.menuSections
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
