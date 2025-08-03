import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { AuthService } from "../../../../core/services/auth.service"
import { AlertService } from "../../../../core/services/alert.service"
import { Router } from "@angular/router"
import { filter, take } from "rxjs"
import { AccessControlService } from "@app/core/services/AccessControl.service"
import { MenuSection } from "../../common/admin-sidebar/admin-sidebar.component"

@Component({
  selector: "app-admin-login",
  standalone: false,
  templateUrl: "./admin-login.component.html",
  styleUrls: ["./admin-login.component.css"],
})

export class AdminLoginComponent {
  loginForm: FormGroup
  isSubmitted = false
  errorMessage = ""

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

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private alertService: AlertService,
    private accessControlService: AccessControlService,
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      rememberMe: [true],
    })
  }

  get email() {
    return this.loginForm.get("email")!
  }

  get password() {
    return this.loginForm.get("password")!
  }

  onSubmit() {
    this.isSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    this.auth.loginAdmin(email, password, rememberMe, 1).subscribe({
      next: () => {
        this.auth.userLoaded$.pipe(
          filter(loaded => loaded),
          take(1)
        ).subscribe(() => {
          this.router.navigate(['/admin/dashboard']);
        });
      },
      error: (err) => {
        this.errorMessage = "Invalid admin credentials";
      }
    });
  }

  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  resetForm() {
    this.loginForm.reset()
    this.isSubmitted = false
  }

  getDefaultAdminRoute(): string {
    if (this.accessControlService.hasAny('DASHBOARD_VIEW', 'SUPERADMIN_PERMISSION')) {
      return '/admin/dashboard';
    }
    if (this.accessControlService.hasPermission('USER_MANAGEMENT')) {
      return '/admin/users';
    }
    return '/admin/access-denied';
  }

}
