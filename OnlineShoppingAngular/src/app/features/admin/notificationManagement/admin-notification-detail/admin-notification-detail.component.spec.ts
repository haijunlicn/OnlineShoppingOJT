import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotificationDetailComponent } from './admin-notification-detail.component';

describe('AdminNotificationDetailComponent', () => {
  let component: AdminNotificationDetailComponent;
  let fixture: ComponentFixture<AdminNotificationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminNotificationDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotificationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
