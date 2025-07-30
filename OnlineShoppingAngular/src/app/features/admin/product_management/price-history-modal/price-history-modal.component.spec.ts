import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceHistoryModalComponent } from './price-history-modal.component';

describe('PriceHistoryModalComponent', () => {
  let component: PriceHistoryModalComponent;
  let fixture: ComponentFixture<PriceHistoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PriceHistoryModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
