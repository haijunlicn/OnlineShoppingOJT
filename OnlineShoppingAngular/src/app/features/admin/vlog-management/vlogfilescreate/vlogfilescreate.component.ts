import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { VlogFileDTO } from "@app/core/models/vlog";
import { VlogFileService } from "@app/core/services/vlogfiles.service";

@Component({
  selector: 'app-vlogfilescreate',
  standalone: false,
  templateUrl: './vlogfilescreate.component.html',
  styleUrls: ['./vlogfilescreate.component.css']
})
export class VlogFilesCreateComponent implements OnInit {

  newVlogFile: VlogFileDTO = {
    vlogId: 0,
    fileType: "",
    filePath: "",
   // description: "",
    title: "",
    duration: "",
    publishedDate: "",
  };

  selectedFile: File | null = null;
  uploadMessage = "";
  errorMessage = "";
  loading = false;

  constructor(
    private vlogFileService: VlogFileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const vlogIdParam = this.route.snapshot.paramMap.get('vlogId');
    const vlogId = Number(vlogIdParam);

    if (!isNaN(vlogId) && vlogId > 0) {
      this.newVlogFile.vlogId = vlogId;
    } else {
      this.errorMessage = "Invalid vlog ID!";
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadMessage = "";
      this.errorMessage = "";
    } else {
      this.selectedFile = null;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.errorMessage = "No file selected for upload.";
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.uploadMessage = "";

    this.vlogFileService.uploadImage(this.selectedFile).subscribe({
      next: (url: string) => {
        this.newVlogFile.filePath = url;
        this.newVlogFile.fileType = this.selectedFile?.type || "";
        this.uploadMessage = "File uploaded successfully!";
        this.loading = false;

        // Clear file input value to allow re-upload if needed
        const input = document.getElementById('fileUpload') as HTMLInputElement;
        if (input) input.value = '';
        this.selectedFile = null;
      },
      error: (err) => {
        this.errorMessage = "File upload failed: " + (err.error?.message || err.message || "Unknown error");
        this.loading = false;
      }
    });
  }

  createVlogFile(): void {
    if (!this.newVlogFile.vlogId || this.newVlogFile.vlogId <= 0) {
      this.errorMessage = "Vlog ID is missing or invalid.";
      return;
    }

    if (!this.newVlogFile.filePath || this.newVlogFile.filePath.trim() === '') {
      this.errorMessage = "File URL is required.";
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.uploadMessage = "";

    this.vlogFileService.createVlogFile(this.newVlogFile.vlogId, this.newVlogFile).subscribe({
      next: () => {
        this.uploadMessage = "Vlog file created successfully!";
        this.loading = false;
        this.router.navigate(['/admin/vlogfileslist'], {
          queryParams: { vlogId: this.newVlogFile.vlogId }
        });
      },
      error: (err) => {
        this.errorMessage = "Failed to create vlog file: " + (err.error?.message || err.message || "Unknown error");
        console.error("Error creating vlog file:", err);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/vlogfileslist'], {
      queryParams: { vlogId: this.newVlogFile.vlogId }
    });
  }

  isImage(): boolean {
    return !!this.newVlogFile.filePath && /\.(jpeg|jpg|png|gif)$/i.test(this.newVlogFile.filePath);
  }

  isVideo(): boolean {
    return !!this.newVlogFile.filePath && /\.(mp4|webm|ogg)$/i.test(this.newVlogFile.filePath);
  }
}
