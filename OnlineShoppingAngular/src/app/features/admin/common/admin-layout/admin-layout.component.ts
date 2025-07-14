import { Component, OnInit } from '@angular/core';

@Component({
  selector: "app-admin-layout",
  standalone: false,
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.css"],
})

export class AdminLayoutComponent implements OnInit {
  sidebarExpanded = true

  constructor() { }

  ngOnInit(): void { }

  accountInfo: any = {
    name: "Admin User" // or load from a service later
  }

  onSidebarToggle(isExpanded: boolean) {
    this.sidebarExpanded = isExpanded
  }
}
