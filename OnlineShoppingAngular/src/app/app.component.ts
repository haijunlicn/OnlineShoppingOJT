import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'britium-gallery';

  // app.component.ts
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // this.authService.initializeUserFromToken();
  }

}
