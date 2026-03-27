import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
} from '../../../../core/models/ingredient.model';
import { IngredientService } from '../../../../core/services/ingredient.service';
import { AlertComponent, AlertVariant } from '../../../../shared/ui/alert/alert';
import { ModalComponent } from '../../../../shared/ui/modal/modal';

interface PageAlert {
  variant: AlertVariant;
  title: string;
  message: string;
}

@Component({
  selector: 'app-ingredients-page',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, AlertComponent],
  templateUrl: './ingredients-page.html',
  styleUrl: './ingredients-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsPageComponent {
  private readonly ingredientService = inject(IngredientService);
  private readonly fb = inject(FormBuilder);

  protected readonly ingredients = signal<Ingredient[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formModalOpen = signal(false);
  protected readonly pendingDelete = signal<Ingredient | null>(null);
  protected readonly alert = signal<PageAlert | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    availableQuantity: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.loadIngredients();
  }

  protected loadIngredients(): void {
    this.loading.set(true);

    this.ingredientService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (ingredients) => this.ingredients.set(ingredients),
        error: (error: unknown) => this.showError('Unable to load ingredients', error),
      });
  }

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
    this.ingredientService.delete(ingredient.id).subscribe({
      next: () => {
        this.startCreate();
        this.loadIngredients();
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

  private startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      availableQuantity: 0,
    });
  }

  private startEdit(ingredient: Ingredient): void {
    this.editingId.set(ingredient.id);
    this.form.reset({
      name: ingredient.name,
      availableQuantity: ingredient.availableQuantity,
    });
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
      ? this.ingredientService.update(editingId, payload)
      : this.ingredientService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formModalOpen.set(false);
        this.startCreate();
        this.loadIngredients();
        this.alert.set({
          variant: 'success',
          title: editingId ? 'Ingredient updated' : 'Ingredient created',
          message: editingId
            ? 'Ingredient details have been updated.'
            : 'New ingredient has been added.',
        });
      },
      error: (error: unknown) => this.showError('Unable to save ingredient', error),
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
      message: this.getErrorMessage(error),
    });
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const maybeMessage = (error as { error?: { message?: string }; message?: string }).error
        ?.message;
      if (maybeMessage) {
        return maybeMessage;
      }

      if ('message' in error && typeof (error as { message?: string }).message === 'string') {
        return (error as { message: string }).message;
      }
    }

    return 'Something went wrong. Please try again.';
  }
}
