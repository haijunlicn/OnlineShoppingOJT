// import {
//   Component,
//   OnInit,
//   Inject,
//   PLATFORM_ID,
//   ChangeDetectorRef,
// } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { LocationService } from '../../../../core/services/location.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-location-card',
//   standalone:false,
//   templateUrl: './location-card.component.html',
//   styleUrls: ['./location-card.component.css'],
// })
// export class LocationCardComponent implements OnInit {
//   locations: any[] = [];
//   errorMessage: string = '';
//   L: any; // Leaflet namespace
//   isBrowser: boolean;

//   constructor(
//     private locationService: LocationService,
//     private cdr: ChangeDetectorRef,private router:Router,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {
//     this.isBrowser = isPlatformBrowser(platformId);
//   }

//   async ngOnInit() {
//     if (!this.isBrowser) return;

//     // Load Leaflet only in browser
//     this.L = await import('leaflet');

//     // Fix marker icon
//     const defaultIcon = this.L.icon({
//       iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//       shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//       iconSize: [25, 41],
//       iconAnchor: [12, 41],
//       popupAnchor: [1, -34],
//       shadowSize: [41, 41],
//     });
//     this.L.Marker.prototype.options.icon = defaultIcon;

//     // Load all user locations
//     this.locationService.getUserLocations().subscribe({
//       next: (data) => {
//         this.locations = data;
//         this.cdr.detectChanges();

//         // Initialize maps
//         setTimeout(() => {
//           this.locations.forEach((location, index) => {
//             this.initMap(location, index);
//           });
//         }, 200);
//       },
//       error: (err) => {
//         this.errorMessage = 'Failed to load locations.';
//         console.error(err);
//       },
//     });
//   }

//   initMap(location: any, index: number): void {
//     if (!location || location.lat == null || location.lng == null) return;

//     const mapId = `map-${index}`;
//     const map = this.L.map(mapId).setView([location.lat, location.lng], 13);

//     this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '&copy; OpenStreetMap contributors',
//     }).addTo(map);

//     this.L.marker([location.lat, location.lng])
//       .addTo(map)
//       .bindPopup('Location')
//       .openPopup();
//   }

//   onEdit(location: any) {
//     this.router.navigate(['/customer/editlocation', location.id]);

//   }

//   onDelete(location: any) {
//     alert('Delete clicked for ID: ' + location.id);
//   }
// }
import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../../../../core/services/location.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service'; // Adjust path
import { LocationDto } from '../../../../core/models/location-dto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-location-card',
  templateUrl: './location-card.component.html',
  styleUrls: ['./location-card.component.css'],
  standalone: false,
})
export class LocationCardComponent implements OnInit, OnDestroy {
  locations: LocationDto[] = [];
  errorMessage: string = '';
  L: any; // Leaflet namespace
  isBrowser: boolean;
  subscriptions: Subscription[] = [];

  constructor(
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (!this.isBrowser) return;

    // Load Leaflet only in browser
    this.L = await import('leaflet');

    // Fix marker icon path for Leaflet
    const defaultIcon = this.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    this.L.Marker.prototype.options.icon = defaultIcon;

    this.loadUserLocations();
  }

  loadUserLocations() {
  const userId = this.authService.getCurrentUser()?.id;
  if (!userId) {
    this.errorMessage = 'User not logged in.';
    return;
  }

  const sub = this.locationService.getUserLocations(userId).subscribe({
    next: (data) => {
      this.locations = data;
      this.cdr.detectChanges();

      // Delay map initialization to wait for DOM
      setTimeout(() => {
        this.locations.forEach((location, index) => {
          this.initMap(location, index);
        });
      }, 200);
    },
    error: (err) => {
      this.errorMessage = 'Failed to load locations.';
      console.error(err);
    },
  });

  this.subscriptions.push(sub);
}


  initMap(location: LocationDto, index: number): void {
    if (!location || location.lat == null || location.lng == null) return;

    const mapId = `map-${index}`;
    const map = this.L.map(mapId).setView([location.lat, location.lng], 13);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    this.L.marker([location.lat, location.lng])
      .addTo(map)
      .bindPopup('Location')
      .openPopup();
  }

  onEdit(location: LocationDto) {
    this.router.navigate(['/customer/editlocation', location.id]);
  }

  onDelete(location: LocationDto) {
    if (confirm('Are you sure you want to delete this location?')) {
      const sub = this.locationService.deleteLocation(location.id!).subscribe({
        next: () => {
          this.locations = this.locations.filter((loc) => loc.id !== location.id);
          alert('Location deleted successfully.');
        },
        error: () => alert('Failed to delete location.'),
      });
      this.subscriptions.push(sub);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
