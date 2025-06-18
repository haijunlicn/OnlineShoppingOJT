import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Faq } from "../../../../core/models/faq";
import { FaqService } from "../../../../core/services/faq.service";


@Component({
  selector: 'app-faq-update',
  standalone: false,
  templateUrl: './faq-update.component.html',
  styleUrls: ['./faq-update.component.css']
})
export class FaqUpdateComponent implements OnInit {
  faqForm!: FormGroup;
  faqId!: number;

  faq: Faq = {
    id: 0,
    question: '',
    answer: '',
    delFg: 0
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private faqService: FaqService
  ) {}

  ngOnInit(): void {
    this.faqId = Number(this.route.snapshot.paramMap.get('id'));

    this.faqForm = this.fb.group({
      question: [''],
      answer: ['']
    });

    this.faqService.getFaqById(this.faqId).subscribe({
      next: data => {
        this.faq = data;
        this.faqForm.patchValue({
          question: this.faq.question,
          answer: this.faq.answer
        });
      },
      error: err => console.error(err)
    });
  }

  onSubmit(): void {
    const updatedFaq: Faq = {
      ...this.faq,
      question: this.faqForm.value.question,
      answer: this.faqForm.value.answer
    };

    this.faqService.updateFaq(updatedFaq).subscribe({
      next: () => {
        alert('FAQ updated successfully!');
        this.router.navigate(['/admin/policy/faq-list']);
      },
      error: err => console.error(err)
    });
  }

  get answer() {
    return this.faqForm.get("answer");
  }
}
