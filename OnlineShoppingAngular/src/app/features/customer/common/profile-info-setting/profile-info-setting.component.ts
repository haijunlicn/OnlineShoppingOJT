import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@app/core/models/User';
import { AuthService } from '@app/core/services/auth.service';
import { ProfileService } from '@app/core/services/profile.service';

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

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
  ) {
    this.profileForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.pattern(/^[0-9+\-\s()]+$/)]],
    })

    this.passwordForm = this.fb.group({
      currentPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.loadUserProfile()
  }

  loadUserProfile(): void {
    const currentUser = this.authService.getCurrentUser()
    if (currentUser) {
      this.currentUser = currentUser
      this.profileForm.patchValue({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || "",
      })
    }
  }

  onProfileSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isUpdating = true
      this.clearMessages()

      const email = this.currentUser.email
      const roleType = 1
      const profileData = this.profileForm.value

      this.profileService.updateProfile(email, roleType, profileData).subscribe({
        next: (updatedUser) => {
          this.currentUser = updatedUser
          this.successMessage = "Profile updated successfully!"
          this.isUpdating = false
          setTimeout(() => this.clearMessages(), 3000)
        },
        error: (err) => {
          console.error("Profile update failed", err)
          this.errorMessage = "Failed to update profile"
          this.isUpdating = false
        },
      })
    } else {
      this.markFormGroupTouched(this.profileForm)
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value

      if (newPassword !== confirmPassword) {
        this.errorMessage = "New passwords do not match"
        return
      }

      this.isUpdating = true
      this.clearMessages()

      setTimeout(() => {
        this.successMessage = "Password updated successfully!"
        this.isUpdating = false
        this.passwordForm.reset()
        setTimeout(() => this.clearMessages(), 3000)
      }, 1500)
    } else {
      this.markFormGroupTouched(this.passwordForm)
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0]
    if (file && this.currentUser) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]

      if (file.size > maxSize) {
        this.errorMessage = "File size must be less than 5MB"
        return
      }

      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = "Only JPEG, PNG and GIF files are allowed"
        return
      }

      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.currentUser!.avatar = e.target.result
      }
      reader.readAsDataURL(file)

      this.successMessage = "Profile photo updated successfully!"
      setTimeout(() => this.clearMessages(), 3000)
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