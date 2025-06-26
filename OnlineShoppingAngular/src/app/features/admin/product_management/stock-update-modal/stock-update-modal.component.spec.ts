import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockUpdateModalComponent } from './stock-update-modal.component';

describe('StockUpdateModalComponent', () => {
  let component: StockUpdateModalComponent;
  let fixture: ComponentFixture<StockUpdateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockUpdateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockUpdateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
