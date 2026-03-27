import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { RationsResult } from '../../../../core/models/calculation.model';
import { CalculationService } from '../../../../core/services/calculation.service';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';

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

  protected readonly ingredients = this.ingredientStore.ingredients;
  protected readonly recipes = this.recipeStore.recipes;
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
      ingredients: this.ingredientStore.load(true),
      recipes: this.recipeStore.load(true),
    })
      .pipe(finalize(() => this.loadingData.set(false)))
      .subscribe({
        next: () => {},
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
