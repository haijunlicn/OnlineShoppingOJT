import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDeliveryMethodComponent } from './edit-delivery-method.component';

describe('EditDeliveryMethodComponent', () => {
  let component: EditDeliveryMethodComponent;
  let fixture: ComponentFixture<EditDeliveryMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditDeliveryMethodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDeliveryMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
