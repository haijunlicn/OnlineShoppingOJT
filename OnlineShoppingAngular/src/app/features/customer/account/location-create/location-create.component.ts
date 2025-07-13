import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LocationService } from '../../../../core/services/location.service';
import { LocationDto } from '../../../../core/models/location-dto';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-location',
  standalone: false,
  templateUrl: './location-create.component.html',
  styleUrls: ['./location-create.component.css']
})
export class LocationCreateComponent implements OnInit, OnDestroy {
  map: any;
  marker: any;
  addressForm: FormGroup;
  searchControl: FormControl;
  currentLatLng: any = null;
  isLoading = false;
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean = false;
  private L: any;

  constructor(
    private locationService: LocationService,
    private formBuilder: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object,
     private authService: AuthService // Add this
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.addressForm = this.formBuilder.group({
      address: ['', Validators.required],
      township: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: [''],
      country: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^09\d{7,9}$/)
        ]
      ]
    });

    this.searchControl = new FormControl('');
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) { 
      this.L = await import('leaflet');
      this.setupCustomMarkerIcon();
      this.initMap();

      this.addressForm.get('lat')?.valueChanges.subscribe(() => this.updateMarkerFromForm());
      this.addressForm.get('lng')?.valueChanges.subscribe(() => this.updateMarkerFromForm());
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    const myanmarBounds = this.L.latLngBounds(
      this.L.latLng(9.5, 92.2),   // Southwest
      this.L.latLng(28.6, 101.2)  // Northeast
    );
    this.map = this.L.map('map', {
      zoomControl: false,
      attributionControl: false,
      maxBounds: myanmarBounds,
      maxBoundsViscosity: 1.0
    }).setView([20, 96], 5);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.addMarker(e.latlng);
      this.reverseGeocodeLocation(e.latlng.lat, e.latlng.lng);
    });

    // Prevent panning outside Myanmar
    this.map.on('drag', () => {
      this.map.panInsideBounds(myanmarBounds, { animate: false });
    });

    this.map.setMaxBounds(myanmarBounds);
  }

  autoLocate(): void {
    this.isLoading = true;
    const geoSub = this.locationService.getCurrentPosition().subscribe({
      next: (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latlng = this.L.latLng(lat, lng);
        this.map.setView(latlng, 15);
        this.addMarker(latlng);
        this.reverseGeocodeLocation(lat, lng);
        this.isLoading = false;
      },
      error: () => {
        Swal.fire('Unable to retrieve your location.', '', 'error');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(geoSub);
  }

  addMarker(latlng: any): void {
    const myanmarBounds = this.L.latLngBounds(
      this.L.latLng(9.5, 92.2),
      this.L.latLng(28.6, 101.2)
    );
    if (!myanmarBounds.contains(latlng)) {
      Swal.fire('Please select a location within Myanmar.', '', 'warning');
      return;
    }
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = this.L.marker(latlng).addTo(this.map);
    this.currentLatLng = latlng;

    // Update form lat/lng without triggering valueChanges
    this.addressForm.patchValue({
      lat: latlng.lat,
      lng: latlng.lng
    }, { emitEvent: false });
  }

  updateMarkerFromForm(): void {
    const lat = this.addressForm.get('lat')?.value;
    const lng = this.addressForm.get('lng')?.value;

    if (lat != null && lng != null && this.map) {
      const latlng = this.L.latLng(lat, lng);
      this.map.setView(latlng, 15);

      if (this.marker) {
        this.marker.setLatLng(latlng);
      } else {
        this.marker = this.L.marker(latlng).addTo(this.map);
      }
      this.currentLatLng = latlng;
    }
  }

  reverseGeocodeLocation(lat: number, lng: number): void {
    const geocodeSub = this.locationService.reverseGeocode(lat, lng).subscribe({
      next: (data) => this.populateAddressFields(data),
      error: (error) => console.error('Reverse geocoding error:', error)
    });
    this.subscriptions.push(geocodeSub);
  }

  populateAddressFields(data: any): void {
    const address = data.address || {};
    const streetAddress = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean).join(' ');

    const township =
      address.township ||
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.county ||
      '';

    this.addressForm.patchValue({
      address: streetAddress || data.display_name?.split(',')[0] || '',
      township: township,
      city: address.city || address.town || address.village || '',
      zipCode: address.postcode || '',
      country: address.country || ''
    });
  }

  saveLocation(): void {
  if (!this.currentLatLng) {
      Swal.fire('Please select a location first!', '', 'warning');
    return;
  }

  if (this.addressForm.invalid) {
      Swal.fire('Please fill in all required fields!', '', 'warning');
    return;
  }

  const userId = this.authService.getCurrentUser()?.id;

  if (!userId) {
      Swal.fire('User not logged in!', '', 'error');
    return;
  }

  const location: LocationDto = {
    lat: this.currentLatLng.lat,
    lng: this.currentLatLng.lng,
    address: this.addressForm.get('address')?.value || '',
    township: this.addressForm.get('township')?.value || '',
    city: this.addressForm.get('city')?.value || '',
    zipCode: String(this.addressForm.get('zipCode')?.value) || '',
    country: this.addressForm.get('country')?.value || '',
      userId: userId,
      phoneNumber: this.addressForm.get('phoneNumber')?.value || ''
  };

  const saveSub = this.locationService.saveLocation(location).subscribe({
      next: () => {
        Swal.fire('Location saved successfully!', '', 'success');
      },
      error: () => Swal.fire('Failed to save location.', '', 'error')
  });

  this.subscriptions.push(saveSub);
}

  onSearch(): void {
    const query = this.searchControl.value?.trim();
    if (!query) {
      Swal.fire('Please enter a location to search.', '', 'info');
      return;
    }

    this.isLoading = true;

    const searchSub = this.locationService.geocode(query).subscribe({
      next: (results: any[]) => {
        if (results.length === 0) {
          Swal.fire('Location not found.', '', 'warning');
          this.isLoading = false;
          return;
        }
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        const latlng = this.L.latLng(lat, lon);
        this.map.setView(latlng, 15);
        this.addMarker(latlng);
        this.populateAddressFields(firstResult);
        this.isLoading = false;
      },
      error: () => {
        Swal.fire('Failed to search location.', '', 'error');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(searchSub);
  }
}
