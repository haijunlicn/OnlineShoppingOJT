import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RefundReasonDTO } from '@app/core/models/refund-reason';
import { RefundReasonService } from '@app/core/services/refund-reason.service';

@Component({
 selector: 'app-refund-reason',
  standalone: false,
  templateUrl: './refund-reason.component.html',
  styleUrl: './refund-reason.component.css'
})
export class RefundReasonFormComponent implements OnInit {
  reason: RefundReasonDTO = {
    label: '',
    allowCustomText: false
  };
  isEdit = false;

  constructor(
    private refundService: RefundReasonService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.refundService.getById(+id).subscribe({
        next: data => this.reason = data,
        error: err => console.error('Failed to load refund reason:', err)
      });
    }
  }

  onSubmit(): void {
    if (this.isEdit) {
      this.refundService.update(this.reason).subscribe(() => {
        this.router.navigate(['/admin/refund-reason/list']);
      });
    } else {
      this.refundService.create(this.reason).subscribe(() => {
        this.router.navigate(['/admin/refund-reason/list']);
      });
    }
  }
}
