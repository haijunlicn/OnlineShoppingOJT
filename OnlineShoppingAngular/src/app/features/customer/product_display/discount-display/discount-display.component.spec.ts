import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountDisplayComponent } from './discount-display.component';

describe('DiscountDisplayComponent', () => {
  let component: DiscountDisplayComponent;
  let fixture: ComponentFixture<DiscountDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
