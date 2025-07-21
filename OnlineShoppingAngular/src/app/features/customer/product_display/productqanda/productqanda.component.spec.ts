import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductqandaComponent } from './productqanda.component';

describe('ProductqandaComponent', () => {
  let component: ProductqandaComponent;
  let fixture: ComponentFixture<ProductqandaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductqandaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductqandaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
