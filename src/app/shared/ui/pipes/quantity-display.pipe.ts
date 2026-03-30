import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'quantityDisplay',
})
export class QuantityDisplayPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '0';
    }

    if (Number.isInteger(value)) {
      return String(value);
    }

    return value
      .toFixed(2)
      .replace(/\.0+$/, '')
      .replace(/(\.\d*?)0+$/, '$1');
  }
}
