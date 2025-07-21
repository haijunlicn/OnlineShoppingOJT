import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VloglistComponent } from './vloglist.component';

describe('VloglistComponent', () => {
  let component: VloglistComponent;
  let fixture: ComponentFixture<VloglistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VloglistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VloglistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
