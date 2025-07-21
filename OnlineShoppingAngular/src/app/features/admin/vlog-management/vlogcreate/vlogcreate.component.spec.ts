import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogcreateComponent } from './vlogcreate.component';

describe('VlogcreateComponent', () => {
  let component: VlogcreateComponent;
  let fixture: ComponentFixture<VlogcreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogcreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogcreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
