import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotiSettingComponent } from './noti-setting.component';

describe('NotiSettingComponent', () => {
  let component: NotiSettingComponent;
  let fixture: ComponentFixture<NotiSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotiSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotiSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
