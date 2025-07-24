import { Component, OnInit } from "@angular/core";
import { VlogDTO, VlogFileDTO, VlogComment } from "@app/core/models/vlog";
import { VlogService } from "@app/core/services/vlog.service";
import { VlogFileService } from "@app/core/services/vlogfiles.service";
import { VlogCommentService } from "@app/core/services/vlog-comment.service";
import { AuthService } from "@app/core/services/auth.service";

@Component({
  selector: "app-vlog",
  standalone: false,
  templateUrl: "./vlog.component.html",
  styleUrls: ["./vlog.component.css"],
})
export class VlogComponent implements OnInit {
  // For Video List
  allVlogFiles: VlogFileDTO[] = [];
  filteredVlogFiles: VlogFileDTO[] = [];
  selectedVlogFile: VlogFileDTO | null = null;
  
  // For Comments and Details (associated with the selected video file)
  currentVlog: VlogDTO | null = null;
  comments: VlogComment[] = [];
  
  // UI State
  isLoading = true;
  errorMessage: string | null = null;
  isPostingComment = false;
  
  // Filtering & Search
  searchTerm = "";
  selectedCategory = "All";
  categories: string[] = ["All", "How-to", "Product Demo", "Travel", "Reviews"];

  commentText = "";

  constructor(
    private vlogService: VlogService,
    private vlogFileService: VlogFileService,
    private vlogCommentService: VlogCommentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getAllVlogFiles();
  }

  // --- Data Loading ---

  getAllVlogFiles(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.vlogFileService.getAllFiles().subscribe({
      next: (files) => {
        this.allVlogFiles = files;
        this.applyFiltersAndSearch();
        this.isLoading = false;
        
        if (this.filteredVlogFiles.length > 0) {
          this.onVlogSelected(this.filteredVlogFiles[0]);
        }
      },
      error: (error) => {
        console.error("Error fetching vlog files:", error);
        this.errorMessage = "Failed to load vlogs. Please try again later.";
        this.isLoading = false;
      },
    });
  }

  loadVlogDetails(vlogId: number): void {
    this.vlogService.getById(vlogId).subscribe({
        next: (vlogData) => {
            this.currentVlog = vlogData;
            this.loadComments(vlogData.id!);
        },
        error: (err) => {
            console.error(`Failed to load vlog details for id ${vlogId}`, err);
            this.errorMessage = "Could not load vlog details.";
        }
    });
  }

  loadComments(vlogId: number): void {
    this.vlogCommentService.getCommentsByVlogId(vlogId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (err) => {
        this.comments = [];
        console.error("Failed to load comments:", err);
      },
    });
  }

  // --- User Actions ---

  onVlogSelected(vlogFile: VlogFileDTO): void {
    this.selectedVlogFile = vlogFile;
    this.currentVlog = null; // Reset details while loading
    this.comments = [];
    
    if (vlogFile.vlogId) {
      this.loadVlogDetails(vlogFile.vlogId);
    }
  }

  postComment(): void {
    if (!this.currentVlog?.id || !this.commentText.trim()) return;

    this.isPostingComment = true;
    const currentUser = this.authService.getCurrentUser();

    const newComment: VlogComment = {
      author: currentUser?.name || "Anonymous",
      text: this.commentText.trim(),
      avatarInitial: currentUser?.name?.charAt(0).toUpperCase() || "A",
      commentDate: new Date().toISOString(),
      vlogId: this.currentVlog.id, // Use ID from the fetched VlogDTO
      userId: currentUser?.id,
    };

    this.vlogCommentService.createComment(newComment).subscribe({
      next: (createdComment) => {
        this.comments.unshift(createdComment);
        this.commentText = "";
        this.isPostingComment = false;
      },
      error: (err) => {
        console.error("Error posting comment:", err);
        this.isPostingComment = false;
      },
    });
  }

  // --- Filtering & Searching ---

  applyFiltersAndSearch(): void {
    let tempFiles = [...this.allVlogFiles];

    if (this.selectedCategory !== "All") {
      tempFiles = tempFiles.filter(file => file.category === this.selectedCategory);
    }

    if (this.searchTerm) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      tempFiles = tempFiles.filter(file =>
        file.title?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    this.filteredVlogFiles = tempFiles;
  }
}