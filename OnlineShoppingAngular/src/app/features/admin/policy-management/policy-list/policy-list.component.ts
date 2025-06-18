import { Component, OnInit } from '@angular/core';
import { PolicyDTO } from '../../../../core/models/policyDTO';
import { PolicyService } from '../../../../core/services/policy.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-policy-list',
  standalone: false,
  templateUrl: './policy-list.component.html',
  styleUrls: ['./policy-list.component.css']  
})
export class PolicyListComponent implements OnInit {

  policies: PolicyDTO[] = [];
  isLoading: boolean = false;
  error: string = '';

   policyTypes = [
    { value: 'privacy', label: 'Privacy Policy' },
    { value: 'terms', label: 'Terms & Conditions' } 
  ];

  constructor(private policyService: PolicyService,
    private sanitizer: DomSanitizer
  ) {}
 
sanitizeHtml(content: string): SafeHtml {
  return this.sanitizer.bypassSecurityTrustHtml(content);
}


  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.isLoading = true;
    this.policyService.getAllPolicies().subscribe({
      next: (data) => {
        console.log('Loaded policies:', data);
        this.policies = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load policies';
        this.isLoading = false;
      }
    });
  }
  getTypeLabel(value: string): string {
  const found = this.policyTypes.find(type => type.value === value);
  return found ? found.label : value;
}


 deletePolicy(id: number | undefined): void {
  if (id === undefined) {
    console.warn('Policy ID is undefined. Cannot delete.');
    return;
  }

  const confirmDelete = confirm('Are you sure you want to delete this policy?');
  if (!confirmDelete) return;

  this.policyService.deletePolicy(id).subscribe({
    next: () => {
      this.policies = this.policies.filter(policy => policy.id !== id);
    },
    error: (err) => {
      console.error('Failed to delete policy:', err);
      alert('Failed to delete policy');
    }
  });
}

}
