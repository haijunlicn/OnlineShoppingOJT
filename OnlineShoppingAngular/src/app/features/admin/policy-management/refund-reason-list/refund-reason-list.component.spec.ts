import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundReasonListComponent } from './refund-reason-list.component';

describe('RefundReasonListComponent', () => {
  let component: RefundReasonListComponent;
  let fixture: ComponentFixture<RefundReasonListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefundReasonListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundReasonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
