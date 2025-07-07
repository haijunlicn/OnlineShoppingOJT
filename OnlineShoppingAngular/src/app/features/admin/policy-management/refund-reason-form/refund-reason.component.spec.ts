import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefundReasonFormComponent } from './refund-reason.component';


describe('RefundReasonComponent', () => {
  let component: RefundReasonFormComponent;
  let fixture: ComponentFixture<RefundReasonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefundReasonFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundReasonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
