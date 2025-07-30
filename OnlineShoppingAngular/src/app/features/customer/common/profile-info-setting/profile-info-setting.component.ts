import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@app/core/models/User';
import { AuthService } from '@app/core/services/auth.service';
import { CloudinaryService } from '@app/core/services/cloudinary.service';


@Component({
  selector: 'app-profile-info-setting',
  standalone: false,
  templateUrl: './profile-info-setting.component.html',
  styleUrl: './profile-info-setting.component.css'
})


export class ProfileInfoSettingComponent implements OnInit {
  @Input() currentUser: User | null = null;
  
  isUpdating = false
  profileForm: FormGroup
  passwordForm: FormGroup
  successMessage = ""
  errorMessage = ""

  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  confirmPasswordTouched = false;

  // For profile photo dropdown
  showPhotoMenu = false;

  togglePhotoMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showPhotoMenu = !this.showPhotoMenu;
    if (this.showPhotoMenu) {
      setTimeout(() => {
        window.addEventListener('click', this.closePhotoMenuOnOutsideClick);
      });
    }
  }

  closePhotoMenuOnOutsideClick = () => {
    this.showPhotoMenu = false;
    window.removeEventListener('click', this.closePhotoMenuOnOutsideClick);
  };

  onEditPhoto() {
    this.showPhotoMenu = false;
    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onRemovePhoto() {
    this.showPhotoMenu = false;
    if (this.currentUser) {
      this.currentUser.profile = '';
      this.onProfileSubmit();
    }
  }

  passwordRequirements = [
    { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
    { label: "Contains uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Contains lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "Contains number", test: (pwd: string) => /\d/.test(pwd) },
    { label: "Contains special character", test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  onNewPasswordInput() {
    const pwd = this.passwordForm.get('newPassword')?.value || '';
    // Calculate strength
    const metCount = this.passwordRequirements.filter(req => req.test(pwd)).length;
    this.passwordStrength = (metCount / this.passwordRequirements.length) * 100;
  }

  onConfirmPasswordInput() {
    this.confirmPasswordTouched = true;
  }

  isConfirmPasswordValid(): boolean {
    const newPwd = this.passwordForm.get('newPassword')?.value;
    const confirmPwd = this.passwordForm.get('confirmPassword')?.value;
    return !!newPwd && !!confirmPwd && newPwd === confirmPwd;
  }

  getStrengthBarClass() {
    if (this.passwordStrength < 40) return 'bg-danger';
    if (this.passwordStrength < 80) return 'bg-warning';
    return 'bg-success';
  }

  getStrengthText() {
    if (this.passwordStrength < 40) return 'Weak';
    if (this.passwordStrength < 80) return 'Medium';
    return 'Strong';
  }

  getStrengthTextClass() {
    if (this.passwordStrength < 40) return 'text-danger';
    if (this.passwordStrength < 80) return 'text-warning';
    return 'text-success';
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helper to get user initial for default avatar
  getUserInitial(name?: string): string {
    if (!name) return '';
    return name.trim().charAt(0).toUpperCase();
  }

  constructor(
    private fb: FormBuilder,
   
    private authService: AuthService,
    private cloudinaryService: CloudinaryService ,
  ) {
    this.profileForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      // phone: ["", [Validators.pattern(/^[0-9+\-\s()]+$/)]], 
    })

    this.passwordForm = this.fb.group({
      currentPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    })
  }

  currentPasswordStatus: 'idle' | 'checking' | 'success' | 'unmatched' | 'error' = 'idle';
  currentPasswordTimeout: any;

  ngOnInit(): void {
    this.loadUserProfile();
    this.passwordForm.get('newPassword')?.disable();
    this.passwordForm.get('confirmPassword')?.disable();
    this.profileForm.get('email')?.disable();
    this.passwordForm.get('currentPassword')?.valueChanges.subscribe((val) => {
      this.currentPasswordStatus = val ? 'checking' : 'idle';
      if (val) {
        if (this.currentPasswordTimeout) clearTimeout(this.currentPasswordTimeout);
        this.currentPasswordTimeout = setTimeout(() => {
          this.checkCurrentPasswordFromBackend();
        }, 500);
      }
    });
  }

  checkCurrentPasswordFromBackend() {
    const userId = this.currentUser?.id;
    const currentPassword = this.passwordForm.get('currentPassword')?.value;

    if (userId && currentPassword) {
      this.currentPasswordStatus = 'checking';
      this.authService.checkCurrentPassword(userId, currentPassword).subscribe({
        next: (isValid) => {
          if (isValid) {
            this.passwordForm.get('newPassword')?.enable();
            this.passwordForm.get('confirmPassword')?.enable();
            this.currentPasswordStatus = 'success';
            this.errorMessage = '';
          } else {
            this.passwordForm.get('newPassword')?.disable();
            this.passwordForm.get('confirmPassword')?.disable();
            this.currentPasswordStatus = 'unmatched';
            this.errorMessage = '';
          }
        },
        error: (err) => {
          this.currentPasswordStatus = 'error';
          this.errorMessage = 'Error checking password';
          this.passwordForm.get('newPassword')?.disable();
          this.passwordForm.get('confirmPassword')?.disable();
        }
      });
    }
  }

  loadUserProfile(): void {
    const currentUser = this.authService.getCurrentUser()
    if (currentUser) {
      this.currentUser = currentUser
      this.profileForm.patchValue({
        name: currentUser.name,
        email: currentUser.email,
        // phone: currentUser.phone || "", 
      })
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid && this.currentUser) {
      const { newPassword, confirmPassword } = this.passwordForm.value;
  
      if (newPassword !== confirmPassword) {
        this.errorMessage = "New passwords do not match";
        return;
      }
  
      this.isUpdating = true;
      this.clearMessages();
  
      this.authService.changePassword(this.currentUser.id, newPassword).subscribe({
        next: (updatedUser) => {
          this.successMessage = "Password updated successfully!";
          this.isUpdating = false;
          this.passwordForm.reset();
          setTimeout(() => this.clearMessages(), 3000);
        },
        error: (err) => {
          this.errorMessage = "Failed to update password";
          this.isUpdating = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

 
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.currentUser) {
      // (1) Cloudinary ကိုပုံတင်
      this.cloudinaryService.uploadImage(file).subscribe({
        next: (url: string) => {
          // (2) Cloudinary URL ကို user model ထဲထည့်
          this.currentUser!.profile = url;
          // (3) Backend ကို update profile API ခေါ်
          this.onProfileSubmit();
          console.log("submit");
        },
        error: () => {
          this.errorMessage = "Image upload failed!";
          console.log("Fail upload to cloudinary")
        }
      });
    }
  }
   // profile-info-setting.component.ts
onProfileSubmit(): void {
  if (this.profileForm.valid && this.currentUser) {
    this.isUpdating = true;
    this.clearMessages();

    const id = this.currentUser.id;
    const profileData = {
      ...this.profileForm.value,
      profile: this.currentUser.profile // Cloudinary URL
    };

    this.authService.updateProfile(id, profileData).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        this.successMessage = "Profile updated successfully!";
        this.isUpdating = false;
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err) => {
        this.errorMessage = "Failed to update profile";
        this.isUpdating = false;
      }
    });
  } else {
    this.markFormGroupTouched(this.profileForm);
  }
}
  private clearMessages(): void {
    this.successMessage = ""
    this.errorMessage = ""
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
      }
      if (field.errors["email"]) {
        return "Please enter a valid email address"
      }
      if (field.errors["minlength"]) {
        return `Minimum ${field.errors["minlength"].requiredLength} characters required`
      }
      if (field.errors["pattern"]) {
        return "Please enter a valid phone number"
      }
    }
    return ""
  }
}