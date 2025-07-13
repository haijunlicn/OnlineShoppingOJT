import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundRequestListComponent } from './refund-request-list.component';

describe('RefundRequestListComponent', () => {
  let component: RefundRequestListComponent;
  let fixture: ComponentFixture<RefundRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefundRequestListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundRequestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
