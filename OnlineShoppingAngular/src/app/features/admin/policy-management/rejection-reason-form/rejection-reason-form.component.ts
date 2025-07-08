import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RejectionReasonDTO } from '@app/core/models/refund-reason';
import { RejectionReasonService } from '@app/core/services/rejection-reason.service';

@Component({
  selector: 'app-rejection-reason-form',
  standalone: false,
  templateUrl: './rejection-reason-form.component.html',
  styleUrl: './rejection-reason-form.component.css'
})
export class RejectionReasonFormComponent implements OnInit {
  reason: RejectionReasonDTO = {
    label: '',
    allowCustomText: false // default value
  };
  isEdit = false;

  constructor(
    private rejectionService: RejectionReasonService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.rejectionService.getRejectionReasonById(+id).subscribe(data => {
        this.reason = data;
      });
    }
  }

  onSubmit() {
    if (this.isEdit) {
      this.rejectionService.updateRejectionReason(this.reason).subscribe(() => {
        this.router.navigate(['/admin/rejection-reason/list']);
      });
    } else {
      this.rejectionService.createRejectionReason(this.reason).subscribe(() => {
        this.router.navigate(['/admin/rejection-reason/list']);
      });
    }
  }
}
