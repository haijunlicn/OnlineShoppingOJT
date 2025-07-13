import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreAddressComponent } from './store-address.component';

describe('StoreAddressComponent', () => {
  let component: StoreAddressComponent;
  let fixture: ComponentFixture<StoreAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoreAddressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
