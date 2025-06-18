import { Component, OnDestroy, OnInit } from "@angular/core";
import { PolicyDTO } from "../../../../core/models/policyDTO";
import { PolicyService } from "../../../../core/services/policy.service";


@Component({
  selector: 'app-terms-conditions',
  standalone: false,
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.css']
})
export class TermsConditionsComponent implements OnInit, OnDestroy {
  effectiveDate: Date = new Date('2024-01-01');
  isSticky = false;
  activeSection = '';
  agreedToTerms = false;
  showAgreement = false;
  policies: PolicyDTO[] = [];

  constructor(private policyService: PolicyService) {}

  ngOnInit(): void {
    this.fetchPolicies();
    this.checkStickyPosition();
    this.showAgreement = this.shouldShowAgreement();
  }

  ngOnDestroy(): void {}

  fetchPolicies(): void {
    this.policyService.getPoliciesByType('terms').subscribe({
      next: (data) => {
        this.policies = data;
        setTimeout(() => this.initializeIntersectionObserver(), 100);
      },
      error: (err) => {
        console.error('Failed to fetch policies', err);
      }
    });
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      window.scrollTo({
        top: element.offsetTop - offset,
        behavior: 'smooth'
      });
      this.activeSection = sectionId;
    }
  }

  private initializeIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activeSection = entry.target.id;
        }
      });
    }, options);

    this.policies.forEach((policy) => {
      const sectionId = this.getSectionId(policy.title);
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });
  }

  getSectionId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
  }

  getIcon(title: string): string {
    const map: Record<string, string> = {
      'Product & Service Use': '🛍️',
      'Payments & Pricing': '💳',
      'Shipping & Delivery': '🚚',
      'Returns & Refunds': '🔁',
      'User Responsibilities': '👤',
      'Prohibited Activities': '📵',
      'Account Creation': '📝',
      'Communication': '💬',
      'Legal Terms': '⚖️',
      'Policy Updates': '📅',
    };
    return map[title] || '📄';
  }

  contactSupport(): void {
    window.location.href = 'mailto:support@example.com?subject=Terms Inquiry';
  }

  downloadTerms(): void {
    const link = document.createElement('a');
    link.href = '/assets/documents/terms-conditions.pdf';
    link.download = 'Terms-and-Conditions.pdf';
    link.click();
  }

  private checkStickyPosition(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isSticky = scrollTop > 200;
  }

  private shouldShowAgreement(): boolean {
    return window.location.pathname.includes('checkout') || window.location.pathname.includes('register');
  }
}
