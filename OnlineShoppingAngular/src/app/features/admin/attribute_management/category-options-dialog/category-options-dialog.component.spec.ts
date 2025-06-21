import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryOptionsDialogComponent } from './category-options-dialog.component';

describe('CategoryOptionsDialogComponent', () => {
  let component: CategoryOptionsDialogComponent;
  let fixture: ComponentFixture<CategoryOptionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryOptionsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryOptionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
