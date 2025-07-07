import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: "app-search-bar",
  standalone: false,
  templateUrl: "./search-bar.component.html",
  styleUrls: ["./search-bar.component.css"],
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>()

  searchQuery = ""

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.search.emit(this.searchQuery.trim())
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.onSearch()
    }
  }
}
