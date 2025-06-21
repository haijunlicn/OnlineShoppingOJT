import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OptionTypeDTO, OptionValueDTO } from '@app/core/models/option.model';
import { AlertService } from '@app/core/services/alert.service';

@Component({
  selector: 'app-option-value-dialog',
  standalone: false,
  templateUrl: './option-value-dialog.component.html',
  styleUrl: './option-value-dialog.component.css'
})
export class OptionValueDialogComponent {
  @Input() visible: boolean = false;
  @Input() selectedOption: OptionTypeDTO | null = null;
  @Input() editingValue: OptionValueDTO | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<OptionValueDTO>();

  optionValueForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.optionValueForm = this.fb.group({
      id: [null],
      optionId: [null, Validators.required],
      value: ["", Validators.required],
    });
  }

  ngOnChanges(): void {
    if (this.editingValue) {
      this.optionValueForm.patchValue(this.editingValue);
    } else if (this.selectedOption) {
      this.optionValueForm.reset({
        optionId: +this.selectedOption.id,
      });
    }
  }

  onSave(): void {
    if (this.optionValueForm.invalid) {
      this.alertService.toast('Please enter a valid value.', 'warning');
      this.optionValueForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.optionValueForm.value);
    this.visibleChange.emit(false);

    const value = this.optionValueForm.value.value;
    this.alertService.toast(`"${value}" saved successfully.`, 'success');
  }


  onCancel(): void {
    this.visibleChange.emit(false);
  }
}
