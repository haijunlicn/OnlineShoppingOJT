import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEditDiscountComponent } from './new-edit-discount.component';

describe('NewEditDiscountComponent', () => {
  let component: NewEditDiscountComponent;
  let fixture: ComponentFixture<NewEditDiscountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewEditDiscountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEditDiscountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
