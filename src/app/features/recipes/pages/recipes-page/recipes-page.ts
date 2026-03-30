import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
} from '../../../../core/models/recipe.model';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { AlertComponent, AlertVariant } from '../../../../shared/ui/alert/alert';
import { ModalComponent } from '../../../../shared/ui/modal/modal';
import { getDisplayErrorMessage } from '../../../../shared/utils/error-message';
import {
  minFormArrayItems,
  nonWhitespaceValidator,
  uniqueNameValidator,
} from '../../../../shared/utils/form-validators';

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
    name: this.fb.nonNullable.control('', [
      Validators.required,
      nonWhitespaceValidator(),
      uniqueNameValidator(this.recipes, this.editingId),
    ]),
    servings: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    requirements: this.createRequirementsArray([{ ingredientId: '', requiredQuantity: 1 }]),
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
    this.requirements.updateValueAndValidity();
  }

  protected removeRequirement(index: number): void {
    if (this.requirements.length === 1) {
      return;
    }

    this.requirements.removeAt(index);
    this.requirements.updateValueAndValidity();
  }

  protected trackRequirement(_: number, requirement: RequirementFormGroup): number {
    return requirement.controls.clientKey.value;
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
      return 'Recipe name must be unique.';
    }

    return null;
  }

  protected servingsErrorMessage(): string | null {
    const control = this.form.controls.servings;
    if (!this.showControlError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Servings is required.';
    }

    if (control.hasError('min')) {
      return 'Servings must be > 0.';
    }

    return null;
  }

  protected requirementsErrorMessage(): string | null {
    if (!this.showControlError(this.requirements)) {
      return null;
    }

    if (this.requirements.hasError('minFormArrayItems')) {
      return 'Ingredients must contain at least one item.';
    }

    return null;
  }

  protected requirementIngredientErrorMessage(index: number): string | null {
    const control = this.requirements.at(index)?.controls.ingredientId;
    if (!this.showControlError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Ingredient is required.';
    }

    return null;
  }

  protected requirementQuantityErrorMessage(index: number): string | null {
    const control = this.requirements.at(index)?.controls.requiredQuantity;
    if (!this.showControlError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Required quantity is required.';
    }

    if (control.hasError('min')) {
      return 'RequiredQuantity must be > 0.';
    }

    return null;
  }

  private startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      servings: 1,
    });
    this.resetRequirements([{ ingredientId: '', requiredQuantity: 1 }]);
    this.form.controls.name.updateValueAndValidity();
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
    this.form.controls.name.updateValueAndValidity();
  }

  protected cancelEdit(): void {
    this.closeFormModal();
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.alert.set(null);

    const payload = this.buildPayload();
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
      error: (error: unknown) => {
        this.formModalOpen.set(false);
        this.showError('Unable to save recipe', error);
      },
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

  private createRequirementsArray(
    values: Array<{ ingredientId: string; requiredQuantity: number }>,
  ): FormArray<RequirementFormGroup> {
    const groups =
      values.length > 0
        ? values.map((value) => this.createRequirementGroup(value))
        : [this.createRequirementGroup()];

    return this.fb.array<RequirementFormGroup>(groups, {
      validators: [minFormArrayItems(1)],
    });
  }

  private nextRequirementKey(): number {
    this.requirementKeyCounter += 1;
    return this.requirementKeyCounter;
  }

  private resetRequirements(
    values: Array<{ ingredientId: string; requiredQuantity: number }>,
  ): void {
    this.form.setControl('requirements', this.createRequirementsArray(values));
  }

  private buildPayload(): CreateRecipeRequest | UpdateRecipeRequest {
    const ingredients = this.requirements.controls.map((control) => ({
      ingredientId: control.controls.ingredientId.value,
      requiredQuantity: control.controls.requiredQuantity.value,
    }));

    return {
      name: this.form.controls.name.value.trim(),
      servings: this.form.controls.servings.value,
      ingredients,
    };
  }

  private showError(title: string, error: unknown): void {
    this.alert.set({
      variant: 'error',
      title,
      message: getDisplayErrorMessage(error),
    });
  }
}
