import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSentNotisComponent } from './admin-sent-notis.component';

describe('AdminSentNotisComponent', () => {
  let component: AdminSentNotisComponent;
  let fixture: ComponentFixture<AdminSentNotisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminSentNotisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSentNotisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
