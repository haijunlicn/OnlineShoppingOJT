import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogDetailComponent } from './vlog-detail.component';

describe('VlogDetailComponent', () => {
  let component: VlogDetailComponent;
  let fixture: ComponentFixture<VlogDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
