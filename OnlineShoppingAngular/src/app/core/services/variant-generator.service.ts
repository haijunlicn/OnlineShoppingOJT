import { Injectable } from '@angular/core';
import { ProductVariantDTO } from '../models/variant.model';

@Injectable({
  providedIn: 'root'
})
@Injectable({ providedIn: 'root' })
export class VariantGeneratorService {
  // generateCombinations(options: { type: string, typeName: string, values: string[] }[]): ProductVariantDTO[] {
  //   let combinations: ProductVariantDTO[] = [{ options: [], price: 0, stock: 0, sku: '' }];
  //   options.forEach(option => {
  //     const newCombinations: ProductVariantDTO[] = [];
  //     combinations.forEach(combination => {
  //       option.values.forEach(value => {
  //         newCombinations.push({
  //           options: [...combination.options, { type: option.type, typeName: option.typeName, value }],
  //           price: combination.price,
  //           stock: combination.stock,
  //           sku: combination.sku
  //         });
  //       });
  //     });
  //     combinations = newCombinations;
  //   });
  //   return combinations;
  // }

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
            sku: combination.sku
          });
        });
      });
      combinations = newCombinations;
    });

    return combinations;
  }

}
