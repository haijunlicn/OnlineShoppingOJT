import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscountGroupComponent } from './discount-group.component';



describe('DiscountGroupComponent', () => {
  let component: DiscountGroupComponent;
  let fixture: ComponentFixture<DiscountGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
