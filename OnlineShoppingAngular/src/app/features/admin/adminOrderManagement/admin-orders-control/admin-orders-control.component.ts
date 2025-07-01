import { Component, type OnInit, OnDestroy } from "@angular/core"
import { OrderDetail, OrderService } from "@app/core/services/order.service";
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface Order {
  id: string
  customer: string
  email: string
  avatar: string
  date: string
  time: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  items: number
  paymentMethod: string
  priority: "high" | "medium" | "low"
}

interface StatusConfig {
  label: string
  color: string
  dot: string
}

@Component({
  selector: "app-admin-orders-control",
  standalone:false,
  templateUrl: "./admin-orders-control.component.html",
  styleUrls: ["./admin-orders-control.component.css"],
})
export class AdminOrdersControlComponent implements OnInit, OnDestroy {
  searchTerm = ""
  statusFilter = "all"
  priorityFilter = "all"
  openDropdown: string | null = null

  orders: Order[] = []
  filteredOrders: Order[] = []
  loading = false
  error: string | null = null
  private subscription: Subscription = new Subscription()

  statusConfig: Record<string, StatusConfig> = {
    pending: {
      label: "Pending",
      color: "status-pending",
      dot: "dot-pending",
    },
    processing: {
      label: "Processing",
      color: "status-processing",
      dot: "dot-processing",
    },
    shipped: {
      label: "Shipped",
      color: "status-shipped",
      dot: "dot-shipped",
    },
    delivered: {
      label: "Delivered",
      color: "status-delivered",
      dot: "dot-delivered",
    },
    cancelled: {
      label: "Cancelled",
      color: "status-cancelled",
      dot: "dot-cancelled",
    },
  }

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.fetchOrders()
  }

  fetchOrders(): void {
    this.loading = true
    this.error = null
    this.subscription.add(
      this.orderService.getAllOrders().subscribe({
        next: (orderDetails: OrderDetail[]) => {
          this.orders = orderDetails.map((o) => this.mapOrderDetailToOrder(o))
          this.filteredOrders = [...this.orders]
          this.loading = false
        },
        error: (err) => {
          this.error = 'Failed to load orders.'
          this.loading = false
        }
      })
    )
  }

  mapOrderDetailToOrder(order: OrderDetail): Order {
    // Map backend order detail to UI order
    return {
      id: order.trackingNumber || order.id.toString(),
      customer: order.user?.name || '',
      email: order.user?.email || '',
      avatar: this.getAvatar(order.user?.name),
      date: order.createdDate ? order.createdDate.split('T')[0] : '',
      time: order.createdDate ? (order.createdDate.split('T')[1]?.substring(0,5) || '') : '',
      status: this.mapStatus(order.paymentStatus),
      total: order.totalAmount,
      items: order.items?.length || 0,
      paymentMethod: order.paymentStatus || '',
      priority: this.getPriority(order.paymentStatus),
    }
  }

  getAvatar(name: string | undefined): string {
    if (!name) return ''
    const parts = name.split(' ')
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase()
  }

  mapStatus(paymentStatus: string): Order['status'] {
    // Map backend paymentStatus to UI status
    switch ((paymentStatus || '').toLowerCase()) {
      case 'pending': return 'pending'
      case 'processing': return 'processing'
      case 'shipped': return 'shipped'
      case 'delivered': return 'delivered'
      case 'cancelled': return 'cancelled'
      default: return 'pending'
    }
  }

  getPriority(paymentStatus: string): Order['priority'] {
    // Example: high for pending, medium for processing, low for others
    switch ((paymentStatus || '').toLowerCase()) {
      case 'pending': return 'high'
      case 'processing': return 'medium'
      default: return 'low'
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  get totalOrders(): number {
    return this.orders.length
  }

  get pendingOrders(): number {
    return this.orders.filter((o) => o.status === "pending").length
  }

  get processingOrders(): number {
    return this.orders.filter((o) => o.status === "processing").length
  }

  get totalRevenue(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0)
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(this.searchTerm.toLowerCase())

      const matchesStatus = this.statusFilter === "all" || order.status === this.statusFilter
      const matchesPriority = this.priorityFilter === "all" || order.priority === this.priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case "high":
        return "priority-high"
      case "medium":
        return "priority-medium"
      case "low":
        return "priority-low"
      default:
        return "priority-default"
    }
  }

  getStatusClass(status: string): string {
    return this.statusConfig[status]?.color || ""
  }

  getStatusDotClass(status: string): string {
    return this.statusConfig[status]?.dot || ""
  }

  getStatusLabel(status: string): string {
    return this.statusConfig[status]?.label || status
  }

  toggleDropdown(orderId: string): void {
    this.openDropdown = this.openDropdown === orderId ? null : orderId
  }

  // Action methods
  viewOrder(order: Order): void {
    this.router.navigate(['/admin/orderDetailAdmin', order.id]);
    this.openDropdown = null;
  }

  editOrder(order: Order): void {
    console.log("Edit order:", order)
    this.openDropdown = null
  }

  updateStatus(order: Order): void {
    console.log("Update status:", order)
    this.openDropdown = null
  }

  sendEmail(order: Order): void {
    console.log("Send email:", order)
    this.openDropdown = null
  }

  printInvoice(order: Order): void {
    console.log("Print invoice:", order)
    this.openDropdown = null
  }

  cancelOrder(order: Order): void {
    console.log("Cancel order:", order)
    this.openDropdown = null
  }

  reviewPending(): void {
    console.log("Review pending orders")
  }

  processShipments(): void {
    console.log("Process shipments")
  }

  generateReports(): void {
    console.log("Generate reports")
  }
}
