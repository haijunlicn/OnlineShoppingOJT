import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PolicyService } from '../../../../core/services/policy.service';
import { PolicyDTO } from '../../../../core/models/policyDTO';

@Component({
  selector: 'app-policy-create',
  standalone: false,
  templateUrl: './policy-create.component.html',
  styleUrls: ['./policy-create.component.css']
})
export class PolicyCreateComponent implements OnInit {
  policyForm!: FormGroup;
  isSubmitting = false;
  submitMessage = '';

  policyTypes = [
    { value: 'privacy', label: 'Privacy Policy' },
    { value: 'terms', label: 'Terms & Conditions' }
  ];

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.policyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.policyForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const policyData: PolicyDTO = this.policyForm.value;

    this.policyService.createPolicy(policyData).subscribe({
      next: () => {
        this.submitMessage = 'Policy created successfully!';
        setTimeout(() => {
          this.router.navigate(['/admin/policy/policy-list']);
        }, 1000); // wait 1 second then navigate
      },
      error: (err) => {
        console.error('Error creating policy:', err);
        this.submitMessage = 'Error creating policy. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/policy/policy-list']);
  }

  private markFormGroupTouched(): void {
    Object.values(this.policyForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.policyForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getFieldError(fieldName: string): string {
    const field = this.policyForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${this.formatLabel(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      return `${this.formatLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private formatLabel(fieldName: string): string {
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  onDescriptionChange(content: string): void {
    this.policyForm.patchValue({ description: content });
    this.policyForm.get('description')?.markAsTouched();
  }

  get descriptionValue(): string {
    return this.policyForm.get('description')?.value || '';
  }

  get title() {
    return this.policyForm.get('title');
  }

  get description() {
    return this.policyForm.get('description');
  }
}
