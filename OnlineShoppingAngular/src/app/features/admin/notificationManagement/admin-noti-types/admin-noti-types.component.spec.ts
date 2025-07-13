import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotiTypesComponent } from './admin-noti-types.component';

describe('AdminNotiTypesComponent', () => {
  let component: AdminNotiTypesComponent;
  let fixture: ComponentFixture<AdminNotiTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminNotiTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotiTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
