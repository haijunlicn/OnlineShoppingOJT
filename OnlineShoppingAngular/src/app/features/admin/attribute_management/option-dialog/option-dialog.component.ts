import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OptionTypeDTO } from '@app/core/models/option.model';
import { AlertService } from '@app/core/services/alert.service';

@Component({
  selector: 'app-option-dialog',
  standalone: false,
  templateUrl: './option-dialog.component.html',
  styleUrl: './option-dialog.component.css'
})
export class OptionDialogComponent {
  @Input() visible: boolean = false;
  @Input() editingOption: OptionTypeDTO | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<OptionTypeDTO>();

  optionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.optionForm = this.fb.group({
      id: [""],
      name: ["", Validators.required],
    });
  }

  ngOnChanges(): void {
    if (this.editingOption) {
      this.optionForm.patchValue(this.editingOption);
    } else if (this.optionForm) {
      this.optionForm.reset();
    }
  }

  onSave(): void {
    if (this.optionForm.invalid) {
      this.alertService.toast('Option name is required.', 'warning');
      this.optionForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.optionForm.value);
    this.visibleChange.emit(false);

    const name = this.optionForm.value.name;
    this.alertService.toast(`"${name}" saved successfully.`, 'success');
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }
}
