import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDiscountRulesComponent } from './new-discount-rules.component';

describe('NewDiscountRulesComponent', () => {
  let component: NewDiscountRulesComponent;
  let fixture: ComponentFixture<NewDiscountRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewDiscountRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDiscountRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
