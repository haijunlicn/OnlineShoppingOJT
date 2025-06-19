import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CategoryDTO, CategoryOptionDTO } from '@app/core/models/category-dto';
import { OptionDTO, OptionTypeDTO } from '@app/core/models/option.model';
import { OptionService } from '@app/core/services/option.service';
import { CategoryOptionService } from '@app/core/services/category-option.service';
import { CategoryService } from '@app/core/services/category.service';
import { AlertService } from '@app/core/services/alert.service';

@Component({
  selector: 'app-category-options-dialog',
  standalone: false,
  templateUrl: './category-options-dialog.component.html',
  styleUrls: ['./category-options-dialog.component.css'] // fixed "styleUrl" to "styleUrls"
})
export class CategoryOptionsDialogComponent implements OnInit {
  @Input() visible = false
  @Input() category: CategoryDTO | null = null
  @Input() selectedOptions: OptionTypeDTO[] = []
  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() save = new EventEmitter<void>()

  availableOptions: OptionTypeDTO[] = []
  filteredOptions: OptionTypeDTO[] = []
  selectedOptions1: OptionTypeDTO[] = []
  loading = false
  saving = false

  constructor(
    private optionService: OptionService,
    private categoryOptionService: CategoryOptionService,
    private categoryService: CategoryService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.loadOptions()
  }

  trackByOption(index: number, option: OptionTypeDTO): number {
    return Number(option.id) || index
  }

  loadOptions(): void {
    this.loading = true
    this.optionService.getAllOptionTypes().subscribe({
      next: (options: OptionTypeDTO[]) => {
        this.availableOptions = options
        this.filteredOptions = [...options]
        this.loading = false

        if (this.visible && this.category) {
          //this.loadCategoryOptions()
        }
      },
      error: (error) => {
        console.error("Error loading options:", error)
        this.loading = false
      },
    })
  }

  isOptionSelected(option: OptionTypeDTO): boolean {
    return this.selectedOptions.some((selected) => selected.id === option.id)
  }

  toggleOption(option: OptionTypeDTO): void {
    const index = this.selectedOptions.findIndex((selected) => selected.id === option.id)
    if (index > -1) {
      this.selectedOptions.splice(index, 1)
    } else {
      this.selectedOptions.push(option)
    }
  }

  filterOptions(query: string): void {
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) {
      this.filteredOptions = [...this.availableOptions]
    } else {
      this.filteredOptions = this.availableOptions.filter((opt) => opt.name.toLowerCase().includes(lowerQuery))
    }
  }

  onSave(): void {
    if (!this.category?.id) return;

    this.saving = true;
    const now = new Date();

    const requests: CategoryOptionDTO[] = this.selectedOptions.map((option) => ({
      categoryId: this.category!.id!,
      optionId: Number(option.id),
      name: option.name,
      selectedAt: now,
    }));

    this.categoryOptionService.saveCategoryOptions(this.category!.id!, requests).subscribe({
      next: () => {
        this.saving = false;
        this.alertService.toast("Category options saved!", "success"); // ✅ Show toast
        this.onHide();
        this.save.emit();
      },
      error: (error) => {
        console.error("Error saving category options:", error);
        this.alertService.toast("Failed to save category options", "error"); // ✅ Error toast
        this.saving = false;
      },
    });
  }

  onHide(): void {
    this.visible = false
    this.visibleChange.emit(false)
    // this.selectedOptions = []
    this.filteredOptions = [...this.availableOptions]
  }

  getSelectedCount(): number {
    return this.selectedOptions.length
  }
}
