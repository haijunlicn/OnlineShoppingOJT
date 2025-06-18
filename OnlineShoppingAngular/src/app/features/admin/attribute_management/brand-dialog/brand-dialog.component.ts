import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BrandDTO } from '@app/core/models/product.model';
import { BrandService } from '@app/core/services/brand.service';

@Component({
  selector: 'app-brand-dialog',
  standalone: false,
  templateUrl: './brand-dialog.component.html',
  styleUrl: './brand-dialog.component.css'
})
export class BrandDialogComponent {
  @Input() visible = false;
  @Input() editingBrand: BrandDTO | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<BrandDTO>();

  brandForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private brandService: BrandService
  ) {
    this.brandForm = this.fb.group({
      name: ["", Validators.required],
    });
  }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["editingBrand"]) {
      if (this.editingBrand) {
        this.brandForm.patchValue({ name: this.editingBrand.name });
      } else {
        this.brandForm.reset();
      }
    }

    if (changes["visible"] && !this.visible) {
      // Reset form on close
      this.brandForm.reset();
    }
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return;

    const name = this.brandForm.value.name.trim();
    if (!name) return;

    const dto: BrandDTO = {
      id: this.editingBrand?.id || "",
      name,
    };

    const action$ = this.editingBrand
      ? this.brandService.updateBrand(dto)
      : this.brandService.createBrand(dto);

    action$.subscribe({
      next: (savedBrand: BrandDTO) => {
        this.save.emit(savedBrand);
        this.closeDialog();
      },
      error: (err) => {
        console.error(this.editingBrand ? "Error updating brand:" : "Error creating brand:", err);
      },
    });
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
}
