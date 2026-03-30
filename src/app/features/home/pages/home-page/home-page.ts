import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, filter, finalize, forkJoin, of, switchMap, tap } from 'rxjs';

import { RationsResult } from '../../../../core/models/calculation.model';
import { CalculationService } from '../../../../core/services/calculation.service';
import { RecipeService } from '../../../../core/services/recipe.service';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { QuantityDisplayPipe } from '../../../../shared/ui/pipes/quantity-display.pipe';
import { getDisplayErrorMessage } from '../../../../shared/utils/error-message';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, QuantityDisplayPipe],
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
  private readonly loadRequest = signal({ forceRefresh: false, requestId: 0 });
  private readonly restoreRequest = signal(0);
  private readonly calculateRequest = signal(0);
  protected readonly loadingData = signal(false);
  protected readonly calculating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly _loadData = toSignal(
    toObservable(this.loadRequest).pipe(
      switchMap(({ forceRefresh }) => {
        this.loadingData.set(true);
        this.errorMessage.set(null);

        return forkJoin({
          ingredients: this.ingredientStore.load(forceRefresh),
          recipes: this.recipeStore.load(forceRefresh),
        }).pipe(
          catchError((error: unknown) => {
            this.errorMessage.set(getDisplayErrorMessage(error));
            return of(null);
          }),
          finalize(() => this.loadingData.set(false)),
        );
      }),
    ),
    { initialValue: null },
  );
  private readonly _restoreData = toSignal(
    toObservable(this.restoreRequest).pipe(
      filter((requestId) => requestId > 0),
      switchMap(() => {
        this.loadingData.set(true);
        this.errorMessage.set(null);
        this.calculationResult.set(null);

        return this.recipeService.reset().pipe(
          switchMap(() =>
            forkJoin({
              ingredients: this.ingredientStore.load(true),
              recipes: this.recipeStore.load(true),
            }),
          ),
          catchError((error: unknown) => {
            this.errorMessage.set(getDisplayErrorMessage(error));
            return of(null);
          }),
          finalize(() => this.loadingData.set(false)),
        );
      }),
    ),
    { initialValue: null },
  );
  private readonly _calculateRations = toSignal(
    toObservable(this.calculateRequest).pipe(
      filter((requestId) => requestId > 0),
      switchMap(() => {
        this.calculating.set(true);
        this.errorMessage.set(null);

        return this.calculationService.calculate().pipe(
          tap((result) => this.calculationResult.set(result)),
          catchError((error: unknown) => {
            this.errorMessage.set(getDisplayErrorMessage(error));
            return of(null);
          }),
          finalize(() => this.calculating.set(false)),
        );
      }),
    ),
    { initialValue: null },
  );

  protected refreshData(): void {
    this.requestLoad(true);
  }

  protected restoreData(): void {
    this.restoreRequest.update((requestId) => requestId + 1);
  }

  protected calculateRations(): void {
    if (this.calculating()) {
      return;
    }

    this.calculateRequest.update((requestId) => requestId + 1);
  }

  private requestLoad(forceRefresh = false): void {
    this.loadRequest.update(({ requestId }) => ({
      forceRefresh,
      requestId: requestId + 1,
    }));
  }
}
