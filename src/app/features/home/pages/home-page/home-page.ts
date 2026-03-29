import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { RationsResult } from '../../../../core/models/calculation.model';
import { CalculationService } from '../../../../core/services/calculation.service';
import { RecipeService } from '../../../../core/services/recipe.service';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { getDisplayErrorMessage } from '../../../../shared/utils/error-message';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly ingredientStore = inject(IngredientStore);
  private readonly recipeStore = inject(RecipeStore);
  private readonly calculationService = inject(CalculationService);
  private readonly recipeService = inject(RecipeService);

  protected readonly ingredients = this.ingredientStore.ingredients;
  protected readonly recipes = this.recipeStore.recipes;
  protected readonly calculationResult = signal<RationsResult | null>(null);
  protected readonly leftoverIngredients = computed(() =>
    (this.calculationResult()?.leftoverIngredients ?? []).filter(
      (ingredient) => ingredient.availableQuantity >= 1,
    ),
  );
  protected readonly loadingData = signal(false);
  protected readonly calculating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadData();
  }

  protected refreshData(): void {
    this.loadData(true);
  }

  private loadData(forceRefresh = false): void {
    this.loadingData.set(true);
    this.errorMessage.set(null);

    forkJoin({
      ingredients: this.ingredientStore.load(forceRefresh),
      recipes: this.recipeStore.load(forceRefresh),
    })
      .pipe(finalize(() => this.loadingData.set(false)))
      .subscribe({
        next: () => {},
        error: (error: unknown) => this.errorMessage.set(getDisplayErrorMessage(error)),
      });
  }

  protected restoreData(): void {
    this.loadingData.set(true);
    this.errorMessage.set(null);

    this.recipeService
      .reset()
      .pipe(
        switchMap(() =>
          forkJoin({
            ingredients: this.ingredientStore.load(true),
            recipes: this.recipeStore.load(true),
          }),
        ),
        finalize(() => this.loadingData.set(false)),
      )
      .subscribe({
        next: () => {},
        error: (error: unknown) => this.errorMessage.set(getDisplayErrorMessage(error)),
      });
  }

  protected calculateRations(): void {
    if (this.calculating()) {
      return;
    }

    this.calculating.set(true);
    this.errorMessage.set(null);

    this.calculationService
      .calculate()
      .pipe(finalize(() => this.calculating.set(false)))
      .subscribe({
        next: (result) => this.calculationResult.set(result),
        error: (error: unknown) => this.errorMessage.set(getDisplayErrorMessage(error)),
      });
  }
}
