import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserViewDetailComponent } from './user-view-detail.component';

describe('UserViewDetailComponent', () => {
  let component: UserViewDetailComponent;
  let fixture: ComponentFixture<UserViewDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserViewDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserViewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
