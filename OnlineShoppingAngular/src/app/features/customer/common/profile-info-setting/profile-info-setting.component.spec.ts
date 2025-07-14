import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileInfoSettingComponent } from './profile-info-setting.component';

describe('ProfileInfoSettingComponent', () => {
  let component: ProfileInfoSettingComponent;
  let fixture: ComponentFixture<ProfileInfoSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileInfoSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileInfoSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
