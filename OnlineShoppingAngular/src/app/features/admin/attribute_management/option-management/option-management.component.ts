import { Component, OnInit, ViewChild } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { MenuItem } from "primeng/api"
import { Menu } from "primeng/menu"
import { OptionTypeDTO, OptionValueDTO } from "../../../../core/models/option.model"
import { OptionService } from "../../../../core/services/option.service"
import { OptionvalueService } from "../../../../core/services/optionvalue.service"
import Swal from "sweetalert2"
import { AlertService } from "@app/core/services/alert.service"

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
    private alertService: AlertService,
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

  editOption(option: OptionTypeDTO): void {
    this.openOptionDialog(option)
  }

  deleteOption(option: OptionTypeDTO): void {
    this.alertService.confirm(
      `Are you sure you want to delete the option "${option.name}"?`,
      'Delete Option'
    ).then((confirmed) => {
      if (confirmed) {
        this.optionService.deleteOptionType(Number.parseInt(option.id)).subscribe({
          next: () => {
            this.options = this.options.filter(o => o.id !== option.id);
            this.updateFilters();
            this.alertService.toast(`"${option.name}" has been deleted.`, 'success');
          },
          error: (error) => {
            console.error("Error deleting option:", error);
            this.alertService.toast('Failed to delete the option.', 'error');
          }
        });
      }
    });
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

  saveOption(option: OptionTypeDTO): void {
    if (option.id) {
      this.optionService.updateOptionType(option).subscribe(() => this.loadOptions());
    } else {
      this.optionService.createOptionType(option).subscribe(() => this.loadOptions());
    }
  }

  saveOptionValue(value: OptionValueDTO): void {
    if (value.id) {
      this.optionValueService.updateOptionValues(value).subscribe(() => this.loadOptions());
    } else {
      this.optionValueService.createOptionValue(value).subscribe(() => this.loadOptions());
    }
  }


  deleteOptionValue(value: OptionValueDTO, option: OptionTypeDTO): void {
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

    this.valueMenu.toggle(event); // ✅ Use event, not button
  }


}
