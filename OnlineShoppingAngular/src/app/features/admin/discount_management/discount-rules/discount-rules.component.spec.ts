import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountRulesComponent } from './discount-rules.component';

describe('DiscountRulesComponent', () => {
  let component: DiscountRulesComponent;
  let fixture: ComponentFixture<DiscountRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
