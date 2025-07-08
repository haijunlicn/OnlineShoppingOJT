import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectionReasonListComponent } from './rejection-reason-list.component';

describe('RejectionReasonListComponent', () => {
  let component: RejectionReasonListComponent;
  let fixture: ComponentFixture<RejectionReasonListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RejectionReasonListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectionReasonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
