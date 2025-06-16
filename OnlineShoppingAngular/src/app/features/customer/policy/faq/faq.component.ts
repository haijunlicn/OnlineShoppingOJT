import { Component, OnInit } from '@angular/core';
import { FaqService } from '../../../../core/services/faq.service';
import { Faq } from '../../../../core/models/faq';

@Component({
  selector: 'app-faq',
  standalone: false,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements OnInit {
  searchTerm: string = '';
  openItems: number[] = [];
  feedback: { [key: number]: 'helpful' | 'not-helpful' | null } = {};

  faqData: Faq[] = [];
  filteredFAQs: Faq[] = [];

  constructor(private faqService: FaqService) {}

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.faqService.getAllFaqs().subscribe({
      next: (data) => {
        this.faqData = data;
        this.filteredFAQs = data;
      },
      error: (err) => {
        console.error('Error loading FAQs:', err);
      }
    });
  }

  onSearchChange(): void {
    this.filteredFAQs = this.faqData.filter(item =>
      item.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  toggleItem(id: number): void {
    const index = this.openItems.indexOf(id);
    if (index > -1) {
      this.openItems.splice(index, 1);
    } else {
      this.openItems.push(id);
    }
  }

  isOpen(id: number): boolean {
    return this.openItems.includes(id);
  }

  giveFeedback(id: number, type: 'helpful' | 'not-helpful'): void {
    this.feedback[id] = this.feedback[id] === type ? null : type;
  }
}
