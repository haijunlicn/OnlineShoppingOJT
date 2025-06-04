import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-sidebar',
  standalone: false,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {

  role: string = 'SUPER_ADMIN'; // or 'CINEMA_ADMIN'
  accountInfo = {
    name: 'John Doe',
    assignedCinemaName: 'Dream Cinema',
    assignedCinemaId: 1
  };
  
}
