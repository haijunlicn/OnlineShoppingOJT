import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogfilescreateComponent } from './vlogfilescreate.component';

describe('VlogfilescreateComponent', () => {
  let component: VlogfilescreateComponent;
  let fixture: ComponentFixture<VlogfilescreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogfilescreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogfilescreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
