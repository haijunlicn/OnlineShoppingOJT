import { Injectable } from "@angular/core"
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms"
import type { ProductImageDTO } from "../models/product.model"

@Injectable({
  providedIn: "root",
})
export class ProductFormService {
  constructor(private fb: FormBuilder) { }

  // Create the full product form with image support
  createProductForm(): FormGroup {
    return this.fb.group({
      name: ["", Validators.required],
      description: [""],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      brandId: [""],
      categoryId: [null, Validators.required],
      options: this.fb.array([]),
      variants: this.fb.array([]),
      productImages: this.fb.array([]),
    })
  }

  // Getters for FormArrays
  getOptionsArray(form: FormGroup): FormArray {
    return form.get("options") as FormArray
  }

  getVariantsArray(form: FormGroup): FormArray {
    return form.get("variants") as FormArray
  }

  getProductImagesArray(form: FormGroup): FormArray {
    return form.get("productImages") as FormArray
  }

  // Create product image form group
  createProductImageGroup(image?: ProductImageDTO): FormGroup {
    return this.fb.group({
      id: [image?.id || null],
      imagePath: [image?.imgPath || "", Validators.required],
      displayOrder: [image?.displayOrder || 0],
      isMain: [image?.mainImageStatus || false],
      altText: [image?.altText || ""],
    })
  }

  // Add product image
  addProductImage(form: FormGroup, image: ProductImageDTO): void {
    const imagesArray = this.getProductImagesArray(form)
    const imageGroup = this.createProductImageGroup(image)
    imagesArray.push(imageGroup)
  }

  // Remove product image
  removeProductImage(form: FormGroup, index: number): void {
    const imagesArray = this.getProductImagesArray(form)
    if (imagesArray.length > index) {
      imagesArray.removeAt(index)
    }
  }

  // Set main image
  setMainImage(form: FormGroup, index: number): void {
    const imagesArray = this.getProductImagesArray(form)

    // Reset all isMain flags
    for (let i = 0; i < imagesArray.length; i++) {
      imagesArray.at(i).get("isMain")?.setValue(false)
    }

    // Set the selected image as main
    if (imagesArray.at(index)) {
      imagesArray.at(index).get("isMain")?.setValue(true)
    }
  }

  // Create a variant group with image assignment support
  createVariantGroupWithImageAssignment(): FormGroup {
    return this.fb.group({
      options: [[]],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [""],
      assignedImageId: [""], // New field for image assignment
    })
  }

  // Legacy method for backward compatibility
  createVariantGroup(): FormGroup {
    return this.fb.group({
      options: [[]],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [""],
      imagePath: [""],
      imageUrl: [""],
    })
  }

  // Update variant image assignment
  updateVariantImageAssignment(form: FormGroup, variantIndex: number, imageId: string): void {
    const variantsArray = this.getVariantsArray(form)
    const variant = variantsArray.at(variantIndex)
    if (variant) {
      variant.get("assignedImageId")?.setValue(imageId)
    }
  }

  // Remove variant image assignment
  removeVariantImageAssignment(form: FormGroup, variantIndex: number): void {
    const variantsArray = this.getVariantsArray(form)
    const variant = variantsArray.at(variantIndex)
    if (variant) {
      variant.get("assignedImageId")?.setValue("")
    }
  }

  // Existing methods remain the same...
  createOptionGroup(): FormGroup {
    return this.fb.group({
      id: ["", Validators.required],
      name: [""],
      values: [[], Validators.required],
    })
  }

  addOption(form: FormGroup): void {
    const optionsArray = this.getOptionsArray(form)
    const optionGroup = this.createOptionGroup()
    optionsArray.push(optionGroup)
  }

  removeOption(form: FormGroup, index: number): void {
    const optionsArray = this.getOptionsArray(form)
    if (optionsArray.length > index) {
      optionsArray.removeAt(index)
    }
  }

  setVariants(form: FormGroup, variants: any[]): void {
    const variantsArray = this.getVariantsArray(form)
    variantsArray.clear()

    for (const variant of variants) {
      const group = this.createVariantGroupWithImageAssignment()
      group.patchValue(variant)
      variantsArray.push(group)
    }
  }

  resetForm(productForm: FormGroup, options: FormArray, variants: FormArray): void {
    productForm.reset()
    options.clear()
    variants.clear()
    this.getProductImagesArray(productForm).clear()
  }

  applyBulkPrice(form: FormGroup): void {
    const basePrice = Number(form.get("basePrice")?.value) || 0;
    const variantsArray = this.getVariantsArray(form);

    for (let i = 0; i < variantsArray.length; i++) {
      const control = variantsArray.at(i).get('price');

      if (control) {
        // First reset to 0 (to force value change even if basePrice is 0)
        control.setValue(0, { emitEvent: true });

        // Then apply the base price (ensure this triggers valueChanges even if same)
        setTimeout(() => {
          control.setValue(basePrice, { emitEvent: true });
        }, 10);
      }
    }
  }



}
