import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogListComponent } from './vlog-list.component';

describe('VlogListComponent', () => {
  let component: VlogListComponent;
  let fixture: ComponentFixture<VlogListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
