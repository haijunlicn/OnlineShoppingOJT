import { Component, EventEmitter, Input, Output, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BrandDTO } from '@app/core/models/product.model';
import { AlertService } from '@app/core/services/alert.service';
import { BrandService } from '@app/core/services/brand.service';

@Component({
  selector: 'app-brand-dialog',
  standalone: false,
  templateUrl: './brand-dialog.component.html',
  styleUrls: ['./brand-dialog.component.css']
})

export class BrandDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() editingBrand: BrandDTO | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<BrandDTO>();

  brandForm: FormGroup;
  selectedFile?: File;
  previewUrl: string | null = null;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    private alertService: AlertService
  ) {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
      baseSku: ['', Validators.required]
    });
  }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingBrand']) {
      if (this.editingBrand) {
        this.brandForm.patchValue({
          name: this.editingBrand.name,
          baseSku: this.editingBrand.baseSku
        });
        this.previewUrl = this.editingBrand.logo || null;
      } else {
        this.brandForm.reset();
        this.previewUrl = null;
      }
    }

    // ❗ prevent clearing form while uploading
    if (changes['visible'] && !this.visible && !this.isUploading) {
      this.brandForm.reset();
      this.previewUrl = null;
      this.selectedFile = undefined;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.previewUrl = null;
    this.selectedFile = undefined;

    const input = document.getElementById('brandLogo') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return;

    const name = this.brandForm.value.name.trim();
    const baseSku = this.brandForm.value.baseSku.trim(); // ✅ define it

    if (!name || !baseSku) return;

    const saveOrUpdate = (logoUrl?: string) => {
      const dto: BrandDTO = {
        id: this.editingBrand?.id || '',
        name,
        baseSku: baseSku,
        logo: logoUrl ?? this.editingBrand?.logo ?? ''
      };

      console.log("brand dto : ", dto);


      const action$ = this.editingBrand
        ? this.brandService.updateBrand(dto)
        : this.brandService.createBrand(dto);

      action$.subscribe({
        next: (savedBrand: BrandDTO) => {
          this.alertService.toast(
            `Brand ${this.editingBrand ? 'updated' : 'created'} successfully.`,
            'success'
          );
          this.isUploading = false;
          this.save.emit(savedBrand);
          this.closeDialog();
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Error saving brand:', err);

          const message =
            err?.error?.message || // if backend uses ResponseStatusException
            err?.error ||          // fallback if backend returns string directly
            'Failed to save brand.';
          this.alertService.toast(message, 'error');
        }
      });
    };

    if (this.selectedFile) {
      this.isUploading = true;
      this.brandService.uploadImage(this.selectedFile).subscribe({
        next: (url: string) => saveOrUpdate(url),
        error: (err) => {
          this.isUploading = false;
          console.error('Image upload error:', err);
          this.alertService.toast('Image upload failed.', 'error');
        }
      });
    } else {
      this.isUploading = true;
      saveOrUpdate();
    }
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
}
