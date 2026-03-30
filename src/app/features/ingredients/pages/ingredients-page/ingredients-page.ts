import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

import {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
} from '../../../../core/models/ingredient.model';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { AlertComponent, AlertVariant } from '../../../../shared/ui/alert/alert';
import { AutoFocusDirective } from '../../../../shared/ui/directives/auto-focus.directive';
import { ModalComponent } from '../../../../shared/ui/modal/modal';
import { QuantityDisplayPipe } from '../../../../shared/ui/pipes/quantity-display.pipe';
import { getDisplayErrorMessage } from '../../../../shared/utils/error-message';
import {
  nonWhitespaceValidator,
  uniqueNameValidator,
} from '../../../../shared/utils/form-validators';

interface PageAlert {
  variant: AlertVariant;
  title: string;
  message: string;
}

@Component({
  selector: 'app-ingredients-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    AlertComponent,
    AutoFocusDirective,
    QuantityDisplayPipe,
  ],
  templateUrl: './ingredients-page.html',
  styleUrl: './ingredients-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsPageComponent {
  private readonly ingredientStore = inject(IngredientStore);
  private readonly fb = inject(FormBuilder);

  protected readonly ingredients = this.ingredientStore.ingredients;
  protected readonly loading = this.ingredientStore.loading;
  protected readonly saving = signal(false);
  protected readonly formModalOpen = signal(false);
  protected readonly pendingDelete = signal<Ingredient | null>(null);
  protected readonly alert = signal<PageAlert | null>(null);
  protected readonly editingId = signal<string | null>(null);
  private readonly _initialLoad = toSignal(
    this.ingredientStore.load().pipe(
      catchError((error: unknown) => {
        this.showError('Unable to load ingredients', error);
        return of<Ingredient[]>([]);
      }),
    ),
    { initialValue: [] },
  );

  protected readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        nonWhitespaceValidator(),
        uniqueNameValidator(
          () => this.ingredients(),
          () => this.editingId(),
        ),
      ],
    ],
    availableQuantity: [0, [Validators.required, Validators.min(0)]],
  });

  protected openCreateModal(): void {
    this.formModalOpen.set(true);
    this.alert.set(null);
    this.startCreate();
  }

  protected openEditModal(ingredient: Ingredient): void {
    this.formModalOpen.set(true);
    this.alert.set(null);
    this.startEdit(ingredient);
  }

  protected closeFormModal(): void {
    this.formModalOpen.set(false);
    this.startCreate();
  }

  protected requestDelete(ingredient: Ingredient): void {
    this.pendingDelete.set(ingredient);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const ingredient = this.pendingDelete();
    if (!ingredient) {
      return;
    }

    this.pendingDelete.set(null);
    this.ingredientStore.delete(ingredient.id).subscribe({
      next: () => {
        this.startCreate();
        this.alert.set({
          variant: 'success',
          title: 'Ingredient deleted',
          message: `${ingredient.name} has been removed.`,
        });
      },
      error: (error: unknown) => this.showError('Unable to delete ingredient', error),
    });
  }

  protected dismissAlert(): void {
    this.alert.set(null);
  }

  protected showControlError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected nameErrorMessage(): string | null {
    const control = this.form.controls.name;
    if (!this.showControlError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Name is required.';
    }

    if (control.hasError('whitespace')) {
      return 'Name must contain at least one non-whitespace character.';
    }

    if (control.hasError('duplicateName')) {
      return 'Ingredient name must be unique.';
    }

    return null;
  }

  protected availableQuantityErrorMessage(): string | null {
    const control = this.form.controls.availableQuantity;
    if (!this.showControlError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Available quantity is required.';
    }

    if (control.hasError('min')) {
      return 'AvailableQuantity must be >= 0.';
    }

    return null;
  }

  private startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      availableQuantity: 0,
    });
    this.form.controls.name.updateValueAndValidity();
  }

  private startEdit(ingredient: Ingredient): void {
    this.editingId.set(ingredient.id);
    this.form.reset({
      name: ingredient.name,
      availableQuantity: ingredient.availableQuantity,
    });
    this.form.controls.name.updateValueAndValidity();
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.alert.set(null);

    const payload: CreateIngredientRequest | UpdateIngredientRequest = {
      name: this.form.controls.name.value.trim(),
      availableQuantity: this.form.controls.availableQuantity.value,
    };

    const editingId = this.editingId();
    const request$ = editingId
      ? this.ingredientStore.update(editingId, payload)
      : this.ingredientStore.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formModalOpen.set(false);
        this.startCreate();
        this.alert.set({
          variant: 'success',
          title: editingId ? 'Ingredient updated' : 'Ingredient created',
          message: editingId
            ? 'Ingredient details have been updated.'
            : 'New ingredient has been added.',
        });
      },
      error: (error: unknown) => {
        this.formModalOpen.set(false);
        this.showError('Unable to save ingredient', error);
      },
    });
  }

  protected cancelEdit(): void {
    this.closeFormModal();
  }

  protected trackIngredient(_: number, ingredient: Ingredient): string {
    return ingredient.id;
  }

  protected deleteMessage(): string {
    const ingredient = this.pendingDelete();
    if (!ingredient) {
      return '';
    }

    return `Delete ingredient "${ingredient.name}"? This cannot be undone.`;
  }

  private showError(title: string, error: unknown): void {
    this.alert.set({
      variant: 'error',
      title,
      message: getDisplayErrorMessage(error),
    });
  }
}
