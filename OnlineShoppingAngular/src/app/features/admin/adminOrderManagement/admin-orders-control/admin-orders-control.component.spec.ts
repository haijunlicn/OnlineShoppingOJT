import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrdersControlComponent } from './admin-orders-control.component';

describe('AdminOrdersControlComponent', () => {
  let component: AdminOrdersControlComponent;
  let fixture: ComponentFixture<AdminOrdersControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminOrdersControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminOrdersControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
