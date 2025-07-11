import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartTestingComponent } from './chart-testing.component';

describe('ChartTestingComponent', () => {
  let component: ChartTestingComponent;
  let fixture: ComponentFixture<ChartTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartTestingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
