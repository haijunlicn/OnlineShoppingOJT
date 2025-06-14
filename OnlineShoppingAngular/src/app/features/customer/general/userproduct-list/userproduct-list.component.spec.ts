import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserproductListComponent } from './userproduct-list.component';

describe('UserproductListComponent', () => {
  let component: UserproductListComponent;
  let fixture: ComponentFixture<UserproductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserproductListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserproductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
