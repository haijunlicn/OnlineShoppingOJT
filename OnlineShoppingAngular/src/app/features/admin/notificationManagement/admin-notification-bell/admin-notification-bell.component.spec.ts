import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotificationBellComponent } from './admin-notification-bell.component';

describe('AdminNotificationBellComponent', () => {
  let component: AdminNotificationBellComponent;
  let fixture: ComponentFixture<AdminNotificationBellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminNotificationBellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
