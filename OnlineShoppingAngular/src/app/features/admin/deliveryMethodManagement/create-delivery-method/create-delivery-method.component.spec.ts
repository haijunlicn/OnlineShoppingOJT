import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDeliveryMethodComponent } from './create-delivery-method.component';

describe('CreateDeliveryMethodComponent', () => {
  let component: CreateDeliveryMethodComponent;
  let fixture: ComponentFixture<CreateDeliveryMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateDeliveryMethodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDeliveryMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
