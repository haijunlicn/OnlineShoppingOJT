import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewListPerUserComponent } from './review-list-per-user.component';

describe('ReviewListPerUserComponent', () => {
  let component: ReviewListPerUserComponent;
  let fixture: ComponentFixture<ReviewListPerUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReviewListPerUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewListPerUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
