import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VlogDTO } from '@app/core/models/vlog';
import { VlogService } from '@app/core/services/vlog.service';

@Component({
  selector: 'app-vlogcreate',
  standalone: false,
  templateUrl: './vlogcreate.component.html',
  styleUrls: ['./vlogcreate.component.css'],
})
export class VlogCreateComponent {
  newVlog: VlogDTO = {
    title: '',
    vlogContent: '',
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private vlogService: VlogService, private router: Router) {}

  createVlog(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newVlog.title || !this.newVlog.vlogContent) {
      this.errorMessage = 'Title and Content are required.';
      this.loading = false;
      return;
    }

    this.vlogService.createVlog(this.newVlog).subscribe({
      next: (created) => {
        this.successMessage = 'Vlog created successfully!';
        this.loading = false;
        this.router.navigate(['/admin/vloglist']); // Navigate to list after success
      },
      error: (err) => {
        this.errorMessage = 'Failed to create vlog: ' + (err.message || err.statusText);
        this.loading = false;
        console.error(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/vloglist']);
  }
}
