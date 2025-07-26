import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAccountListComponent } from './admin-account-list.component';

describe('AdminAccountListComponent', () => {
  let component: AdminAccountListComponent;
  let fixture: ComponentFixture<AdminAccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminAccountListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
