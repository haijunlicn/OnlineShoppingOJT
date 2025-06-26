import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CategoryDTO } from '@app/core/models/category-dto';

@Component({
  selector: 'app-category-grid',
  standalone: false,
  templateUrl: './category-grid.component.html',
  styleUrl: './category-grid.component.css'
})
export class CategoryGridComponent {
  @Input() categories: CategoryDTO[] = [];
  @Output() categoryClick = new EventEmitter<CategoryDTO>();

  onCategoryClick(category: CategoryDTO) {
    this.categoryClick.emit(category);
  }
}
