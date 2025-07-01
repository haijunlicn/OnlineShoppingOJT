import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentAcceptComponent } from './payment-accept.component';

describe('PaymentAcceptComponent', () => {
  let component: PaymentAcceptComponent;
  let fixture: ComponentFixture<PaymentAcceptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentAcceptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentAcceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
