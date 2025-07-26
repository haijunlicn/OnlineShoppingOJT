import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminAccountService } from '@app/core/services/admin-account.service';
import { AlertService } from '@app/core/services/alert.service';

@Component({
  selector: 'app-admin-account-list',
  standalone: false,
  templateUrl: './admin-account-list.component.html',
  styleUrl: './admin-account-list.component.css'
})
export class AdminAccountListComponent implements OnInit {
  adminAccounts: any[] = [];
  filteredAccounts: any[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  Math = Math; // Make Math available in template
  errorMessage: string = '';

  constructor(
    private adminAccountService: AdminAccountService,
    private http: HttpClient,
    private router: Router,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadAdminAccounts();
  }

  loadAdminAccounts(): void {
    this.isLoading = true;
    
    this.adminAccountService.getAllUsers().subscribe({
      next: (accounts: any[]) => {
        console.log('Total users received:', accounts.length);
        
        // Log first few accounts to see the data structure
        if (accounts.length > 0) {
          console.log('First account structure:', accounts[0]);
          console.log('Available properties:', Object.keys(accounts[0]));
          console.log('Role property:', accounts[0].role);
          console.log('Role type:', accounts[0].role?.type);
        }
        
        // Filter for admin accounts - exclude role type 1 (customers), include other role types (admin/staff)
        this.adminAccounts = accounts.filter(account => {
          console.log('=== CHECKING ACCOUNT ===');
          console.log('Account name:', account.name);
          console.log('Full account object:', account);
          console.log('Role object:', account.role);
          console.log('Role type:', account.role?.type);
          console.log('Role ID:', account.roleId);
          console.log('User type:', account.userType);
          
          // Try multiple ways to identify admin accounts
          const isCustomer = 
            account.role?.type === 1 || 
            account.roleId === 1 ||
            (account.userType && account.userType.toString().toLowerCase().includes('customer'));
            
          const isAdminOrStaff = 
            (account.role?.type && account.role.type !== 1) ||
            (account.roleId && account.roleId !== 1) ||
            (account.userType && !account.userType.toString().toLowerCase().includes('customer'));
          
          if (isCustomer) {
            console.log('✗ Customer account:', account.name);
            return false;
          } else if (isAdminOrStaff) {
            console.log('✓ Admin/Staff account found:', account.name);
            return true;
          } else {
            console.log('✗ Unknown account type:', account.name);
            return false;
          }
        });
        
        console.log('Final admin accounts found:', this.adminAccounts.length);
        console.log('Admin accounts:', this.adminAccounts);
        
        this.filteredAccounts = [...this.adminAccounts];
        this.totalItems = this.adminAccounts.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading admin accounts:', error);
        this.alertService.error('Failed to load admin accounts');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAccounts = [...this.adminAccounts];
    } else {
      this.filteredAccounts = this.adminAccounts.filter(account =>
        account.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        account.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        account.role?.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.totalItems = this.filteredAccounts.length;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  get paginatedAccounts(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAccounts.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  createNewAccount(): void {
    this.router.navigate(['/admin/account/create']);
  }

  editAccount(accountId: number): void {
    this.router.navigate(['/admin/admin-edit', accountId]);
  }

  deleteAccount(accountId: number, accountName: string): void {
    if (confirm(`Are you sure you want to delete admin account "${accountName}"?`)) {
      this.http.delete(`http://localhost:8080/adminAccounts/${accountId}`).subscribe({
        next: () => {
          this.alertService.success('Admin account deleted successfully');
          this.loadAdminAccounts();
        },
        error: (error: any) => {
          console.error('Error deleting admin account:', error);
          this.alertService.error('Failed to delete admin account');
        }
      });
    }
  }

  toggleAccountStatus(accountId: number, currentStatus: boolean, accountName: string): void {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} admin account "${accountName}"?`)) {
      this.http.patch(`http://localhost:8080/adminAccounts/${accountId}/status`, { isActive: newStatus }).subscribe({
        next: () => {
          this.alertService.success(`Admin account ${action}d successfully`);
          this.loadAdminAccounts();
        },
        error: (error: any) => {
          console.error(`Error ${action}ing admin account:`, error);
          let errorMessage = `Failed to ${action} admin account`;
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.alertService.error(errorMessage);
        }
      });
    }
  }

  getStatusBadgeClass(status: boolean): string {
    return status ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  trackByAccountId(index: number, account: any): any {
    return account.id;
  }

  getRoleDisplayName(account: any): string {
    // Check multiple possible role properties
    if (account.role?.name) {
      return account.role.name;
    }
    if (account.userRole) {
      return account.userRole;
    }
    if (account.roleName) {
      return account.roleName;
    }
    if (account.role?.type) {
      // Map role type to name
      switch (account.role.type) {
        case 1: return 'Customer';
        case 2: return 'Admin';
        case 3: return 'Manager';
        case 4: return 'Staff';
        default: return `Role ${account.role.type}`;
      }
    }
    if (account.roleId) {
      // Map role ID to name
      switch (account.roleId) {
        case 1: return 'Customer';
        case 2: return 'Admin';
        case 3: return 'Manager';
        case 4: return 'Staff';
        default: return `Role ID ${account.roleId}`;
      }
    }
    return 'No Role';
  }

  getCreatedDate(account: any): string {
    // Check multiple possible date properties
    const dateValue = account.createdAt || account.createdDate || account.created_at || account.dateCreated || account.registrationDate;
    
    if (dateValue) {
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (error) {
        console.error('Error parsing date:', dateValue, error);
      }
    }
    
    return 'N/A';
  }
}
