import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-notification-create',
  standalone: false,
  templateUrl: './notification-create.component.html',
  styleUrl: './notification-create.component.css'
})

export class NotificationCreateComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      title: [''],
      message: ['', Validators.required],
      imageUrl: [''],
      targetUsers: [''], // comma separated user IDs or empty for all
      scheduledAt: [''], // ISO datetime string or empty
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in the required fields.';
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = true;

    // Build metadata JSON with targetUserIds if provided
    let metadataObj: any = {};
    const targetUsersRaw = this.form.value.targetUsers?.trim();
    if (targetUsersRaw) {
      const ids = targetUsersRaw
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);
      metadataObj.targetUserIds = ids;
    }

    const payload = {
      // type = CUSTOM; backend sets this automatically
      title: this.form.value.title || null,
      message: this.form.value.message,
      imageUrl: this.form.value.imageUrl || null,
      metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null,
      scheduledAt: this.form.value.scheduledAt || null,
    };

    this.notificationService.createCustomNotification(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Notification sent successfully!';
        this.form.reset();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to send notification.';
        this.submitting = false;
      },
    });
  }
}