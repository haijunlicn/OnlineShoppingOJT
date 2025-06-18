import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { LocationDto } from '../../../../core/models/location-dto';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService } from '../../../../core/services/location.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-edit-location',
  standalone: false,
  templateUrl: './edit-location.component.html',
  styleUrls: ['./edit-location.component.css']
})
export class EditLocationComponent implements OnInit, OnDestroy {
  editForm: FormGroup;
  locationId!: number;
  isBrowser: boolean = false;
  L: any;
  map: any;
  marker: any;
  currentLatLng: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private locationService: LocationService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.editForm = this.fb.group({
      address: ['', Validators.required],
      township: [''],
      city: ['', Validators.required],
      zipCode: [''],
      country: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.locationId = +this.route.snapshot.paramMap.get('id')!;
    const sub = this.locationService.getLocationById(this.locationId).subscribe((data: LocationDto) => {
      this.editForm.patchValue(data);
      if (this.isBrowser) {
        this.loadMapLibrary().then(() => {
          this.setupCustomMarkerIcon();
          this.initMap();
          if (data.lat && data.lng) {
            this.addMarker({ lat: data.lat, lng: data.lng });
          }
        });
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadMapLibrary(): Promise<void> {
    if (!this.L) {
      this.L = await import('leaflet');
    }
  }

  setupCustomMarkerIcon(): void {
    const defaultIcon = this.L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    this.L.Marker.prototype.options.icon = defaultIcon;
  }

  initMap(): void {
    this.map = this.L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([20, 96], 5);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.addMarker(e.latlng);
      this.reverseGeocodeLocation(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => this.map.invalidateSize(), 0); // fix rendering
  }

  addMarker(latlng: any): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = this.L.marker(latlng).addTo(this.map);
    this.map.setView(latlng, 15);
    this.currentLatLng = latlng;

    this.editForm.patchValue({
      lat: latlng.lat,
      lng: latlng.lng
    }, { emitEvent: false });
  }

  reverseGeocodeLocation(lat: number, lng: number): void {
    const sub = this.locationService.reverseGeocodes(lat, lng).subscribe({
      next: (data) => this.populateAddressFields(data),
      error: (err) => console.error('Reverse geocode failed.', err)
    });
    this.subscriptions.push(sub);
  }

  populateAddressFields(data: any): void {
    const address = data.address || {};
    const streetAddress = [address.house_number, address.road || address.street].filter(Boolean).join(' ');
    const township = address.township || address.suburb || address.village || address.county || '';

    this.editForm.patchValue({
      address: streetAddress || data.display_name?.split(',')[0] || '',
      township: township,
      city: address.city || address.town || address.village || '',
      zipCode: address.postcode || '',
      country: address.country || ''
    });
  }

  updateLocation(): void {
    if (this.editForm.valid) {
      const updatedLocation: LocationDto = {
        ...this.editForm.value,
        id: this.locationId
      };
      const sub = this.locationService.updateLocation(updatedLocation).subscribe({
        next: () => {
          alert('Location updated successfully!');
          this.router.navigate(['/customer/address']);
        },
        error: () => alert('Failed to update location.')
      });
      this.subscriptions.push(sub);
    } else {
      alert('Please complete the form.');
    }
  }

  searchLocation(query: string): void {
    if (!query.trim()) return;

    const sub = this.locationService.searchLocation(query).subscribe({
      next: (result: any) => {
        if (result && result.length > 0) {
          const place = result[0];
          const lat = parseFloat(place.lat);
          const lon = parseFloat(place.lon);
          const latlng = { lat, lng: lon };
          this.addMarker(latlng);
          this.map.setView(latlng, 15);
          this.reverseGeocodeLocation(lat, lon);
        } else {
          alert('Location not found.');
        }
      },
      error: () => alert('Search failed.')
    });

    this.subscriptions.push(sub);
  }
}
