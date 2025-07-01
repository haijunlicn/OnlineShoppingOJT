import { Component, Input, OnDestroy, OnInit } from '@angular/core';

interface MenuItem {
  label: string
  route: string
  icon: string
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

  isCollapsed = false
  isMobile = false

  menuSections: MenuSection[] = [
    {
      heading: "Product Management",
      items: [
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
      heading: "Policy Management",
      items: [
        { label: "Privacy and Terms & Condition", route: "/admin/policy/policy-list", icon: "fas fa-file-contract" },
        { label: "Faq", route: "/admin/policy/faq-list", icon: "fas fa-question-circle" },
      ],
    },
    {
      heading: "Payment Management",
      items: [{ label: "Payment", route: "/admin/payment-list", icon: "fas fa-credit-card" }],
    },
  ]

  constructor() {}

  ngOnInit() {
    this.checkScreenSize()
    window.addEventListener("resize", this.onResize.bind(this))
  }

  ngOnDestroy() {
    window.removeEventListener("resize", this.onResize.bind(this))
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isCollapsed = true
    }
  }

  private onResize() {
    this.checkScreenSize()
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768
    if (this.isMobile) {
      this.isCollapsed = true
    }
  }
}
