import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../../../../core/services/location.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-location-card',
  standalone:false,
  templateUrl: './location-card.component.html',
  styleUrls: ['./location-card.component.css'],
})
export class LocationCardComponent implements OnInit {
  locations: any[] = [];
  errorMessage: string = '';
  L: any; // Leaflet namespace
  isBrowser: boolean;

  constructor(
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,private router:Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (!this.isBrowser) return;

    // Load Leaflet only in browser
    this.L = await import('leaflet');

    // Fix marker icon
    const defaultIcon = this.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    this.L.Marker.prototype.options.icon = defaultIcon;

    // Load all user locations
    this.locationService.getUserLocations().subscribe({
      next: (data) => {
        this.locations = data;
        this.cdr.detectChanges();

        // Initialize maps
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
  }

  initMap(location: any, index: number): void {
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

  onEdit(location: any) {
    this.router.navigate(['/customer/editlocation', location.id]);

  }

  onDelete(location: any) {
    alert('Delete clicked for ID: ' + location.id);
  }
}
