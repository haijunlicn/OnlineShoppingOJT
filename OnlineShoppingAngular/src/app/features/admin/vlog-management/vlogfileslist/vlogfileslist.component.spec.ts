import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogfileslistComponent } from './vlogfileslist.component';

describe('VlogfileslistComponent', () => {
  let component: VlogfileslistComponent;
  let fixture: ComponentFixture<VlogfileslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogfileslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogfileslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
