import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogModalComponent } from './audit-log-modal.component';

describe('AuditLogModalComponent', () => {
  let component: AuditLogModalComponent;
  let fixture: ComponentFixture<AuditLogModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuditLogModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditLogModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
