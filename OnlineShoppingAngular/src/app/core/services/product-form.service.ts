import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  constructor(private fb: FormBuilder) { }

  // Create the full product form
  createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      basePrice: [0, [Validators.required, Validators.min(0)]], // ✅ change here
      stock: [0, [Validators.required, Validators.min(0)]],
      brandId: ['', Validators.required],
      categoryId: [null, Validators.required],
      options: this.fb.array([]),
      variants: this.fb.array([]),
    });
  }


  // Getters for FormArrays
  getOptionsArray(form: FormGroup): FormArray {
    return form.get('options') as FormArray;
  }

  getVariantsArray(form: FormGroup): FormArray {
    return form.get('variants') as FormArray;
  }

  // Create a single option group
  createOptionGroup(): FormGroup {
    return this.fb.group({
      id: ['', Validators.required],
      name: [''], // will be set based on selected ID
      values: [[], Validators.required] // selected option values
    });
  }

  // Add a new option group to the form
  addOption(form: FormGroup): void {
    const optionsArray = this.getOptionsArray(form);
    const optionGroup = this.createOptionGroup();
    optionsArray.push(optionGroup);
    console.log("Added new option group:", optionGroup.value);
  }

  // Remove option by index
  removeOption(form: FormGroup, index: number): void {
    const optionsArray = this.getOptionsArray(form);
    if (optionsArray.length > index) {
      optionsArray.removeAt(index);
    }
  }

  // Create a single variant group
  createVariantGroup(): FormGroup {
    return this.fb.group({
      options: [[]], // array of { name: string, value: string }
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: ['']
    });
  }

  // Add multiple variants at once
  setVariants(form: FormGroup, variants: any[]): void {
    const variantsArray = this.getVariantsArray(form);
    variantsArray.clear();

    for (const variant of variants) {
      const group = this.createVariantGroup();
      group.patchValue(variant); // assumes each variant matches structure
      variantsArray.push(group);
    }
  }

  resetForm(productForm: FormGroup, options: FormArray, variants: FormArray): void {
    productForm.reset();
    options.clear();
    variants.clear();
  }

  // move SKU logic here if needed
  getSkuForVariant(index: number, productName: string, variantOptions: string[]): string {
    return `SKU-${productName.substring(0, 3).toUpperCase()}-${variantOptions.join('-')}`;
  }

  applyBulkPrice(form: FormGroup): void {
    const basePrice = form.get('basePrice')?.value || 0;
    const variantsArray = this.getVariantsArray(form);

    for (let i = 0; i < variantsArray.length; i++) {
      variantsArray.at(i).get('price')?.setValue(basePrice);
    }
  }


}
