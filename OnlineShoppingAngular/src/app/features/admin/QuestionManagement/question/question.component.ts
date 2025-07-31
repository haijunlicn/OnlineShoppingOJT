import { Component, OnInit } from '@angular/core';
import { ProductQandaService } from '@app/core/services/ProductQandaService';
import { ProductQuestion, ProductAnswer } from '@app/core/models/qanda.model';

@Component({
  selector: 'app-question',
  standalone: false,
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent implements OnInit {
  questions: ProductQuestion[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  loading: boolean = false;
  errorMessage: string = '';

  // For reply/edit modal
  showModal: boolean = false;
  modalQuestionId: number | null = null;
  modalAnswerId: number | null = null;
  modalAnswerText: string = '';
  isEdit: boolean = false;

  sortOrder: 'recent' | 'oldest' = 'recent';
  statusFilter: 'all' | 'answered' | 'unanswered' = 'all';
  filteredQuestions: ProductQuestion[] = [];

  // Sorting
  sortField = "createdAt";
  sortDirection: "asc" | "desc" = "desc";

  // Expose Math for template use
  Math = Math;

  constructor(private qandaService: ProductQandaService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading = true;
    this.errorMessage = '';
    this.qandaService.getAllQuestions(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.total = res.total;
        this.loading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.errorMessage = 'Failed to load questions. Please try again.';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.questions];

    // Status filter
    if (this.statusFilter === 'answered') {
      filtered = filtered.filter(q => q.answers.length > 0);
    } else if (this.statusFilter === 'unanswered') {
      filtered = filtered.filter(q => q.answers.length === 0);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return this.sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    this.filteredQuestions = filtered;
  }

  // Sorting methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "desc";
    }
    this.sortQuestions();
  }

  private sortQuestions(): void {
    this.filteredQuestions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case "productName":
          aValue = a.productName || '';
          bValue = b.productName || '';
          break;
        case "questionText":
          aValue = a.questionText || '';
          bValue = b.questionText || '';
          break;
        case "userName":
          aValue = a.userName || '';
          bValue = b.userName || '';
          break;
        case "status":
          aValue = a.answers.length > 0;
          bValue = b.answers.length > 0;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }

      if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return "fa-sort";
    return this.sortDirection === "asc" ? "fa-sort-up" : "fa-sort-down";
  }

  // Pagination methods
  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= Math.ceil(this.total / this.pageSize)) {
      this.page = pageNum;
      this.loadQuestions();
    }
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadQuestions();
    }
  }

  goToNextPage(): void {
    if (this.page < Math.ceil(this.total / this.pageSize)) {
      this.page++;
      this.loadQuestions();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = Math.ceil(this.total / this.pageSize);
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, this.page - half);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadQuestions();
  }

  // Filter methods
  resetFilters(): void {
    this.statusFilter = 'all';
    this.sortOrder = 'recent';
    this.sortField = "createdAt";
    this.sortDirection = "desc";
    this.applyFilters();
  }

  // Status methods
  getStatusBadgeClass(isAnswered: boolean): string {
    return isAnswered ? "badge status-answered" : "badge status-unanswered";
  }

  getStatusIcon(isAnswered: boolean): string {
    return isAnswered ? 'bi bi-check-circle' : 'bi bi-question-circle';
  }

  // Export methods
  exportToPdf(): void {
    // TODO: Implement PDF export
    console.log('Export to PDF functionality to be implemented');
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    console.log('Export to Excel functionality to be implemented');
  }

  // Utility methods
  trackByQuestionId(index: number, question: ProductQuestion): number {
    return question.id;
  }

  openReply(q: ProductQuestion) {
    console.log('openReply called', q);
    this.showModal = true;
    this.modalQuestionId = q.id;
    this.modalAnswerId = null;
    this.modalAnswerText = '';
    this.isEdit = false;
  }

  openEditAnswer(a: ProductAnswer) {
    this.showModal = true;
    this.modalQuestionId = a.questionId;
    this.modalAnswerId = a.id;
    this.modalAnswerText = a.answerText;
    this.isEdit = true;
  }

  submitAnswer() {
    if (!this.modalQuestionId) return;
    if (this.isEdit && this.modalAnswerId) {
      this.qandaService.editAnswer(this.modalAnswerId, this.modalAnswerText).subscribe({
        next: () => {
          this.closeModal();
          this.loadQuestions();
        },
        error: (err) => {
          console.error('Error updating answer:', err);
          this.errorMessage = 'Failed to update answer. Please try again.';
        }
      });
    } else {
      this.qandaService.addAnswer(this.modalQuestionId, this.modalAnswerText).subscribe({
        next: () => {
          this.closeModal();
          this.loadQuestions();
        },
        error: (err) => {
          console.error('Error adding answer:', err);
          this.errorMessage = 'Failed to add answer. Please try again.';
        }
      });
    }
  }

  deleteQuestion(q: ProductQuestion) {
    if (confirm('Are you sure you want to delete this question and its answers?')) {
      this.qandaService.deleteQuestion(q.id).subscribe({
        next: () => {
          this.loadQuestions();
        },
        error: (err) => {
          console.error('Error deleting question:', err);
          this.errorMessage = 'Failed to delete question. Please try again.';
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.modalQuestionId = null;
    this.modalAnswerId = null;
    this.modalAnswerText = '';
    this.isEdit = false;
  }
}
