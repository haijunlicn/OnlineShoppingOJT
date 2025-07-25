import { Component, OnInit } from '@angular/core';
import { ProductQandaService } from '@app/core/services/ProductQandaService';
import { ProductQuestion, ProductAnswer } from '@app/core/models/qanda.model';

@Component({
  selector: 'app-question',
  standalone:false,
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent implements OnInit {
  questions: ProductQuestion[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  loading: boolean = false;

  // For reply/edit modal
  showModal: boolean = false;
  modalQuestionId: number | null = null;
  modalAnswerId: number | null = null;
  modalAnswerText: string = '';
  isEdit: boolean = false;

  sortOrder: 'recent' | 'oldest' = 'recent';
  statusFilter: 'all' | 'answered' | 'unanswered' = 'all';
  filteredQuestions: ProductQuestion[] = [];

  constructor(private qandaService: ProductQandaService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading = true;
    this.qandaService.getAllQuestions(this.page, this.pageSize).subscribe(res => {
      this.questions = res.questions;
      this.total = res.total;
      this.loading = false;
      this.applyFilters();
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
      this.qandaService.editAnswer(this.modalAnswerId, this.modalAnswerText).subscribe(() => {
        this.closeModal();
        this.loadQuestions();
      });
    } else {
      this.qandaService.addAnswer(this.modalQuestionId, this.modalAnswerText).subscribe(() => {
        this.closeModal();
        this.loadQuestions();
      });
    }
  }

  deleteQuestion(q: ProductQuestion) {
    if (confirm('Are you sure you want to delete this question and its answers?')) {
      this.qandaService.deleteQuestion(q.id).subscribe(() => {
        this.loadQuestions();
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
