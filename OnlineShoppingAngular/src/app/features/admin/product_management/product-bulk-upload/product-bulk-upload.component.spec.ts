import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductBulkUploadComponent } from './product-bulk-upload.component';

describe('ProductBulkUploadComponent', () => {
  let component: ProductBulkUploadComponent;
  let fixture: ComponentFixture<ProductBulkUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductBulkUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductBulkUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
