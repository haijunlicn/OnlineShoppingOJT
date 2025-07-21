import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
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
  activeStoreId: number | null = null;
  activeStore: StoreLocationDto | null = null;
  activeMap: any;
  showModal = false;
  storeForm: FormGroup;
  searchControl: FormControl;
  map: any;
  marker: any;
  currentLatLng: any = null;
  isLoading = false;
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean = false;
  private L: any;
  modalMap: any;
  modalMarker: any;

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
      phoneNumber: ['', [Validators.required, myanmarPhoneValidator]],
      city: ['', Validators.required],
      country: ['', Validators.required],
      zipCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, gmailValidator]]
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
    this.storeService.getAll().subscribe(data => {
      this.stores = data;
      const active = data.find(store => store.delFg === true);
      this.activeStoreId = active ? active.id! : null;
      this.activeStore = active || null;
      setTimeout(() => this.initActiveStoreMap(), 0);
    });
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

  setAsActive(store: StoreLocationDto) {
    if (!store.id) return;
    this.storeService.setInUse(store.id).subscribe(() => {
      this.loadStores();
    });
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
    }).setView([19.7633, 96.0785], 6); // Centered on Myanmar

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

          // If modal is open, update modalMap and modalMarker
          if (this.showModal && this.modalMap && this.modalMarker) {
            this.modalMap.setView(latlng, 15);
            this.modalMarker.setLatLng(latlng);
          } else if (this.map && this.marker) {
            this.map.setView(latlng, 15);
            this.marker.setLatLng(latlng);
          }
          this.currentLatLng = latlng;
          this.storeForm.patchValue({ lat, lng });
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

  setActiveCard(store: StoreLocationDto) {
    if (store.id !== this.activeStoreId) {
      this.setAsActive(store);
    }
  }

  openAddStore() {
    this.selectedStore = null;
    this.storeForm.reset();
    this.currentLatLng = null;
    this.showModal = true;
    setTimeout(() => this.initModalMap(), 0);
  }

  editStore(store: StoreLocationDto) {
    this.selectStore(store);
    this.showModal = true;
    setTimeout(() => this.initModalMap(), 0);
  }

  closeModal() {
    this.showModal = false;
    this.selectedStore = null;
    this.storeForm.reset();
    this.currentLatLng = null;
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = null;
    }
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
    // Prevent delFg from being sent
    const { delFg, ...formValue } = this.storeForm.value;
    const store: StoreLocationDto = {
      ...formValue,
      lat: this.currentLatLng.lat,
      lng: this.currentLatLng.lng,
      id: this.selectedStore?.id
    };
    if (this.selectedStore && this.selectedStore.id) {
      this.storeService.update(this.selectedStore.id, store).subscribe(() => {
        this.loadStores();
        this.closeModal();
        if (this.marker) this.map.removeLayer(this.marker);
      });
    } else {
      this.storeService.create(store).subscribe(() => {
        this.loadStores();
        this.closeModal();
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

  initActiveStoreMap() {
    if (!this.activeStore || !this.isBrowser) return;
    if (this.activeMap) {
      this.activeMap.remove();
    }
    this.L = this.L || window['L'];
    this.activeMap = this.L.map('activeStoreMap').setView([this.activeStore.lat, this.activeStore.lng], 15);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.activeMap);
    this.L.marker([this.activeStore.lat, this.activeStore.lng]).addTo(this.activeMap);
  }

  initModalMap() {
    if (!this.isBrowser) return;
    if (this.modalMap) {
      this.modalMap.remove();
    }
    this.L = this.L || window['L'];
    const lat = this.storeForm.get('lat')?.value || 19.7633;
    const lng = this.storeForm.get('lng')?.value || 96.0785;
    this.modalMap = this.L.map('modalMap').setView([lat, lng], 15);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.modalMap);
    this.modalMarker = this.L.marker([lat, lng], { draggable: true }).addTo(this.modalMap);
    this.modalMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.currentLatLng = pos;
      this.storeForm.patchValue({ lat: pos.lat, lng: pos.lng });
    });
    this.modalMap.on('click', (e: any) => {
      this.modalMarker.setLatLng(e.latlng);
      this.currentLatLng = e.latlng;
      this.storeForm.patchValue({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }
}

// Custom Validator for Myanmar phone numbers
export function myanmarPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  // Myanmar mobile: +959..., 959..., 09... (7-9 digits after)
  const mmMobile = /^(\+?959|09)\d{7,9}$/;
  // Myanmar landline: 01..., 02..., ..., 09... (6-8 digits total)
  const mmLandline = /^0[1-9]\d{5,7}$/;
  return (mmMobile.test(value) || mmLandline.test(value)) ? null : { myanmarPhone: true };
}

// Custom Validator for Gmail addresses only
export function gmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  // Only allow emails ending with @gmail.com
  return /@gmail\.com$/i.test(value) ? null : { gmailOnly: true };
}
