import { Component } from '@angular/core';
import { OptionTypeDTO } from '../../../../core/models/option.model';

@Component({
  selector: 'app-product-attributes',
  standalone: false,
  templateUrl: './product-attributes.component.html',
  styleUrl: './product-attributes.component.css'
})
export class ProductAttributesComponent {
  // Fake data for demonstration
  optionTypes: OptionTypeDTO[] = [
    {
      id: '1',
      name: 'Color',
      optionValues: [
        { id: 1, optionId: 1, value: 'Red' },
        { id: 2, optionId: 1, value: 'Blue' },
        { id: 3, optionId: 1, value: 'Green' }
      ]
    },
    {
      id: '2',
      name: 'RAM',
      optionValues: [
        { id: 4, optionId: 2, value: '4GB' },
        { id: 5, optionId: 2, value: '8GB' }
      ]
    }
  ];

  optionValues: Array<{ optionTypeName: string; value: string; deleted?: boolean }> = [
    { optionTypeName: 'Color', value: 'Red' },
    { optionTypeName: 'Color', value: 'Blue' },
    { optionTypeName: 'RAM', value: '4GB' },
    { optionTypeName: 'RAM', value: '8GB', deleted: true }
  ];

  // Dialog visibility
  optionTypeDialogVisible = false;
  optionValueDialogVisible = false;

  // Methods for dialog actions (stubbed for now)
  openOptionTypeDialog() { this.optionTypeDialogVisible = true; }
  openOptionValueDialog() { this.optionValueDialogVisible = true; }
  editOptionType(type: OptionTypeDTO) { this.optionTypeDialogVisible = true; }
  deleteOptionType(type: OptionTypeDTO) { /* Implement delete logic */ }
  editOptionValue(val: any) { this.optionValueDialogVisible = true; }
  deleteOptionValue(val: any) { /* Implement delete logic */ }
}
