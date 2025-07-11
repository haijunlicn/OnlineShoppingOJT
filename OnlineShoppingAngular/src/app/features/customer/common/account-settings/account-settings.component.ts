import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { User } from "@app/core/models/User";
import { AuthService } from "@app/core/services/auth.service";
import { ProfileService } from "@app/core/services/profile.service";


@Component({
   selector: "app-account-settings",
  standalone: false,
  templateUrl: "./account-settings.component.html",
  styleUrls: ["./account-settings.component.css"],
})
export class AccountSettingsComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  isUpdating = false;
  activeSection = "profile";
  showProfileModal = false;
  showPasswordModal = false;
  showPhotoModal = false;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  successMessage = "";
  errorMessage = "";
   activeSections: string = '';
  

  constructor(private fb: FormBuilder, private profileService: ProfileService, private authService: AuthService,private router: Router) {
    this.profileForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.pattern(/^[0-9+\-\s()]+$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    console.log("user info : " , this.authService.getCurrentUser());
    
  }

 loadUserProfile(): void {
  this.isLoading = true;
  this.clearMessages();

  const currentUser = this.authService.getCurrentUser();

  if (currentUser) {
    this.currentUser = currentUser;
    this.profileForm.patchValue({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || ""
    });
    this.isLoading = false;
  } else {
    this.errorMessage = "User not logged in or failed to load user.";
    this.isLoading = false;
  }
}


  setActiveSection(section: string): void {
    if (["profile", "security", "preferences", "notifications"].includes(section)) {
      this.activeSection = section;
    }
  }

  openProfileModal(): void {
    this.showProfileModal = true;
    this.clearMessages();
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.clearMessages();
  }

  openPhotoModal(): void {
    this.showPhotoModal = true;
    this.clearMessages();
  }

  closeModals(): void {
    this.showProfileModal = false;
    this.showPasswordModal = false;
    this.showPhotoModal = false;
    this.clearMessages();
  }

  onProfileSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isUpdating = true;
      this.clearMessages();

      const email = this.currentUser.email;
      const roleType = 1; // Replace with actual value
      const profileData = this.profileForm.value;

      this.profileService.updateProfile(email, roleType, profileData).subscribe({
        next: (updatedUser) => {
          this.currentUser = updatedUser;
          this.successMessage = "Profile updated successfully!";
          this.isUpdating = false;
          setTimeout(() => this.closeModals(), 1500);
        },
        error: (err) => {
          console.error("Profile update failed", err);
          this.errorMessage = "Failed to update profile";
          this.isUpdating = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value;

      if (newPassword !== confirmPassword) {
        this.errorMessage = "New passwords do not match";
        return;
      }

      this.isUpdating = true;
      this.clearMessages();

      // TODO: Replace with actual password update API
      setTimeout(() => {
        this.successMessage = "Password updated successfully!";
        this.isUpdating = false;
        this.passwordForm.reset();
        setTimeout(() => this.closeModals(), 1500);
      }, 1500);
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.currentUser) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

      if (file.size > maxSize) {
        this.errorMessage = "File size must be less than 5MB";
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = "Only JPEG, PNG and GIF files are allowed";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentUser!.avatar = e.target.result;
      };
      reader.readAsDataURL(file);

      this.successMessage = "Profile photo updated successfully!";
      setTimeout(() => this.closeModals(), 1500);
    }
  }

  private clearMessages(): void {
    this.successMessage = "";
    this.errorMessage = "";
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
  setActiveSections(section: string): void {
    this.activeSection = section;
  }

  goToLocation(): void {
    this.activeSection = 'location';
    this.router.navigate(['/customer/address']);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors["required"]) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors["email"]) {
        return "Please enter a valid email address";
      }
      if (field.errors["minlength"]) {
        return `Minimum ${field.errors["minlength"].requiredLength} characters required`;
      }
      if (field.errors["pattern"]) {
        return "Please enter a valid phone number";
      }
    }
    return "";
  }
}
