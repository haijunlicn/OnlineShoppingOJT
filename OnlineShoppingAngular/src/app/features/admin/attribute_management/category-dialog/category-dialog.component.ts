import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryDTO } from '@app/core/models/category-dto';
import { AlertService } from '@app/core/services/alert.service';
import { CategoryService } from '@app/core/services/category.service';
import { CloudinaryService } from '@app/core/services/cloudinary.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-category-dialog',
  standalone: false,
  templateUrl: './category-dialog.component.html',
  styleUrl: './category-dialog.component.css'
})
export class CategoryDialogComponent {
  @Input() visible = false
  @Input() editingCategory: CategoryDTO | null = null
  @Input() parentCategoryForNew: CategoryDTO | null = null
  @Input() categoryDropdown: any[] = []

  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() save = new EventEmitter<CategoryDTO>()

  categoryForm: FormGroup
  isAddingSubcategory = false
  categoryImagePreview: string | null = null
  selectedImage: File | null = null
  defaultCategoryImage = "/assets/default-category.png"
  isUploading: boolean = false;


  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private cloudinaryService: CloudinaryService,
    private alertService: AlertService
  ) {
    this.categoryForm = this.fb.group({
      id: [null],
      name: ["", Validators.required],
      parentCategoryId: [null],
      imagePath: [null],
    })
  }

  ngOnInit(): void {
    this.setupForm()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"] && this.visible) {
      this.setupForm()
    }
  }

  private setupForm(): void {
    // Reset image state
    this.selectedImage = null
    this.categoryImagePreview = null
    this.isAddingSubcategory = !!this.parentCategoryForNew

    if (this.editingCategory) {
      // Editing existing category
      this.categoryForm.patchValue({
        id: this.editingCategory.id,
        name: this.editingCategory.name,
        parentCategoryId: this.editingCategory.parentCategoryId,
        imagePath: this.editingCategory.imgPath || null,
      })

      // If category has an image, show its preview
      if (this.editingCategory.imgPath) {
        this.categoryImagePreview = this.getCategoryImage(this.editingCategory)
      }
    } else {
      // Adding new category
      this.categoryForm.reset({
        parentCategoryId: this.parentCategoryForNew ? this.parentCategoryForNew.id : null,
      })
    }
  }

  getCategoryImage(category: CategoryDTO): string {
    return category.imgPath || this.defaultCategoryImage
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.categoryImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      this.alertService.toast("Image selected for upload.", "info");
    }
  }

  removeCategoryImage(): void {
    this.selectedImage = null;
    this.categoryImagePreview = null;
    this.categoryForm.patchValue({
      imagePath: null,
    });
    this.alertService.toast("Category image removed.", "info");
  }


  getSelectedCategoryName(): string | null {
    const parentId = this.categoryForm.get("parentCategoryId")?.value
    if (!parentId) return null

    const category = this.categoryDropdown.find((cat) => cat.value === parentId)
    return category ? category.label : null
  }

  selectParentCategory(categoryId: number | null): void {
    this.categoryForm.patchValue({
      parentCategoryId: categoryId,
    })
  }

  saveCategory(): void {
  if (this.categoryForm.invalid) return;

  this.isUploading = true; // Start loading

  const formValue = this.categoryForm.value;

  const handleAfterSave = (savedCategory: CategoryDTO) => {
    this.alertService.toast(
      this.editingCategory ? "Category updated successfully." : "Category created successfully.",
      'success'
    );
    this.save.emit(savedCategory);
    this.closeDialog();
    this.isUploading = false; // End loading
  };

  const handleError = (errorMessage: string, errorObj: any) => {
    this.isUploading = false; // End loading
  };

  const saveWithImage = (imgPath?: string) => {

    const save$ = this.editingCategory
      ? this.categoryService.updateCategory(categoryDTO)
      : this.categoryService.createCategory(categoryDTO);

    save$.subscribe({
      next: (savedCategory) => handleAfterSave(savedCategory),
      error: (err) => {
        handleError(
          this.editingCategory ? "Failed to update category." : "Failed to create category.",
          err
        );
      },
    });
  };

  if (this.selectedImage) {
    this.uploadImage(this.selectedImage).subscribe({
      next: (imgPath: string) => saveWithImage(imgPath),
      error: (err: unknown) => {
        handleError("Image upload failed.", err);
      },
    });
  } else {
    saveWithImage(formValue.imagePath);
  }
}
  private buildCategoryDTO(formValue: any, imagePath?: string): CategoryDTO {
    return {
      id: this.editingCategory?.id,
      name: formValue.name,
      parentCategoryId: formValue.parentCategoryId || undefined,
      imgPath: imagePath || "",
    }
  }

  private uploadImage(file: File): Observable<string> {
    return this.cloudinaryService.uploadImage(file)
  }

  closeDialog(): void {
    this.visible = false
    this.visibleChange.emit(false)
    this.selectedImage = null
    this.categoryImagePreview = null
  }
}
