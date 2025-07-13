import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RefundReasonDTO } from '@app/core/models/refund-reason';
import { RefundReasonService } from '@app/core/services/refund-reason.service';

@Component({
  selector: 'app-refund-reason-list',
  standalone: false,
  templateUrl: './refund-reason-list.component.html',
  styleUrl: './refund-reason-list.component.css'
})
export class RefundReasonListComponent implements OnInit {
  reasons: RefundReasonDTO[] = [];

  constructor(
    private refundService: RefundReasonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReasons();
  }

  loadReasons(): void {
    this.refundService.getAll().subscribe({
      next: data => this.reasons = data,
      error: err => console.error('Error loading refund reasons:', err)
    });
  }

  edit(id: number): void {
    this.router.navigate(['/admin/refund-reason/update', id]);
  }

  delete(id: number): void {
    if (confirm('Are you sure you want to delete this refund reason?')) {
      this.refundService.delete(id).subscribe({
        next: () => this.loadReasons(),
        error: err => console.error('Error deleting refund reason:', err)
      });
    }
  }
}
