import { Component } from '@angular/core';
import { ExcelUploadService } from '../../../../core/services/excel-upload.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-product-bulk-upload',
  standalone: false,
  templateUrl: './product-bulk-upload.component.html',
  styleUrl: './product-bulk-upload.component.css'
})
export class ProductBulkUploadComponent {
  zipFile: File | null = null;
  uploadStatus: string = '';
  isLoading: boolean = false;

  constructor(
    private productService: ProductService
  ) { }

  onZipFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      this.zipFile = file;
      this.uploadStatus = `ZIP file selected: ${file.name}`;
    } else {
      this.zipFile = null;
      this.uploadStatus = 'Please select a valid ZIP file';
    }
  }

  downloadTemplate(): void {
    this.uploadStatus = 'Downloading template...';
    this.isLoading = true;

    this.productService.downloadTemplate().subscribe({
      next: (blob) => {
        this.isLoading = false;
        this.uploadStatus = 'Download completed!';

        // Create a link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_upload_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.isLoading = false;
        this.uploadStatus = 'Download failed!';
        console.error('Download error', err);
      }
    });
  }

  uploadZipFile(): void {
    if (!this.zipFile) {
      alert('Please select a ZIP file first!');
      return;
    }

    this.isLoading = true;
    this.uploadStatus = 'Uploading...';

    const formData = new FormData();
    formData.append('zipFile', this.zipFile);

    this.productService.uploadZip(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          this.isLoading = false;
          this.uploadStatus = 'Upload successful!';
          alert('Upload completed!');
          this.zipFile = null;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error(err);
        this.uploadStatus = 'Upload failed!';
        alert('Upload failed!');
      }
    });
  }

}
