import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotificationListComponent } from './admin-notification-list.component';

describe('AdminNotificationListComponent', () => {
  let component: AdminNotificationListComponent;
  let fixture: ComponentFixture<AdminNotificationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminNotificationListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
