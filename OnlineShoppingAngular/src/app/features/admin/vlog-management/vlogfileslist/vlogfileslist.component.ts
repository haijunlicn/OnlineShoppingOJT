import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { VlogFileDTO } from "@app/core/models/vlog";
import { VlogFileService } from "@app/core/services/vlogfiles.service";

@Component({
  selector: 'app-vloglist',
  standalone: false,
  templateUrl: './vlogfileslist.component.html',
  styleUrls: ['./vlogfileslist.component.css']
})
export class VlogFilesListComponent implements OnInit {
  vlogFiles: VlogFileDTO[] = [];
  allVlogFiles: VlogFileDTO[] = [];
  currentVlogId: number | null = null;
  loading = false;
  errorMessage = "";

  constructor(
    private vlogFileService: VlogFileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadVlogFiles();
  }

  loadVlogFiles(): void {
    this.loading = true;
    this.vlogFileService.getAllFiles().subscribe({
      next: (files) => {
        this.allVlogFiles = files;
        console.log('Loaded files:', files);
        // Debug: Log each file's fileType and filePath
        files.forEach(file => {
          console.log('fileType:', file.fileType, 'filePath:', file.filePath);
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Failed to load vlog files.";
        this.loading = false;
        console.error(err);
      }
    });
  }


  applyFilter(): void {
    if (this.currentVlogId && this.currentVlogId > 0) {
      this.vlogFiles = this.allVlogFiles.filter(f => f.vlogId === this.currentVlogId);
    } else {
      this.vlogFiles = this.allVlogFiles;
    }
  }

  deleteVlogFile(id: number | undefined): void {
    if (id === undefined) {
      this.errorMessage = "Cannot delete: Vlog file ID is missing.";
      return;
    }
    if (!confirm("Are you sure you want to delete this vlog file?")) {
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.vlogFileService.deleteVlogFile(id).subscribe({
      next: () => {
        this.vlogFiles = this.vlogFiles.filter((file) => file.id !== id);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = "Failed to delete vlog file: " + (err.message || err.statusText);
        this.loading = false;
        console.error("Error deleting vlog file:", err);
      },
    });
  }

  isImage(fileType?: string): boolean {
  if (!fileType) return false;
  const type = fileType.toLowerCase();
  return type.startsWith('image') || type.endsWith('jpg') || type.endsWith('jpeg') || type.endsWith('png') || type.endsWith('gif');
}

  isVideo(fileType?: string): boolean {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return type.includes('video') || type.includes('mp4');
  }
}