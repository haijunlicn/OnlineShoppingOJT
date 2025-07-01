import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StoreLocationDto } from '@app/core/models/storeLocationDto';
import { StoreLocationService } from '@app/core/services/store-location.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-store-address',
  standalone: false,
  templateUrl: './store-address.component.html',
  styleUrl: './store-address.component.css'
})
export class StoreAddressComponent implements OnInit, OnDestroy {
  stores: StoreLocationDto[] = [];
  selectedStore: StoreLocationDto | null = null;
  storeForm: FormGroup;
  searchControl: FormControl;
  map: any;
  marker: any;
  currentLatLng: any = null;
  isLoading = false;
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean = false;
  private L: any;

  constructor(
    private storeService: StoreLocationService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.storeForm = this.formBuilder.group({
      name: ['', Validators.required],
      fullAddress: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      phoneNumber: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      zipCode: ['', Validators.required]
    });

    this.searchControl = new FormControl('');
  }

  async ngOnInit(): Promise<void> {
    this.loadStores();
    if (this.isBrowser) {
      this.L = await import('leaflet');
      this.setupCustomMarkerIcon();
      this.initMap();
      this.storeForm.get('lat')?.valueChanges.subscribe(() => this.updateMarkerFromForm());
      this.storeForm.get('lng')?.valueChanges.subscribe(() => this.updateMarkerFromForm());
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadStores() {
    this.storeService.getAll().subscribe(data => this.stores = data);
  }

  selectStore(store: StoreLocationDto) {
    this.selectedStore = { ...store };
    this.storeForm.patchValue(this.selectedStore);
    if (this.isBrowser && this.L && this.map) {
      const latlng = this.L.latLng(store.lat, store.lng);
      this.map.setView(latlng, 15);
      this.addMarker(latlng);
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
      zoomControl: false,
      attributionControl: false
    }).setView([39.8283, -98.5795], 4);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.addMarker(e.latlng);
      this.reverseGeocodeLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  autoLocate(): void {
    this.isLoading = true;
    if (this.isBrowser && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const latlng = this.L.latLng(lat, lng);
          this.map.setView(latlng, 15);
          this.addMarker(latlng);
          this.reverseGeocodeLocation(lat, lng);
          this.isLoading = false;
        },
        () => {
          alert('Unable to retrieve your location.');
          this.isLoading = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not available in this environment.');
      this.isLoading = false;
    }
  }

  addMarker(latlng: any): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = this.L.marker(latlng).addTo(this.map);
    this.currentLatLng = latlng;
    this.storeForm.patchValue({
      lat: latlng.lat,
      lng: latlng.lng
    }, { emitEvent: false });
  }

  updateMarkerFromForm(): void {
    const lat = this.storeForm.get('lat')?.value;
    const lng = this.storeForm.get('lng')?.value;
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
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    this.http.get(url).subscribe({
      next: (data: any) => this.populateAddressFields(data),
      error: (error) => console.error('Reverse geocoding error:', error)
    });
  }

  populateAddressFields(data: any): void {
    const address = data.address || {};
    const streetAddress = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean).join(' ');
    this.storeForm.patchValue({
      fullAddress: streetAddress || data.display_name?.split(',')[0] || '',
      city: address.city || address.town || address.village || '',
      zipCode: address.postcode || '',
      country: address.country || ''
    });
  }

  onSearch(): void {
    const query = this.searchControl.value?.trim();
    if (!query) {
      alert('Please enter a location to search.');
      return;
    }
    this.isLoading = true;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`;
    this.http.get<any[]>(url).subscribe({
      next: (results: any[]) => {
        if (results.length === 0) {
          alert('Location not found.');
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
        alert('Failed to search location.');
        this.isLoading = false;
      }
    });
  }

  saveStore() {
    if (!this.currentLatLng) {
      alert('Please select a location first!');
      return;
    }
    if (this.storeForm.invalid) {
      alert('Please fill in all required fields!');
      return;
    }
    const store: StoreLocationDto = {
      ...this.storeForm.value,
      lat: this.currentLatLng.lat,
      lng: this.currentLatLng.lng,
      id: this.selectedStore?.id
    };
    if (this.selectedStore && this.selectedStore.id) {
      this.storeService.update(this.selectedStore.id, store).subscribe(() => {
        this.loadStores();
        this.selectedStore = null;
        this.storeForm.reset();
        this.currentLatLng = null;
        if (this.marker) this.map.removeLayer(this.marker);
      });
    } else {
      this.storeService.create(store).subscribe(() => {
        this.loadStores();
        this.storeForm.reset();
        this.currentLatLng = null;
        if (this.marker) this.map.removeLayer(this.marker);
      });
    }
  }

  deleteStore(id: number) {
    this.storeService.delete(id).subscribe(() => this.loadStores());
  }

  cancelEdit() {
    this.selectedStore = null;
    this.storeForm.reset();
    this.currentLatLng = null;
    if (this.marker) this.map.removeLayer(this.marker);
  }
}
