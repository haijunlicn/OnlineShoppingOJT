import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { FaqService } from "../../../../core/services/faq.service";
import { Faq } from "../../../../core/models/faq";


@Component({
  selector: 'app-faq-create',
  standalone: false,
  templateUrl: './faq-create.component.html',
  styleUrls: ['./faq-create.component.css']
})
export class FaqCreateComponent implements OnInit {

  faqForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private faqService: FaqService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.faqForm = this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.faqForm.valid) {
      const faq: Faq = {
        question: this.faqForm.value.question,
        answer: this.faqForm.value.answer,
        delFg: 0
      };

      this.faqService.createFaq(faq).subscribe({
        next: () => {
          alert('FAQ created successfully!');
          this.router.navigate(['/admin/policy/faq-list']);
        },
        error: err => console.error(err)
      });
    } else {
      alert('Please fill out all required fields.');
    }
  }

  get question() {
    return this.faqForm.get('question');
  }

  get answer() {
    return this.faqForm.get('answer');
  }
}
