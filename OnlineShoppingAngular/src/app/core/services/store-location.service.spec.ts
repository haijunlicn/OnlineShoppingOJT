import { TestBed } from '@angular/core/testing';

import { StoreLocationService } from './store-location.service';

describe('StoreLocationService', () => {
  let service: StoreLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
