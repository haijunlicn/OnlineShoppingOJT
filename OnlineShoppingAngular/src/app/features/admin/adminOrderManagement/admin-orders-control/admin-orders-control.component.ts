import { Component, type OnInit, OnDestroy } from "@angular/core"
import { OrderDetail, OrderService } from "@app/core/services/order.service";
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { log } from "node:console";
import Swal from 'sweetalert2';

interface Order {
  id: number
  trackingNumber: string
  customer: string
  email: string
  avatar: string
  date: string
  time: string
  status: "pending" | "order_confirmed" | "packed" | "out_for_delivery" | "delivered" | "cancelled"
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
    order_confirmed: {
      label: "Order Confirmed",
      color: "status-processing",
      dot: "dot-processing",
    },
    packed: {
      label: "Packed",
      color: "status-processing",
      dot: "dot-processing",
    },
    out_for_delivery: {
      label: "Out for Delivery",
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
    }
  }

  selectedOrderIds: number[] = [];
  bulkStatus: string = '';
  bulkNote: string = '';
  bulkStatusLoading = false;
  bulkStatusError: string | null = null;

  selectedOrderForStatus: Order | null = null;
  showSingleStatusModal = false;
  singleStatus: string = '';
  singleNote: string = '';
  singleStatusLoading = false;
  singleStatusError: string | null = null;

  adminId: number | null = null;

  // Database id/code mapping
  statusMap: any = {
    pending: 0, // 0 or null if not in DB, but needed for UI
    order_confirmed: 1,
    packed: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: 5
  };

  // UI <-> DB mapping
  uiToDbStatus: any = {
    pending: 0, // 0 or null if not in DB, but needed for UI
    order_confirmed: 1,
    packed: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: 5
  };

  // DB -> UI mapping
  dbToUiStatus: any = {
    PENDING: 'pending',
    ORDER_CONFIRMED: 'order_confirmed',
    PACKED: 'packed',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  };

  allowedTransitions: Record<Order['status'], Order['status'][]> = {
    pending: ['order_confirmed', 'cancelled'],
    order_confirmed: ['packed', 'cancelled'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: []
  };

  statusList: Order['status'][] = [
    'pending',
    'order_confirmed',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  constructor(private orderService: OrderService, private router: Router, private location: Location, private authService: AuthService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Get adminId from AuthService
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.adminId = user.id;
    } else {
      // Optionally, redirect to login if not authenticated
      this.router.navigate(['/admin/login']);
      return;
    }
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

  // Format time to 12-hour with AM/PM
  formatTime12hr(timeStr: string): string {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${minute} ${ampm}`;
  }

  mapOrderDetailToOrder(order: OrderDetail): Order {
    return {
      id: order.id,
      trackingNumber: order.trackingNumber,
      customer: order.user?.name || '',
      email: order.user?.email || '',
      avatar: this.getAvatar(order.user?.name),
      date: order.createdDate ? order.createdDate.split('T')[0] : '',
      time: order.createdDate ? this.formatTime12hr(order.createdDate.split('T')[1]?.substring(0,5) || '') : '',
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
    switch ((paymentStatus || '').toUpperCase()) {
      case 'PENDING': return 'pending';
      case 'ORDER_CONFIRMED': return 'order_confirmed';
      case 'PACKED': return 'packed';
      case 'OUT_FOR_DELIVERY': return 'out_for_delivery';
      case 'DELIVERED': return 'delivered';
      case 'CANCELLED': return 'cancelled';
      default: return 'pending'; // fallback to pending if unknown
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
    return this.orders.filter((o) => o.status === "order_confirmed").length
  }

  get totalRevenue(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0)
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter((order) => {
      const matchesSearch =
        order.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
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

  // Action methods
  viewOrder(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/admin/orderDetailAdmin', order.id]);
  }

  editOrder(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    console.log('Edit Order clicked:', order);
    alert(`Edit order #${order.id}`);
  }

  updateStatus(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    console.log("Update status:", order)
  }

  sendEmail(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    console.log('Send Email clicked:', order);
    alert(`Send email for order #${order.id}`);
  }

  printInvoice(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    console.log('Print Invoice clicked:', order);
    alert(`Print invoice for order #${order.id}`);
  }

  cancelOrder(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    console.log('Cancel Order clicked:', order);
    alert(`Cancel order #${order.id}`);
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

  isSelected(order: Order): boolean {
    return this.selectedOrderIds.includes(order.id);
  }

  isAllSelected(): boolean {
    return this.filteredOrders.length > 0 && this.filteredOrders.every(order => this.selectedOrderIds.includes(order.id));
  }

  toggleSelectOrder(order: Order, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedOrderIds.includes(order.id)) {
        this.selectedOrderIds.push(order.id);
      }
    } else {
      this.selectedOrderIds = this.selectedOrderIds.filter(id => id !== order.id);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedOrderIds = this.filteredOrders.map(order => order.id);
    } else {
      this.selectedOrderIds = [];
    }
  }

  confirmBulkStatusUpdate(): void {
    if (!this.bulkStatus || this.selectedOrderIds.length === 0 || !this.adminId) return;

    // Step-by-step check for all selected orders
    const invalidOrders = this.orders.filter(o =>
      this.selectedOrderIds.includes(o.id) &&
      !(this.allowedTransitions[o.status] || []).includes(this.bulkStatus as Order['status'])
    );
    if (invalidOrders.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Bulk Status Change',
        text: `Some selected orders cannot be changed to "${this.getStatusLabel(this.bulkStatus as Order['status'])}". Please select only valid orders.`,
      });
      return;
    }

    this.bulkStatusLoading = true;
    this.bulkStatusError = null;
    const statusId = this.uiToDbStatus[this.bulkStatus];
    const orderIds = this.selectedOrderIds;
    const updatedBy = this.adminId;
    this.orderService.bulkUpdateOrderStatus(orderIds, statusId, this.bulkNote, updatedBy).subscribe({
      next: (updatedOrders) => {
        updatedOrders.forEach((updatedOrder: any) => {
          const idx = this.orders.findIndex(o => o.id === updatedOrder.id);
          if (idx !== -1) {
            this.orders[idx].status = this.dbToUiStatus[updatedOrder.paymentStatus];
          }
        });
        this.filteredOrders = [...this.orders];
        this.bulkStatusLoading = false;
        this.bulkStatus = '';
        this.bulkNote = '';
        this.selectedOrderIds = [];
        this.bulkStatusError = null;
      },
      error: (err) => {
        this.bulkStatusLoading = false;
        this.bulkStatusError = 'Failed to update status.';
      }
    });
  }

  openSingleStatusModal(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedOrderForStatus = order;
    this.showSingleStatusModal = true;
    this.singleStatus = '';
    this.singleNote = '';
    this.singleStatusError = null;
  }

  closeSingleStatusModal(): void {
    this.showSingleStatusModal = false;
    this.selectedOrderForStatus = null;
    this.singleStatus = '';
    this.singleNote = '';
    this.singleStatusError = null;
  }

  confirmSingleStatusUpdate(): void {
    if (!this.singleStatus || !this.selectedOrderForStatus || !this.adminId) return;

    // Step-by-step check
    const currentStatus = this.selectedOrderForStatus.status;
    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(this.singleStatus as Order['status'])) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Status Change',
        text: `You can only change status from "${this.getStatusLabel(currentStatus)}" to "${allowed.map(s => this.getStatusLabel(s)).join(', ') || 'No further status'}".`,
      });
      return;
    }

    this.singleStatusLoading = true;
    this.singleStatusError = null;
    const statusId = this.statusMap[this.singleStatus];
    const orderId = this.selectedOrderForStatus.id;
    const updatedBy = this.adminId;

    this.orderService.updateOrderStatus(orderId, statusId, this.singleNote, updatedBy).subscribe({
      next: () => {
        this.singleStatusLoading = false;
        this.closeSingleStatusModal();
        this.fetchOrders();
      },
      error: (err) => {
        this.singleStatusLoading = false;
        this.singleStatusError = 'Failed to update status.';
      }
    });
  }

  showActionFeedback(message: string) {
    this.snackBar.open(message, 'Close', { duration: 2000 });
  }

  // Dynamic filter options
  get uniqueStatuses(): Order['status'][] {
    const statuses = this.orders.map(o => o.status);
    return Array.from(new Set(statuses));
  }

  get uniquePriorities(): Order['priority'][] {
    const priorities = this.orders.map(o => o.priority);
    return Array.from(new Set(priorities));
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.filterOrders();
  }
}
