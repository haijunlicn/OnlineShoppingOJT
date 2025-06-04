import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  ngAfterViewInit(): void {
    // For toggle button logic
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sb-sidenav-toggled');
      });
    }
  }

  tasks = [
    {
      id: '#101',
      title: 'Homepage Redesign',
      priority: 'High',
      iteration: 'Sprint 5',
      assignee: 'Jane Doe',
      status: 'Completed',
      timeline: '2025-05-01 → 2025-05-15',
    },
    {
      id: '#102',
      title: 'Product Page UX',
      priority: 'Medium',
      iteration: 'Sprint 6',
      assignee: 'John Smith',
      status: 'In Progress',
      timeline: '2025-05-20 → 2025-06-05',
    },
    {
      id: '#103',
      title: 'Checkout API',
      priority: 'High',
      iteration: 'Sprint 6',
      assignee: 'Amara Lin',
      status: 'Pending',
      timeline: '2025-06-01 → 2025-06-10',
    },
    {
      id: '#104',
      title: 'Admin Dashboard',
      priority: 'Low',
      iteration: 'Sprint 4',
      assignee: 'Raj Mehta',
      status: 'Completed',
      timeline: '2025-04-10 → 2025-04-25',
    },
  ];

  getAssigneeColor(name: string): string {
    // Simple hash for color selection
    const colors = ['#007bff', '#6f42c1', '#fd7e14', '#20c997', '#17a2b8', '#dc3545'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  allCinemas = [
    {
      id: 1,
      imageUrl: 'assets/cinema1.jpg',
      name: 'Galaxy Cinema',
      rowCount: 12,
      townshipName: 'Tamwe',
      stateName: 'Yangon',
      status: 1,
      createdDate: new Date('2025-05-01')
    },
    {
      id: 2,
      imageUrl: '',
      name: 'Starlight Cinema',
      rowCount: 10,
      townshipName: 'Hlaing',
      stateName: 'Yangon',
      status: 0,
      createdDate: new Date('2025-05-05')
    },
    {
      id: 3,
      imageUrl: 'assets/cinema3.jpg',
      name: 'Sunshine Theater',
      rowCount: 14,
      townshipName: 'Mandalay',
      stateName: 'Mandalay',
      status: 1,
      createdDate: new Date('2025-05-10')
    },
    // Add more fake data here if needed
  ];

  pageSize = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.allCinemas.length / this.pageSize);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedCinemas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.allCinemas.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

}
