import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StickyDiscountProgressComponent } from './sticky-discount-progress.component';

describe('StickyDiscountProgressComponent', () => {
  let component: StickyDiscountProgressComponent;
  let fixture: ComponentFixture<StickyDiscountProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StickyDiscountProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StickyDiscountProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
