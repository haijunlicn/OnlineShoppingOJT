import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpVeficationComponent } from './otp-vefication.component';

describe('OtpVeficationComponent', () => {
  let component: OtpVeficationComponent;
  let fixture: ComponentFixture<OtpVeficationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OtpVeficationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpVeficationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
