import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCreateDiscountComponent } from './new-create-discount.component';

describe('NewCreateDiscountComponent', () => {
  let component: NewCreateDiscountComponent;
  let fixture: ComponentFixture<NewCreateDiscountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewCreateDiscountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCreateDiscountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
