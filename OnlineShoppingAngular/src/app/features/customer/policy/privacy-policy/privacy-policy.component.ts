import { Component, OnInit } from "@angular/core";
import { PolicyDTO } from "../../../../core/models/policyDTO";
import { PolicyService } from "../../../../core/services/policy.service";

interface PolicySection extends PolicyDTO {
  isExpanded: boolean;
  content: string[];
}

@Component({
  selector: "app-privacy-policy",
  standalone: false,
  templateUrl: "./privacy-policy.component.html",
  styleUrls: ["./privacy-policy.component.css"]
})
export class PrivacyPolicyComponent implements OnInit {
  sections: PolicySection[] = [];
  activeSectionId: number | null = null;

  constructor(private policyService: PolicyService) {}

  ngOnInit(): void {
    this.policyService.getPoliciesByType("privacy").subscribe({
      next: (policies: PolicyDTO[]) => {
        console.log('Fetched policies:', policies);  // <-- Console log here
        this.sections = policies.map((policy) => ({
          ...policy,
          isExpanded: false,
          content: this.splitContent(policy.description)
        }));
      },
      error: (err) => {
        console.error("Failed to load privacy policies", err);
      }
    });
  }

  splitContent(description: string): string[] {
    return description
      ? description.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      : [];
  }

  toggleSection(sectionId: number): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.isExpanded = !section.isExpanded;
    }
  }

  scrollToSection(sectionId: number): void {
    this.activeSectionId = sectionId;
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  onContactClick(): void {
    console.log("Contact clicked");
  }
}
