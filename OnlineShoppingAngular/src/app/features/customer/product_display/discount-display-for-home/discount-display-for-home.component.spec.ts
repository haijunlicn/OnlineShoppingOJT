import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountDisplayForHomeComponent } from './discount-display-for-home.component';

describe('DiscountDisplayForHomeComponent', () => {
  let component: DiscountDisplayForHomeComponent;
  let fixture: ComponentFixture<DiscountDisplayForHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountDisplayForHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountDisplayForHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
