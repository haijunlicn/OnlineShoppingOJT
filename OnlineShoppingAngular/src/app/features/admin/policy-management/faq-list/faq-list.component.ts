import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Faq } from "../../../../core/models/faq";
import { FaqService } from "../../../../core/services/faq.service";


@Component({
  selector: 'app-faq-list',
  standalone:false,
  templateUrl: './faq-list.component.html',
  styleUrls: ['./faq-list.component.css']
})
export class FaqListComponent implements OnInit {

  faqList: Faq[] = [];

  constructor(private faqService: FaqService, private router: Router) {}

  ngOnInit(): void {
    this.getFaqs();
  }

  getFaqs(): void {
    this.faqService.getAllFaqs().subscribe({
      next: (data) => {
        this.faqList = data.filter(faq => !faq.delFg); // only active
      },
      error: (err) => console.error('Error fetching FAQs:', err)
    });
  }

  editFaq(id: number): void {
    this.router.navigate(['/admin/policy/faq-update', id]);
  }

  deleteFaq(id: number): void {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      this.faqService.deleteFaq(id).subscribe({
        next: () => {
          alert('FAQ deleted successfully');
          this.getFaqs(); // refresh list
        },
        error: (err) => console.error('Delete error:', err)
      });
    }
  }
}
