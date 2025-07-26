import { Component, Input, OnInit } from "@angular/core";
import { VlogFileDTO, VlogDTO, VlogComment } from "@app/core/models/vlog";
import { VlogFileService } from "@app/core/services/vlogfiles.service";
import { VlogCommentService } from "@app/core/services/vlog-comment.service";
import { AuthService } from "@app/core/services/auth.service";
import { VlogService } from "@app/core/services/vlog.service";

@Component({
  selector: "app-vlog",
  templateUrl: "./vlog.component.html",
  styleUrls: ["./vlog.component.css"],
  standalone: false,
})
export class VlogComponent implements OnInit {
  allVlogFiles: VlogFileDTO[] = [];
  filteredVlogFiles: VlogFileDTO[] = [];
  selectedVlog: VlogDTO | null = null;
  selectedVlogFile: VlogFileDTO | null = null;
  featuredVlog: VlogFileDTO | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  searchTerm = "";
  selectedCategory = "All";
  allVlogs: VlogDTO[] = [];
  filteredVlogList: VlogDTO[] = [];
  @Input() parentVlogs: VlogDTO[] = []
  currentVlogFiles: VlogFileDTO[] = [];
  currentSlideIndex = 0;


  constructor(
    private vlogFileService: VlogFileService,
    private vlogService:VlogService,
    private vlogCommentService: VlogCommentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Load all vlogs (VlogDTO[])
    this.vlogService.getAllVlogs().subscribe({
      next: (vlogs) => {
        this.allVlogs = vlogs;
        // After loading vlogs, load files
        this.getAllVlogFiles();
      },
      error: (error) => {
        console.error('❌ Error fetching vlogs:', error);
        this.errorMessage = 'Failed to load vlogs. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  getAllVlogFiles(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.vlogFileService.getFiles().subscribe({
      next: (files) => {
        this.allVlogFiles = files.map((file) => ({
          ...file,
          title: file.title || `Vlog ${file.id || "Unknown"}`,
        }));

        // Debug: Log allVlogFiles
        console.log('allVlogFiles:', this.allVlogFiles);

        this.featuredVlog =
          this.allVlogFiles.find((v) => v.id === 1) ||
          this.allVlogFiles[0] ||
          null;

        this.applyFiltersAndSearch();

        if (this.featuredVlog) {
          this.onVlogSelected(this.featuredVlog);
        } else if (this.filteredVlogFiles.length > 0) {
          this.onVlogSelected(this.filteredVlogFiles[0]);
        }

        this.isLoading = false;
        // Debug logs
        console.log('allVlogs:', this.allVlogs);
        console.log('filteredVlogFiles:', this.filteredVlogFiles);
        // Log mapping between VlogFileDTO.vlogId and VlogDTO.id
        this.allVlogFiles.forEach(file => {
          const match = this.allVlogs.find(v => v.id === file.vlogId);
          console.log('file.vlogId:', file.vlogId, 'matched VlogDTO:', match);
        });
      },
      error: (error) => {
        console.error("❌ Error fetching vlog files:", error);
        this.errorMessage = "Failed to load vlogs. Please try again later.";
        this.isLoading = false;
      },
    });
  }

  applyFiltersAndSearch(): void {
    let tempFiles = [...this.allVlogFiles];
    console.log('searchTerm:', this.searchTerm);
    if (this.searchTerm && this.searchTerm.trim()) {
      const lowerSearch = this.searchTerm.toLowerCase();
      tempFiles = tempFiles.filter(file =>
        file.title?.toLowerCase().includes(lowerSearch)
      );
    }
    this.filteredVlogFiles = tempFiles;
    console.log('filteredVlogFiles:', this.filteredVlogFiles);
  }

  onVlogSelected(vlogFile: VlogFileDTO): void {
    this.selectedVlogFile = vlogFile;
    // Find all files for the same vlogId
    this.currentVlogFiles = this.allVlogFiles.filter(f => f.vlogId === vlogFile.vlogId);
    this.currentSlideIndex = 0;
  }

  nextSlide(): void {
    if (this.currentVlogFiles.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.currentVlogFiles.length;
    }
  }

  prevSlide(): void {
    if (this.currentVlogFiles.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex - 1 + this.currentVlogFiles.length) % this.currentVlogFiles.length;
    }
  }

  onSearchTermChange(newTerm: string): void {
    this.searchTerm = newTerm;
    this.applyFiltersAndSearch();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFiltersAndSearch();
  }

  getFirstVideoFile(files: VlogFileDTO[]): VlogFileDTO | null {
    if (!files) return null;
    return files.find(f => f.fileType && (f.fileType.toLowerCase().includes('video') || f.fileType.toLowerCase().includes('mp4') || f.fileType.toLowerCase().includes('mov') || f.fileType.toLowerCase().includes('avi'))) || null;
  }

  getFirstImageFile(files: VlogFileDTO[]): VlogFileDTO | null {
    if (!files) return null;
    return files.find(f =>
      f.fileType && (
        f.fileType.toLowerCase().includes('image') ||
        f.fileType.toLowerCase().includes('jpg') ||
        f.fileType.toLowerCase().includes('jpeg') ||
        f.fileType.toLowerCase().includes('png') ||
        f.fileType.toLowerCase().includes('gif')
      )
    ) || null;
  }
    getCurrentVlog(): VlogDTO | undefined {
    if (!this.selectedVlogFile || !this.allVlogs) return undefined;
    // Try to match by vlogId first, fallback to id if needed
    return this.allVlogs.find(v => v.id === this.selectedVlogFile?.vlogId || v.id === this.selectedVlogFile?.id);
  }
}
