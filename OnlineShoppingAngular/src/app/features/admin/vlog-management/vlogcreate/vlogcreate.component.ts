import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VlogDTO } from '@app/core/models/vlog';
import { VlogService } from '@app/core/services/vlog.service';
import { VlogFileDTO } from '@app/core/models/vlog';
import { VlogFileService } from '@app/core/services/vlogfiles.service';

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
    vlogId: 0
  };

  // Vlog file create logic
  newVlogFile: VlogFileDTO = {
    vlogId: 0,
    fileType: '',
    filePath: '',
    title: '',
  };
  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  uploadMessage = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private vlogService: VlogService,
    private vlogFileService: VlogFileService,
    private router: Router
  ) {}

  // Upload all images and create vlog
  async onSubmit(): Promise<void> {
    if (!this.newVlog.title || !this.newVlog.vlogContent) {
      this.errorMessage = 'Title and Content are required.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      // 1. Upload all images/videos first
      const urls = await Promise.all(
        this.selectedFiles.map(file => this.vlogFileService.uploadImage(file).toPromise())
      );
      const filteredUrls: string[] = urls.filter((url): url is string => typeof url === 'string');
      if (filteredUrls.length !== this.selectedFiles.length) {
        this.errorMessage = 'Some files failed to upload.';
        this.loading = false;
        return;
      }

      // 2. Prepare VlogFilesDTO[] for each file
      const vlogFiles = filteredUrls.map((url, idx) => ({
        filePath: url,
        fileType: this.selectedFiles[idx].type,
        vlogId: 0 // will be set by backend
      }));

      // 3. Prepare VlogDTO with vlogFiles array
      const vlogDto: VlogDTO = {
        title: this.newVlog.title,
        vlogContent: this.newVlog.vlogContent,
        vlogFiles: vlogFiles,
        vlogId: 0 // Add vlogId to satisfy VlogDTO type
      };

      // 4. Create the Vlog (with files)
      const createdVlog = await this.vlogService.createVlog(vlogDto).toPromise();
      if (!createdVlog || !createdVlog.id) {
        this.errorMessage = 'Failed to create blog.';
        this.loading = false;
        return;
      }

      this.successMessage = 'Blog and files created successfully!';
      this.loading = false;
      this.router.navigate(['/admin/bloglist']);
    } catch (error: any) {
      if (error && error.error && error.error.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'Failed to create blog or upload files. Please try again.';
      }
      this.loading = false;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      console.log('Selected files:', this.selectedFiles);
      this.filePreviews = [];
      this.selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviews.push(e.target.result);
          if (this.filePreviews.length === this.selectedFiles.length) {
            console.log('File previews:', this.filePreviews);
          }
        };
        reader.readAsDataURL(file);
      });
      this.uploadMessage = '';
      this.errorMessage = '';
    } else {
      this.selectedFiles = [];
      this.filePreviews = [];
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/bloglist']);
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }
}
