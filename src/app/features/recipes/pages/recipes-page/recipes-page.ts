import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { Ingredient } from '../../../../core/models/ingredient.model';
import {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
} from '../../../../core/models/recipe.model';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { AlertComponent, AlertVariant } from '../../../../shared/ui/alert/alert';
import { ModalComponent } from '../../../../shared/ui/modal/modal';

interface PageAlert {
  variant: AlertVariant;
  title: string;
  message: string;
}

type RequirementFormGroup = FormGroup<{
  clientKey: FormControl<number>;
  ingredientId: FormControl<string>;
  requiredQuantity: FormControl<number>;
}>;

@Component({
  selector: 'app-recipes-page',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, AlertComponent],
  templateUrl: './recipes-page.html',
  styleUrl: './recipes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesPageComponent {
  private readonly recipeStore = inject(RecipeStore);
  private readonly ingredientStore = inject(IngredientStore);
  private readonly fb = inject(FormBuilder);
  private requirementKeyCounter = 0;

  protected readonly recipes = this.recipeStore.recipes;
  protected readonly ingredients = this.ingredientStore.ingredients;
  protected readonly loading = this.recipeStore.loading;
  protected readonly saving = signal(false);
  protected readonly formModalOpen = signal(false);
  protected readonly pendingDelete = signal<Recipe | null>(null);
  protected readonly alert = signal<PageAlert | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    servings: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    requirements: this.fb.array<RequirementFormGroup>([this.createRequirementGroup()]),
  });

  constructor() {
    this.recipeStore.load().subscribe({
      error: (error: unknown) => this.showError('Unable to load recipes', error),
    });
    this.ingredientStore.load().subscribe({
      error: (error: unknown) => this.showError('Unable to load ingredients', error),
    });
  }

  protected get requirements(): FormArray<RequirementFormGroup> {
    return this.form.controls.requirements;
  }

  protected openCreateModal(): void {
    this.formModalOpen.set(true);
    this.alert.set(null);
    this.startCreate();
  }

  protected openEditModal(recipe: Recipe): void {
    this.formModalOpen.set(true);
    this.alert.set(null);
    this.startEdit(recipe);
  }

  protected closeFormModal(): void {
    this.formModalOpen.set(false);
    this.startCreate();
  }

  protected requestDelete(recipe: Recipe): void {
    this.pendingDelete.set(recipe);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const recipe = this.pendingDelete();
    if (!recipe) {
      return;
    }

    this.pendingDelete.set(null);
    this.recipeStore.delete(recipe.id).subscribe({
      next: () => {
        this.startCreate();
        this.alert.set({
          variant: 'success',
          title: 'Recipe deleted',
          message: `${recipe.name} has been removed.`,
        });
      },
      error: (error: unknown) => this.showError('Unable to delete recipe', error),
    });
  }

  protected dismissAlert(): void {
    this.alert.set(null);
  }

  protected addRequirement(): void {
    this.requirements.push(this.createRequirementGroup());
  }

  protected removeRequirement(index: number): void {
    if (this.requirements.length === 1) {
      return;
    }

    this.requirements.removeAt(index);
  }

  protected trackRequirement(_: number, requirement: RequirementFormGroup): number {
    return requirement.controls.clientKey.value;
  }

  private startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      servings: 1,
    });
    this.resetRequirements([{ ingredientId: '', requiredQuantity: 1 }]);
  }

  private startEdit(recipe: Recipe): void {
    this.editingId.set(recipe.id);
    this.form.controls.name.setValue(recipe.name);
    this.form.controls.servings.setValue(recipe.servings);
    this.resetRequirements(
      recipe.ingredients.map((item) => ({
        ingredientId: item.ingredientId,
        requiredQuantity: item.requiredQuantity,
      })),
    );
  }

  protected cancelEdit(): void {
    this.closeFormModal();
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (payload.ingredients.length === 0) {
      this.alert.set({
        variant: 'warning',
        title: 'Recipe needs ingredients',
        message: 'Each recipe needs at least one ingredient requirement.',
      });
      return;
    }

    this.saving.set(true);
    this.alert.set(null);

    const editingId = this.editingId();
    const request$ = editingId
      ? this.recipeStore.update(editingId, payload as UpdateRecipeRequest)
      : this.recipeStore.create(payload as CreateRecipeRequest);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.formModalOpen.set(false);
        this.startCreate();
        this.alert.set({
          variant: 'success',
          title: editingId ? 'Recipe updated' : 'Recipe created',
          message: editingId ? 'Recipe details have been updated.' : 'New recipe has been added.',
        });
      },
      error: (error: unknown) => this.showError('Unable to save recipe', error),
    });
  }

  protected ingredientLabel(ingredientId: string): string {
    return (
      this.ingredients().find((ingredient) => ingredient.id === ingredientId)?.name ?? ingredientId
    );
  }

  protected trackRecipe(_: number, recipe: Recipe): string {
    return recipe.id;
  }

  protected deleteMessage(): string {
    const recipe = this.pendingDelete();
    if (!recipe) {
      return '';
    }

    return `Delete recipe "${recipe.name}"? This cannot be undone.`;
  }

  private createRequirementGroup(value?: {
    ingredientId: string;
    requiredQuantity: number;
  }): RequirementFormGroup {
    return this.fb.nonNullable.group({
      clientKey: [this.nextRequirementKey()],
      ingredientId: [value?.ingredientId ?? '', [Validators.required]],
      requiredQuantity: [value?.requiredQuantity ?? 1, [Validators.required, Validators.min(1)]],
    });
  }

  private nextRequirementKey(): number {
    this.requirementKeyCounter += 1;
    return this.requirementKeyCounter;
  }

  private resetRequirements(
    values: Array<{ ingredientId: string; requiredQuantity: number }>,
  ): void {
    const groups =
      values.length > 0
        ? values.map((value) => this.createRequirementGroup(value))
        : [this.createRequirementGroup()];

    this.form.setControl('requirements', this.fb.array<RequirementFormGroup>(groups));
  }

  private buildPayload(): CreateRecipeRequest | UpdateRecipeRequest {
    const ingredients = this.requirements.controls
      .map((control) => ({
        ingredientId: control.controls.ingredientId.value,
        requiredQuantity: control.controls.requiredQuantity.value,
      }))
      .filter((item) => item.ingredientId.trim().length > 0);

    return {
      name: this.form.controls.name.value.trim(),
      servings: this.form.controls.servings.value,
      ingredients,
    };
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

  private showError(title: string, error: unknown): void {
    this.alert.set({
      variant: 'error',
      title,
      message: this.getErrorMessage(error),
    });
  }
}
