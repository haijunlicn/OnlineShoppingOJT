import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"

interface ContactInfo {
  phone: string
  email: string
  address: string
  socialMedia: {
    facebook: string
    viber: string
    telegram: string
  }
}

@Component({
  selector: "app-contact",
  standalone: false,
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.css"],
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup
  isSubmitting = false
  submitSuccess = false
  mapUrl: SafeResourceUrl

  contactInfo: ContactInfo = {
    phone: "09-xxxxxxx",
    email: "support@yourshop.com",
    address: "123 Main Street, Downtown Area\nYangon, Myanmar 11181",
    socialMedia: {
      facebook: "https://facebook.com/yourshop",
      viber: "viber://chat?number=09xxxxxxx",
      telegram: "https://t.me/yourshop",
    },
  }

  constructor(
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
  ) {
    // Initialize form
    this.contactForm = this.formBuilder.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      phone: [""],
      message: ["", [Validators.required, Validators.minLength(10)]],
    })

    // Initialize map URL
    const mapEmbedUrl =
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3819.7531647135!2d96.1567!3d16.8667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDUyJzAwLjEiTiA5NsKwMDknMjQuMSJF!5e0!3m2!1sen!2smm!4v1234567890!5m2!1sen!2smm"
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbedUrl)
  }

  ngOnInit(): void {
    // Component initialization logic
  }

  // Form submission handler
  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false
        this.submitSuccess = true
        this.contactForm.reset()

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false
        }, 5000)

        // Log form data (replace with actual API call)
        console.log("Form submitted:", this.contactForm.value)
      }, 2000)
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched()
    }
  }

  // Check if field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  // Get error message for field
  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName)

    if (field?.errors) {
      if (field.errors["required"]) {
        return `${this.getFieldDisplayName(fieldName)} is required`
      }
      if (field.errors["email"]) {
        return "Please enter a valid email address"
      }
      if (field.errors["minlength"]) {
        const requiredLength = field.errors["minlength"].requiredLength
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`
      }
    }

    return ""
  }

  // Get display name for field
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: "Name",
      email: "Email",
      phone: "Phone",
      message: "Message",
    }
    return displayNames[fieldName] || fieldName
  }

  // Mark all form fields as touched
  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach((key) => {
      const control = this.contactForm.get(key)
      control?.markAsTouched()
    })
  }

  // Contact option handlers
  callPhone(): void {
    window.location.href = `tel:${this.contactInfo.phone}`
  }

  sendEmail(): void {
    window.location.href = `mailto:${this.contactInfo.email}`
  }

  startLiveChat(): void {
    // Implement live chat functionality
    console.log("Starting live chat...")
    // You can integrate with services like Intercom, Zendesk, etc.
    alert("Live chat feature will be implemented soon!")
  }

  openSocial(platform: string): void {
    let url = ""

    switch (platform) {
      case "facebook":
        url = this.contactInfo.socialMedia.facebook
        break
      case "viber":
        url = this.contactInfo.socialMedia.viber
        break
      case "telegram":
        url = this.contactInfo.socialMedia.telegram
        break
    }

    if (url) {
      window.open(url, "_blank")
    }
  }

  // Navigation handlers
  goToFAQ(): void {
    // Implement navigation to FAQ page
    console.log("Navigating to FAQ page...")
    // You can use Angular Router here
    // this.router.navigate(['/faq']);
  }

  navigate(page: string): void {
    // Implement navigation logic
    console.log(`Navigating to ${page} page...`)
    // You can use Angular Router here
    // this.router.navigate([`/${page}`]);
  }

  // Utility methods
  resetForm(): void {
    this.contactForm.reset()
    this.submitSuccess = false
  }

  // Method to handle form data before submission
  private prepareFormData(): any {
    const formValue = this.contactForm.value

    return {
      name: formValue.name?.trim(),
      email: formValue.email?.trim().toLowerCase(),
      phone: formValue.phone?.trim(),
      message: formValue.message?.trim(),
      timestamp: new Date().toISOString(),
      source: "contact-form",
    }
  }

  // Method to validate phone number (optional)
  private isValidPhoneNumber(phone: string): boolean {
    if (!phone) return true // Phone is optional

    // Myanmar phone number validation
    const myanmarPhoneRegex = /^(\+?95|0)?[1-9]\d{7,9}$/
    return myanmarPhoneRegex.test(phone.replace(/\s+/g, ""))
  }
}
