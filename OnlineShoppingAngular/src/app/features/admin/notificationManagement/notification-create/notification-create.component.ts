import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@app/core/models/User';
import { AdminAccountService } from '@app/core/services/admin-account.service';
import { CloudinaryService } from '@app/core/services/cloudinary.service';
import { NotificationService } from '@app/core/services/notification.service';
import { RoleService } from '@app/core/services/role.service';

@Component({
  selector: "app-notification-create",
  standalone: false,
  templateUrl: "./notification-create.component.html",
  styleUrls: ["./notification-create.component.css"],
})

export class NotificationCreateComponent implements OnInit {

  @ViewChild('imageInput') imageInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('sendLaterRadio') sendLaterRadioRef!: ElementRef<HTMLInputElement>;

  form!: FormGroup
  submitting = false
  successMessage = ""
  errorMessage = ""
  userList: User[] = []
  filteredUsers: User[] = []
  selectedUsers: User[] = []

  // Modal and filtering
  showUserModal = false
  searchTerm = ""
  selectedRole = ""
  verifiedFilter = ""
  currentPage = 1
  pageSize = 8
  selectAllChecked = false

  // Image preview
  selectedImage: File | null = null
  imagePreviewUrl: string | null = null

  // Audience types
  audienceTypes = [
    { value: "admin", label: "Admins", icon: "👨‍💼", description: "All admin users" },
    { value: "customer", label: "Customers", icon: "👥", description: "All customer users" },
    { value: "custom", label: "Custom", icon: "🎯", description: "Select specific users" },
  ]

  roles: { value: string, label: string }[] = [{ value: "", label: "All Roles" }];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private adminAccountService: AdminAccountService,
    private cloudinaryService: CloudinaryService,
    private roleService: RoleService,
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      audienceType: ['admin', Validators.required],
      title: [''],
      message: ['', Validators.required],
      // imageUrl: [''],
      imageFile: [null],
      targetUsers: [''],
      scheduledAt: [''],
      sendLater: [false],
    });

    this.form.get("scheduledAt")?.setValidators([this.futureDateValidator])
    this.loadUsers()
    this.loadRoles()

    this.form.get("audienceType")?.valueChanges.subscribe((value) => {
      if (value !== "custom") {
        this.selectedUsers = []
        this.form.patchValue({ targetUsers: "" })
      }
    })
  }

  futureDateValidator(control: any) {
    if (!control.value) return null
    const selectedDate = new Date(control.value)
    const now = new Date()
    return selectedDate > now ? null : { pastDate: true }
  }

  loadUsers() {
    this.adminAccountService.getAllUsers().subscribe({
      next: (users) => {
        this.userList = users
        this.filteredUsers = users
      },
      error: (err) => console.error("Failed to load users", err),
    })
  }

  loadRoles() {
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        const mapped = data.map(role => ({
          value: role.name,  // e.g., "admin", "superadmin", etc.
          label: role.name   // use name directly without formatting
        }));
        this.roles.push(...mapped);  // Keep "All Roles" at the top
      },
      error: (err) => {
        console.error("Failed to load roles", err);
      }
    });
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file && this.isValidImageFile(file)) {
      this.form.patchValue({ imageFile: file });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.clearImage();
      this.errorMessage = "Please select a valid image file";
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    return validTypes.includes(file.type)
  }

  clearImage() {
    this.selectedImage = null
    this.imagePreviewUrl = null
    this.form.patchValue({ imageFile: null })
    const fileInput = document.getElementById("imageInput") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  openUserModal() {
    this.showUserModal = true
    this.filterUsers()
  }

  closeUserModal() {
    this.showUserModal = false
    this.resetModalFilters()
  }

  resetModalFilters() {
    this.searchTerm = ""
    this.selectedRole = ""
    this.verifiedFilter = ""
    this.currentPage = 1
    this.selectAllChecked = false
  }

  filterUsers() {
    let filtered = [...this.userList]

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
      )
    }

    if (this.selectedRole) {
      filtered = filtered.filter((user) => user.roleName === this.selectedRole)
    }

    if (this.verifiedFilter === "verified") {
      filtered = filtered.filter((user) => user.isVerified)
    } else if (this.verifiedFilter === "unverified") {
      filtered = filtered.filter((user) => !user.isVerified)
    }

    this.filteredUsers = filtered
    this.currentPage = 1
    this.updateSelectAllState()
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    return this.filteredUsers.slice(start, end)
  }

  get totalPages() {
    return Math.ceil(this.filteredUsers.length / this.pageSize)
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some((u) => u.id === user.id)
  }

  toggleUserSelection(user: User) {
    const index = this.selectedUsers.findIndex((u) => u.id === user.id)
    if (index > -1) {
      this.selectedUsers.splice(index, 1)
    } else {
      this.selectedUsers.push(user)
    }
    this.updateSelectAllState()
  }

  toggleSelectAllOnPage() {
    const pageUsers = this.paginatedUsers
    if (this.selectAllChecked) {
      pageUsers.forEach((user) => {
        const index = this.selectedUsers.findIndex((u) => u.id === user.id)
        if (index > -1) {
          this.selectedUsers.splice(index, 1)
        }
      })
    } else {
      pageUsers.forEach((user) => {
        if (!this.isUserSelected(user)) {
          this.selectedUsers.push(user)
        }
      })
    }
    this.updateSelectAllState()
  }

  updateSelectAllState() {
    const pageUsers = this.paginatedUsers
    this.selectAllChecked = pageUsers.length > 0 && pageUsers.every((user) => this.isUserSelected(user))
  }

  applyUserSelection() {
    const userIds = this.selectedUsers.map((u) => u.id).join(",")
    this.form.patchValue({ targetUsers: userIds })
    this.closeUserModal()
  }

  getSelectedUsersDisplay(): string {
    if (this.selectedUsers.length === 0) return "No users selected"
    if (this.selectedUsers.length <= 3) {
      return this.selectedUsers.map((u) => u.name).join(", ")
    }
    return `${this.selectedUsers
      .slice(0, 2)
      .map((u) => u.name)
      .join(", ")} and ${this.selectedUsers.length - 2} more`
  }

  getAudienceCount(): number {
    const audienceType = this.form.get("audienceType")?.value
    if (audienceType === "admin") {
      return this.userList.filter((u) => u.roleName === "admin" || u.roleName === "superadmin").length
    } else if (audienceType === "customer") {
      return this.userList.filter((u) => u.roleName === "customer").length
    } else if (audienceType === "custom") {
      return this.selectedUsers.length
    }
    return 0
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = "Please fill in all required fields correctly.";
      return;
    }

    this.errorMessage = "";
    this.successMessage = "";
    this.submitting = true;

    try {
      // 1. Upload image if selected
      let uploadedImageUrl: string | null = null;
      const imageFile: File | null = this.form.get('imageFile')?.value;

      if (imageFile) {
        const uploadResponse = await this.cloudinaryService.uploadImage(imageFile).toPromise();
        uploadedImageUrl = uploadResponse ?? null; // if undefined, assign null
      }

      // 2. Prepare target user IDs based on audienceType
      const formValue = this.form.value;
      const metadataObj: any = {};

      if (formValue.audienceType === "custom" && formValue.targetUsers) {
        const ids = formValue.targetUsers
          .split(",")
          .map((id: string) => id.trim())
          .filter((id: string) => id.length > 0);
        metadataObj.targetUserIds = ids;
      } else if (formValue.audienceType === "admin") {
        const adminUsers = this.userList.filter(u => u.roleName !== "customer");
        metadataObj.targetUserIds = adminUsers.map(u => u.id);
      } else if (formValue.audienceType === "customer") {
        const customerUsers = this.userList.filter(u => u.roleName === "customer");
        metadataObj.targetUserIds = customerUsers.map(u => u.id);
      }

      // 3. Create payload with uploadedImageUrl
      const payload = {
        title: formValue.title || null,
        message: formValue.message,
        imageUrl: uploadedImageUrl,  // use uploaded URL here
        metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
        scheduledAt: formValue.scheduledAt || null,
      };

      // 4. Send notification
      this.notificationService.createCustomNotification(payload).subscribe({
        next: (res) => {
          this.successMessage = "Notification sent successfully!";
          this.form.reset();
          this.form.patchValue({ audienceType: "admin" });
          this.clearImage();
          this.selectedUsers = [];
          this.submitting = false;
        },
        error: (err) => {
          this.errorMessage = "Failed to send notification. Please try again.";
          this.submitting = false;
        },
      });
    } catch (error) {
      this.errorMessage = "Image upload failed. Please try again.";
      this.submitting = false;
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key)
      control?.markAsTouched()
    })
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updateSelectAllState()
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updateSelectAllState()
    }
  }

  goBack() {
    // Navigate back to notifications list
    window.history.back()
  }

  triggerImageUpload() {
    this.imageInputRef?.nativeElement.click();
  }

  isSendLaterSelected(): boolean {
    return this.sendLaterRadioRef?.nativeElement.checked || false;
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

}
