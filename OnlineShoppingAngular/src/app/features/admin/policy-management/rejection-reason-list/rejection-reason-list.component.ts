import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RejectionReasonDTO } from '@app/core/models/refund-reason';
import { RejectionReasonService } from '@app/core/services/rejection-reason.service';

@Component({
  selector: 'app-rejection-reason-list',
  standalone: false,
  templateUrl: './rejection-reason-list.component.html',
  styleUrl: './rejection-reason-list.component.css'
})
export class RejectionReasonListComponent implements OnInit {
  reasons: RejectionReasonDTO[] = [];

  constructor(
    private rejectionService: RejectionReasonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReasons();
  }

  loadReasons(): void {
    this.rejectionService.getAllRejectionReasons().subscribe(data => {
      this.reasons = data;
    });
  }

  edit(id: number): void {
    this.router.navigate(['/admin/rejection-reason/update', id]);
  }

  delete(id: number): void {
    if (confirm('Are you sure you want to delete this reason?')) {
      this.rejectionService.deleteRejectionReason(id).subscribe(() => {
        this.loadReasons(); // refresh list after delete
      });
    }
  }
}
