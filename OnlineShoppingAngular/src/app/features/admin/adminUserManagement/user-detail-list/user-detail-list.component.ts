import { Component, OnInit } from '@angular/core';
import { AdminAccountService } from '@app/core/services/admin-account.service';
import { RefundRequestService } from '@app/core/services/refundRequestService';
import { User } from '@app/core/models/User';
import { RefundRequestDTO } from '@app/core/models/refund.model';
import { PdfExportService } from '@app/core/services/pdf-export.service';
import { ExcelExportService } from '@app/core/services/excel-export.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface UserListRow extends User {
  orderCount: number;
  refundCount: number;
}

@Component({
  selector: 'app-user-detail-list',
  standalone: false,
  templateUrl: './user-detail-list.component.html',
  styleUrl: './user-detail-list.component.css'
})
export class UserDetailListComponent implements OnInit {
  users: UserListRow[] = [];
  filteredUsers: UserListRow[] = [];
  isLoading = false;
  errorMessage = '';

  filterName = '';
  filterEmail = '';
  filterCity = '';

  constructor(
    private adminAccountService: AdminAccountService,
    private refundRequestService: RefundRequestService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserList();
  }

  refreshData(): void {
    this.loadUserList();
  }

  exportUsersToPdf(): void {
    const exportData = this.filteredUsers.map(u => ({
      Name: u.name,
      Email: u.email,
      City: u.city || '-',
      'Order Count': u.orderCount,
      'Refund Count': u.refundCount
    }));
    const columns = [
      { header: 'Name', field: 'Name', width: 40 },
      { header: 'Email', field: 'Email', width: 50 },
      { header: 'City', field: 'City', width: 30 },
      { header: 'Order Count', field: 'Order Count', width: 20 },
      { header: 'Refund Count', field: 'Refund Count', width: 20 }
    ];
    try {
      this.pdfExportService.exportTableToPdf(
        exportData,
        columns,
        'CustomerList.pdf',
        'Customer List Report',
        'customer'
      );
      this.snackBar.open('Exported as PDF', 'Close', { duration: 2000 });
    } catch (err) {
      this.snackBar.open('Failed to export as PDF', 'Close', { duration: 2000 });
    }
  }

  async exportUsersToExcel(): Promise<void> {
    const exportData = this.filteredUsers.map(u => ({
      Name: u.name,
      Email: u.email,
      City: u.city || '-',
      'Order Count': u.orderCount,
      'Refund Count': u.refundCount
    }));
    const columns = [
      { header: 'Name', field: 'Name', width: 40 },
      { header: 'Email', field: 'Email', width: 50 },
      { header: 'City', field: 'City', width: 30 },
      { header: 'Order Count', field: 'Order Count', width: 20 },
      { header: 'Refund Count', field: 'Refund Count', width: 20 }
    ];
    try {
      await this.excelExportService.exportToExcel(
        exportData,
        columns,
        'CustomerList.xlsx',
        'Customers',
        'Customer List Report'
      );
      this.snackBar.open('Exported as Excel', 'Close', { duration: 2000 });
    } catch (err) {
      this.snackBar.open('Failed to export as Excel', 'Close', { duration: 2000 });
    }
  }

  private loadUserList(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // Fetch all customers, user stats, and all refund requests in parallel
    Promise.all([
      this.adminAccountService.getAllCustomers().toPromise(),
      this.adminAccountService.getUserStats().toPromise(),
      this.refundRequestService.getRefundRequestList().toPromise()
    ]).then((result) => {
      const users: User[] = result[0] || [];
      const stats: any[] = result[1] || [];
      const refunds: RefundRequestDTO[] = result[2] || [];
      // Map userId to orderCount
      const statsMap = new Map<number, { orderCount: number }>();
      stats.forEach((s: any) => statsMap.set(s.userId, { orderCount: s.orderCount || 0 }));
      // Map userId to refundCount
      const refundCountMap = new Map<number, number>();
      refunds.forEach(r => {
        if (r.userId != null) {
          refundCountMap.set(r.userId, (refundCountMap.get(r.userId) || 0) + 1);
        }
      });
      // Merge data
      this.users = users.map(u => ({
        ...u,
        orderCount: statsMap.get(u.id)?.orderCount || 0,
        refundCount: refundCountMap.get(u.id) || 0
      }));
      this.filteredUsers = [...this.users];
      this.isLoading = false;
    }).catch(err => {
      this.errorMessage = 'Failed to load user list.';
      this.isLoading = false;
    });
  }

  onFilterChange(): void {
    let filtered = [...this.users];
    if (this.filterName.trim()) {
      const name = this.filterName.trim().toLowerCase();
      filtered = filtered.filter(u => u.name && u.name.toLowerCase().includes(name));
    }
    if (this.filterEmail.trim()) {
      const email = this.filterEmail.trim().toLowerCase();
      filtered = filtered.filter(u => u.email && u.email.toLowerCase().includes(email));
    }
    if (this.filterCity.trim()) {
      const city = this.filterCity.trim().toLowerCase();
      filtered = filtered.filter(u => u.city && u.city.toLowerCase().includes(city));
    }
    this.filteredUsers = filtered;
  }

  clearFilters(): void {
    this.filterName = '';
    this.filterEmail = '';
    this.filterCity = '';
    this.filteredUsers = [...this.users];
  }

  // For template: show message if no orders/refunds
  getOrderCountDisplay(user: UserListRow): string {
    return user.orderCount > 0 ? user.orderCount.toString() : 'No orders';
  }
  getRefundCountDisplay(user: UserListRow): string {
    return user.refundCount > 0 ? user.refundCount.toString() : 'No refunds';
  }
}
