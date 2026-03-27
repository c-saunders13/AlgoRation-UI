import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { RationsResult } from '../../../../core/models/calculation.model';
import { Ingredient } from '../../../../core/models/ingredient.model';
import { Recipe } from '../../../../core/models/recipe.model';
import { CalculationService } from '../../../../core/services/calculation.service';
import { IngredientService } from '../../../../core/services/ingredient.service';
import { RecipeService } from '../../../../core/services/recipe.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly ingredientService = inject(IngredientService);
  private readonly recipeService = inject(RecipeService);
  private readonly calculationService = inject(CalculationService);

  protected readonly ingredients = signal<Ingredient[]>([]);
  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly calculationResult = signal<RationsResult | null>(null);
  protected readonly loadingData = signal(false);
  protected readonly calculating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.refreshData();
  }

  protected refreshData(): void {
    this.loadingData.set(true);
    this.errorMessage.set(null);

    forkJoin({
      ingredients: this.ingredientService.list(),
      recipes: this.recipeService.list(),
    })
      .pipe(finalize(() => this.loadingData.set(false)))
      .subscribe({
        next: ({ ingredients, recipes }) => {
          this.ingredients.set(ingredients);
          this.recipes.set(recipes);
        },
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error)),
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
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error)),
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
