import { Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { StoreLocationDto } from "@app/core/models/storeLocationDto";
import { StoreLocationService } from "@app/core/services/store-location.service";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  socialMedia: {
    facebook: string;
    viber: string;
    telegram: string;
  };
}

@Component({
  selector: "app-contact",
  standalone: false,
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.css"],
})
export class ContactComponent implements OnInit {
  mapUrl: SafeResourceUrl | null = null;
  contactInfo: ContactInfo = {
    phone: "",
    email: "",
    address: "",
    socialMedia: {
      facebook: "https://www.facebook.com/share/1ApfC1NCQy/?mibextid=wwXIfr",
      viber: "viber://chat?number=09422233803",
      telegram: "https://t.me/@luillz",
    },
  };

  constructor(
    private sanitizer: DomSanitizer,
    private storeLocationService: StoreLocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.storeLocationService.getActive().subscribe({
      next: (store: StoreLocationDto) => {
        this.contactInfo.phone = store.phoneNumber;
        this.contactInfo.email = store.email;
        this.contactInfo.address = `${store.fullAddress}\n${store.city}, ${store.country} ${store.zipCode}`;
        // Set Google Maps embed URL dynamically
        const mapEmbedUrl = `https://www.google.com/maps?q=${store.lat},${store.lng}&hl=en&z=16&output=embed`;
        this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbedUrl);
      },
      error: () => {
        // fallback: show nothing or default
      }
    });
  }

  // Contact option handlers
  callPhone(): void {
    window.location.href = `tel:${this.contactInfo.phone}`;
  }

  sendEmail(): void {
    window.location.href = `mailto:${this.contactInfo.email}`;
  }

  openSocial(platform: string): void {
    let url = "";
    switch (platform) {
      case "facebook":
        url = this.contactInfo.socialMedia.facebook;
        break;
      case "viber":
        url = this.contactInfo.socialMedia.viber;
        break;
      case "telegram":
        url = this.contactInfo.socialMedia.telegram;
        break;
    }
    if (url) {
      window.open(url, "_blank");
    }
  }

  goToFAQ(): void {
    this.router.navigate(['/customer/policy/faq']);
  }

  navigate(page: string): void {
    // Implement navigation logic
    // this.router.navigate([`/${page}`]);
  }
}
