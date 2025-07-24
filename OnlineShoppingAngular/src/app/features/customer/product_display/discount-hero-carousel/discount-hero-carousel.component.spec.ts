import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountHeroCarouselComponent } from './discount-hero-carousel.component';

describe('DiscountHeroCarouselComponent', () => {
  let component: DiscountHeroCarouselComponent;
  let fixture: ComponentFixture<DiscountHeroCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountHeroCarouselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountHeroCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
