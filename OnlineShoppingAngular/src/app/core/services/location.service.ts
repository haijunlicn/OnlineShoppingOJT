import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationDto } from '../models/location-dto';
import { isPlatformBrowser } from '@angular/common';



@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://localhost:8080/locations';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  saveLocation(location: LocationDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, location, { responseType: 'text' });
  }

  getAllLocations(): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${this.apiUrl}/all`);
  }
  getUserLocations(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/user-locations`, {
    params: { userId: userId.toString() }
  });
}




  getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (isPlatformBrowser(this.platformId) && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            observer.next(position);
            observer.complete();
          },
          (error) => {
            observer.error(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        observer.error('Geolocation is not available in this environment.');
      }
    });
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    return this.http.get(url);
  }

  geocode(query: string): Observable<any[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`;
    return this.http.get<any[]>(url);
  }
getLocationById(id: number): Observable<LocationDto> {
  return this.http.get<LocationDto>(`${this.apiUrl}/${id}`);
}

updateLocation(location: LocationDto): Observable<any> {
  return this.http.put(`${this.apiUrl}/update/${location.id}`, location, { responseType: 'text' });
}

reverseGeocodes(lat: number, lng: number): Observable<any> {
  return this.http.get(`https://nominatim.openstreetmap.org/reverse`, {
    params: {
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1'
    }
  });
}
searchLocation(query: string): Observable<any> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  return this.http.get<any[]>(url);
}
  deleteLocation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
  
}
