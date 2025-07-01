import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundRequestFormComponent } from './refund-request-form.component';

describe('RefundRequestFormComponent', () => {
  let component: RefundRequestFormComponent;
  let fixture: ComponentFixture<RefundRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefundRequestFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
