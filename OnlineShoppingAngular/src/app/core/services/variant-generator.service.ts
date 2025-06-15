import { Injectable } from '@angular/core';
import { ProductVariantDTO } from '../models/product.model';


@Injectable({
  providedIn: 'root'
})
@Injectable({ providedIn: 'root' })
export class VariantGeneratorService {

  /**
 * Generate default variant for products with no options
 */
  generateDefaultVariant(): ProductVariantDTO {
    return {
      options: [],
      price: 0,
      stock: 0,
      sku: "DEFAULT",
      displayLabel: "Default Variant",
      isDefault: true,
      isRemovable: false,
    }
  }

  generateCombinations(options: { optionId: number, optionName: string, values: { optionValueId: number, valueName: string }[] }[]): ProductVariantDTO[] {
    let combinations: ProductVariantDTO[] = [{ options: [], price: 0, stock: 0, sku: '' }];

    options.forEach(option => {
      const newCombinations: ProductVariantDTO[] = [];
      combinations.forEach(combination => {
        option.values.forEach(value => {
          newCombinations.push({
            options: [
              ...combination.options,
              {
                optionId: option.optionId,
                optionValueId: value.optionValueId,
                optionName: option.optionName,
                valueName: value.valueName
              }
            ],
            price: combination.price,
            stock: combination.stock,
            sku: combination.sku,
            // displayLabel: this.generateDisplayLabel(combination),
            isDefault: false,
            isRemovable: true,
          });
        });
      });
      combinations = newCombinations;
    });

    return combinations;
  }

  // private cartesianProduct(optionsWithValues: any[]): any[] {
  //   return optionsWithValues.reduce(
  //     (acc, option) => {
  //       const newAcc: any[] = []
  //       acc.forEach((existingCombination) => {
  //         option.values.forEach((value: any) => {
  //           newAcc.push([
  //             ...existingCombination,
  //             {
  //               optionId: option.optionId,
  //               optionName: option.optionName,
  //               optionValueId: value.optionValueId,
  //               valueName: value.valueName,
  //             },
  //           ])
  //         })
  //       })
  //       return newAcc
  //     },
  //     [[]],
  //   )
  // }

  private generateDisplayLabel(combination: any[]): string {
    return combination.map((item) => `${item.optionName}: ${item.valueName}`).join(", ")
  }

}
