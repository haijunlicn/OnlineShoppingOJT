import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProductSelectionComponent } from './new-product-selection.component';

describe('NewProductSelectionComponent', () => {
  let component: NewProductSelectionComponent;
  let fixture: ComponentFixture<NewProductSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewProductSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewProductSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
