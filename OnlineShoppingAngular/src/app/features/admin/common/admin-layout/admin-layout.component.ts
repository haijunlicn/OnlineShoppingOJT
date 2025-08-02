import { Component, OnInit } from '@angular/core';
import { User } from '@app/core/models/User';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: "app-admin-layout",
  standalone: false,
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.css"],
})

export class AdminLayoutComponent implements OnInit {
  sidebarExpanded = true

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.accountInfo = {
          name: user.name,
          roleName: user.roleName
        };
      }
    });
  }

  accountInfo: Partial<User> = {};

  onSidebarToggle(isExpanded: boolean) {
    this.sidebarExpanded = isExpanded
  }
}
