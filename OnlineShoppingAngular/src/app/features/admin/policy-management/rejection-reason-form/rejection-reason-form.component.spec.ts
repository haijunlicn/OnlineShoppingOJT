import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectionReasonFormComponent } from './rejection-reason-form.component';

describe('RejectionReasonFormComponent', () => {
  let component: RejectionReasonFormComponent;
  let fixture: ComponentFixture<RejectionReasonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RejectionReasonFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectionReasonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
