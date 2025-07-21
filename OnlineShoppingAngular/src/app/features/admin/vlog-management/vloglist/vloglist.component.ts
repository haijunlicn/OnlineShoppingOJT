import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VlogDTO } from '@app/core/models/vlog';
import { VlogService } from '@app/core/services/vlog.service';

@Component({
  selector: 'app-vloglist',
  standalone: false,
  templateUrl: './vloglist.component.html',
  styleUrls: ['./vloglist.component.css'],
})
export class VlogListComponent implements OnInit {
  vlogs: VlogDTO[] = [];
  loading = false;
  errorMessage = '';

  constructor(private vlogService: VlogService, private router: Router) {}

  ngOnInit(): void {
    this.loadVlogs();
  }

  loadVlogs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.vlogService.getAllVlogs().subscribe({
      next: (data) => {
        this.vlogs = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load vlogs: ' + (err.message || err.statusText);
        this.loading = false;
        console.error(err);
      },
    });
  }

goToAddFile(id?: number): void {
  if (id) {
    this.router.navigate(['/admin/vlogfilescreate', id]);
  }
}


  goToEdit(id?: number): void {
    if (id) this.router.navigate(['/vlog/edit', id]);
  }

  deleteVlog(id?: number): void {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this vlog?')) return;

    this.loading = true;
    this.errorMessage = '';
    this.vlogService.deleteVlog(id).subscribe({
      next: () => {
        this.vlogs = this.vlogs.filter((v) => v.id !== id);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete vlog: ' + (err.message || err.statusText);
        this.loading = false;
        console.error(err);
      },
    });
  }
}
