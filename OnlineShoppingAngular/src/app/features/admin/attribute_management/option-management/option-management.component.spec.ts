import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionManagementComponent } from './option-management.component';

describe('OptionManagementComponent', () => {
  let component: OptionManagementComponent;
  let fixture: ComponentFixture<OptionManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OptionManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
