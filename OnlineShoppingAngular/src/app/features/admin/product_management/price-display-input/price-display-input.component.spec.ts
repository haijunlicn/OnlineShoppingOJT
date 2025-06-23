import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDisplayInputComponent } from './price-display-input.component';

describe('PriceDisplayInputComponent', () => {
  let component: PriceDisplayInputComponent;
  let fixture: ComponentFixture<PriceDisplayInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PriceDisplayInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceDisplayInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
