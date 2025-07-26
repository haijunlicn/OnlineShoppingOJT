import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VlogCommentComponent } from './vlog-comment.component';

describe('VlogCommentComponent', () => {
  let component: VlogCommentComponent;
  let fixture: ComponentFixture<VlogCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VlogCommentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VlogCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
