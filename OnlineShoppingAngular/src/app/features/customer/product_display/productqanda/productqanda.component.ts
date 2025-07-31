import { Component, Input, OnInit } from '@angular/core';
import { ProductQuestion } from '@app/core/models/qanda.model';
import { AuthService } from '@app/core/services/auth.service';
import { ProductQandaService } from '@app/core/services/ProductQandaService';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-productqanda',
  standalone: false,
  templateUrl: './productqanda.component.html',
  styleUrl: './productqanda.component.css'
})
export class ProductqandaComponent implements OnInit {
  @Input() productId!: number;
  questions: ProductQuestion[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 5;
  newQuestion: string = '';
  isLoggedIn: boolean = false;
  isCustomer: boolean = false;
  showEditModal: boolean = false;
  editQuestionId: number | null = null;
  editQuestionText: string = '';
  currentUserId: number | null = null;
  
  // Add more state as needed (e.g. for admin reply)

  constructor(
    private qandaService: ProductQandaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.fetchCurrentUser().subscribe({
      next: user => {
        this.isLoggedIn = true;
        this.isCustomer = user.roleName === 'customer';
        this.currentUserId = user.id;
      },
      error: () => {
        this.isLoggedIn = false;
        this.isCustomer = false;
        this.currentUserId = null;
      }
    });
    this.loadQuestions();
  }

  loadQuestions() {
    this.qandaService.getQuestions(this.productId, this.page, this.pageSize).subscribe(res => {
      this.questions = res.questions;
      this.total = res.total;
    });
  }

  submitQuestion() {
    if (!this.newQuestion.trim()) return;
    this.qandaService.addQuestion(this.productId, this.newQuestion).subscribe(() => {
      this.newQuestion = '';
      this.loadQuestions();
    });
  }

  canEditDelete(q: ProductQuestion): boolean {
    return this.isLoggedIn && this.isCustomer && q.userId === this.currentUserId;
  }

  openEditModal(q: ProductQuestion) {
    this.showEditModal = true;
    this.editQuestionId = q.id;
    this.editQuestionText = q.questionText;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editQuestionId = null;
    this.editQuestionText = '';
  }

  submitEdit() {
    if (!this.editQuestionText.trim() || !this.editQuestionId) return;
  
    this.qandaService.editQuestionByCustomer(this.editQuestionId, this.editQuestionText).subscribe(() => {
      this.closeEditModal();
      this.loadQuestions();
  
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your question has been updated successfully.',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        showConfirmButton: false
      });
    }, error => {
      // Optional: Show error alert
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong while updating the question.',
        confirmButtonColor: '#d33'
      });
    });
  }

  deleteQuestion(q: ProductQuestion) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.qandaService.deleteQuestionByCustomer(q.id).subscribe(() => {
        this.loadQuestions();
      });
    }
  }

  // Add admin reply logic here...

}
