import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-sidebar',
  standalone: false,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {

  //   @Input() role = "SUPER_ADMIN"
  // @Input() accountInfo: any = {
  //   name: "Admin User",
  //   assignedCinemaName: "",
  //   assignedCinemaId: "",
  // }

  role: string = 'SUPER_ADMIN'; // or 'CINEMA_ADMIN'
  accountInfo = {
    name: 'John Doe',
    assignedCinemaName: 'Dream Cinema',
    assignedCinemaId: 1
  };
  
}
