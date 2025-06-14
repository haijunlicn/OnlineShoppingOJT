import { Component, OnInit, ViewChild } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MenuItem } from "primeng/api"
import { Menu } from "primeng/menu"
import { OptionTypeDTO, OptionValueDTO } from "../../../../core/models/option.model"
import { OptionService } from "../../../../core/services/option.service"
import { OptionvalueService } from "../../../../core/services/optionvalue.service"

@Component({
  selector: "app-option-management",
  standalone: false,
  templateUrl: "./option-management.component.html",
  styleUrls: ["./option-management.component.css"],
})
export class OptionManagementComponent implements OnInit {
  options: OptionTypeDTO[] = []
  filteredOptions: OptionTypeDTO[] = []
  optionFilter = ""

  @ViewChild("valueMenu") valueMenu!: Menu

  valueMenuItems: MenuItem[] = []
  selectedValueForMenu: OptionValueDTO | null = null
  selectedOptionForMenu: OptionTypeDTO | null = null

  // Loading state
  loadingOptions = false

  // Dialog visibility
  optionDialogVisible = false
  optionValueDialogVisible = false

  // Edit states
  editingOption: OptionTypeDTO | null = null
  editingOptionValue: OptionValueDTO | null = null
  selectedOption: OptionTypeDTO | null = null

  // Forms
  optionForm: FormGroup
  optionValueForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private optionService: OptionService,
    private optionValueService: OptionvalueService,
  ) {
    this.optionForm = this.fb.group({
      id: [""],
      name: ["", Validators.required],
    })

    this.optionValueForm = this.fb.group({
      id: [null],
      optionId: [null],
      value: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadOptions()
  }

<<<<<<< Updated upstream
  // updateFilters(): void {
  //   this.filteredOptions = this.options.filter((option) =>
  //     option.name.toLowerCase().includes(this.optionFilter.toLowerCase()),
  //   )
  // }

  updateFilters(): void {
    const filterValue = this.optionFilter?.toLowerCase() ?? '';
    this.filteredOptions = this.options.filter(option =>
      option?.name?.toLowerCase().includes(filterValue)
    );
  }


=======
  updateFilters(): void {
    this.filteredOptions = this.options.filter((option) =>
      option.name.toLowerCase().includes(this.optionFilter.toLowerCase()),
    )
  }

>>>>>>> Stashed changes
  loadOptions(): void {
    this.loadingOptions = true
    this.optionService.getAllOptionTypes().subscribe({
      next: (options: OptionTypeDTO[]) => {
        this.options = options
        this.updateFilters()
        this.loadingOptions = false
      },
      error: (error) => {
        console.error("Error loading options:", error)
        this.loadingOptions = false
      },
    })
  }

  openOptionDialog(option?: OptionTypeDTO): void {
    this.editingOption = option || null

    if (option) {
      this.optionForm.patchValue({
        id: option.id,
        name: option.name,
      })
    } else {
      this.optionForm.reset()
    }

    this.optionDialogVisible = true
  }

  saveOption(): void {
<<<<<<< Updated upstream
    if (this.optionForm.invalid) return;
    const formValue = this.optionForm.value;

    if (this.editingOption) {
=======
    if (this.optionForm.invalid) return

    const formValue = this.optionForm.value

    if (this.editingOption) {
      // Update existing option
>>>>>>> Stashed changes
      const updateData: OptionTypeDTO = {
        id: this.editingOption.id,
        name: formValue.name,
        optionValues: this.editingOption.optionValues,
<<<<<<< Updated upstream
      };

      this.optionService.updateOptionType(updateData).subscribe({
        next: () => {
          this.optionDialogVisible = false;
          this.loadOptions(); // ✅ reload
        },
        error: (error) => {
          console.error("Error updating option:", error);
        },
      });
    } else {
      const newOption: OptionTypeDTO = {
        id: "",
        name: formValue.name,
        optionValues: [],
      };

      this.optionService.createOptionType(newOption).subscribe({
        next: () => {
          this.optionDialogVisible = false;
          this.loadOptions(); // ✅ reload
        },
        error: (error) => {
          console.error("Error creating option:", error);
        },
      });
    }
  }


=======
      }

      this.optionService.updateOptionType(updateData).subscribe({
        next: (updatedOption) => {
          const index = this.options.findIndex((o) => o.id === this.editingOption!.id)
          if (index !== -1) {
            this.options[index] = updatedOption
          }
          this.updateFilters()
          this.optionDialogVisible = false
        },
        error: (error) => {
          console.error("Error updating option:", error)
        },
      })
    } else {
      // Create new option
      const newOption: OptionTypeDTO = {
        id: "", // Backend will generate
        name: formValue.name,
        optionValues: [],
      }

      this.optionService.createOptionType(newOption).subscribe({
        next: (createdOption) => {
          this.options.push(createdOption)
          this.updateFilters()
          this.optionDialogVisible = false
        },
        error: (error) => {
          console.error("Error creating option:", error)
        },
      })
    }
  }

>>>>>>> Stashed changes
  editOption(option: OptionTypeDTO): void {
    this.openOptionDialog(option)
  }

  deleteOption(option: OptionTypeDTO): void {
    if (confirm(`Are you sure you want to delete the option "${option.name}"?`)) {
      this.optionService.deleteOptionType(Number.parseInt(option.id)).subscribe({
        next: () => {
          this.options = this.options.filter((o) => o.id !== option.id)
          this.updateFilters()
        },
        error: (error) => {
          console.error("Error deleting option:", error)
        },
      })
    }
  }

  addValueToOption(option: OptionTypeDTO): void {
    this.selectedOption = option
    this.editingOptionValue = null
    this.optionValueForm.reset({
      optionId: Number.parseInt(option.id),
    })
    this.optionValueDialogVisible = true
  }

  editOptionValue(value: OptionValueDTO, option: OptionTypeDTO): void {
    this.selectedOption = option
    this.editingOptionValue = value
    this.optionValueForm.patchValue({
      id: value.id,
      optionId: value.optionId,
      value: value.value,
    })
    this.optionValueDialogVisible = true
  }

  saveOptionValue(): void {
<<<<<<< Updated upstream
    if (this.optionValueForm.invalid || !this.selectedOption) return;

    const formValue = this.optionValueForm.value;

    if (this.editingOptionValue) {
=======
    if (this.optionValueForm.invalid || !this.selectedOption) return

    const formValue = this.optionValueForm.value

    if (this.editingOptionValue) {
      // Update existing value
>>>>>>> Stashed changes
      const updateData: OptionValueDTO = {
        id: this.editingOptionValue.id,
        optionId: formValue.optionId,
        value: formValue.value,
<<<<<<< Updated upstream
      };

      this.optionValueService.updateOptionValues(updateData).subscribe({
        next: () => {
          this.optionValueDialogVisible = false;
          this.loadOptions(); // ✅ reload
        },
        error: (error) => {
          console.error("Error updating option value:", error);
        },
      });
    } else {
      const newValue: OptionValueDTO = {
        optionId: formValue.optionId,
        value: formValue.value,
      };

      this.optionValueService.createOptionValue(newValue).subscribe({
        next: () => {
          this.optionValueDialogVisible = false;
          this.loadOptions(); // ✅ reload
        },
        error: (error) => {
          console.error("Error creating option value:", error);
        },
      });
    }
  }


=======
      }

      this.optionValueService.updateOptionValues(updateData).subscribe({
        next: (updatedValue) => {
          const optionIndex = this.options.findIndex((o) => o.id === this.selectedOption!.id)
          if (optionIndex !== -1) {
            const valueIndex = this.options[optionIndex].optionValues.findIndex(
              (v) => v.id === this.editingOptionValue!.id,
            )
            if (valueIndex !== -1) {
              this.options[optionIndex].optionValues[valueIndex] = updatedValue
            }
          }
          this.optionValueDialogVisible = false
        },
        error: (error) => {
          console.error("Error updating option value:", error)
        },
      })
    } else {
      // Create new value
      const newValue: OptionValueDTO = {
        optionId: formValue.optionId,
        value: formValue.value,
      }

      this.optionValueService.createOptionValue(newValue).subscribe({
        next: (createdValue) => {
          const optionIndex = this.options.findIndex((o) => o.id === this.selectedOption!.id)
          if (optionIndex !== -1) {
            this.options[optionIndex].optionValues.push(createdValue)
          }
          this.optionValueDialogVisible = false
        },
        error: (error) => {
          console.error("Error creating option value:", error)
        },
      })
    }
  }

>>>>>>> Stashed changes
  deleteOptionValue(value: OptionValueDTO, option: OptionTypeDTO): void {
    if (confirm(`Are you sure you want to delete the value "${value.value}"?`)) {
      this.optionValueService.deleteOptionValue(value.id!).subscribe({
        next: () => {
          const optionIndex = this.options.findIndex((o) => o.id === option.id)
          if (optionIndex !== -1) {
            this.options[optionIndex].optionValues = this.options[optionIndex].optionValues.filter(
              (v) => v.id !== value.id,
            )
          }
        },
        error: (error) => {
          console.error("Error deleting option value:", error)
        },
      })
    }
  }

  showValueMenu(event: MouseEvent, value: OptionValueDTO, option: OptionTypeDTO): void {
    this.selectedValueForMenu = value;
    this.selectedOptionForMenu = option;

    this.valueMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.editOptionValue(value, option),
        styleClass: 'menu-item menu-item-editOptionValue',
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteOptionValue(value, option),
        styleClass: 'menu-item menu-item-deleteOptionValue',
      },
    ];

    const buttonEl = event.currentTarget as HTMLElement;
<<<<<<< Updated upstream

=======
    
>>>>>>> Stashed changes
    this.valueMenu.toggle(event); // ✅ Use event, not button
  }


}
