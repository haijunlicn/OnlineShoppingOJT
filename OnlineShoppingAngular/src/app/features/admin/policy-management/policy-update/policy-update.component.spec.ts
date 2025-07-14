import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyUpdateComponent } from './policy-update.component';

describe('PolicyUpdateComponent', () => {
  let component: PolicyUpdateComponent;
  let fixture: ComponentFixture<PolicyUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PolicyUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicyUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
