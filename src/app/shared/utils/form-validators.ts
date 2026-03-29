import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

const normalizeName = (value: string): string => value.trim().toLocaleLowerCase();

export function nonWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    return value.trim().length > 0 ? null : { whitespace: true };
  };
}

export function uniqueNameValidator<T extends { id: string; name: string }>(
  getItems: () => T[],
  getCurrentId: () => string | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    const normalizedValue = normalizeName(value);
    const currentId = getCurrentId();
    const hasDuplicate = getItems().some(
      (item) => item.id !== currentId && normalizeName(item.name) === normalizedValue,
    );

    return hasDuplicate ? { duplicateName: true } : null;
  };
}

export function minFormArrayItems(minItems: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }

    return control.length >= minItems
      ? null
      : { minFormArrayItems: { required: minItems, actual: control.length } };
  };
}
