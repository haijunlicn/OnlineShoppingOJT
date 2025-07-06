import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundRequestDetailComponent } from './refund-request-detail.component';

describe('RefundRequestDetailComponent', () => {
  let component: RefundRequestDetailComponent;
  let fixture: ComponentFixture<RefundRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefundRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
