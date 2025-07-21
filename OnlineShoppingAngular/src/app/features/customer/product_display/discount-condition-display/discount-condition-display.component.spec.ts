import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountConditionDisplayComponent } from './discount-condition-display.component';

describe('DiscountConditionDisplayComponent', () => {
  let component: DiscountConditionDisplayComponent;
  let fixture: ComponentFixture<DiscountConditionDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountConditionDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountConditionDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
