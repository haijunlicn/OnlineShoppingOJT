import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { PermissionService } from "@app/core/services/permission.service";


@Component({
  selector: 'app-permission-form',
  standalone: false,
  templateUrl: './permission-form.component.html',
  styleUrls: ['./permission-form.component.css']
})
export class PermissionFormComponent {
  permissionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private router: Router
  ) {
    this.permissionForm = this.fb.group({
      code: ['', Validators.required],
      description: ['']
    });
  }

  submit(): void {
  if (this.permissionForm.valid) {
    this.permissionService.createPermission(this.permissionForm.value).subscribe({
      next: () => {
        alert('Permission created successfully!');
        this.router.navigate(['/admine/permission-list']); // ← change to your list route
      },
      error: (err) => console.error('Create permission failed', err)
    });
  }
}

}
