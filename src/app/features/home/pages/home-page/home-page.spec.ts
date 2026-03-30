import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CalculationService } from '../../../../core/services/calculation.service';
import { RecipeService } from '../../../../core/services/recipe.service';
import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { HomePageComponent } from './home-page';

interface HomePageTestApi {
  refreshData(): void;
  calculateRations(): void;
  calculationResult(): { totalPeopleFed: number } | null;
  errorMessage(): string | null;
}

describe('HomePageComponent', () => {
  const ingredientStoreMock = {
    ingredients: signal([]),
    load: jasmine.createSpy('load').and.returnValue(of([])),
  };

  const recipeStoreMock = {
    recipes: signal([]),
    load: jasmine.createSpy('load').and.returnValue(of([])),
  };

  const calculationServiceMock = {
    calculate: jasmine.createSpy('calculate').and.returnValue(
      of({
        totalPeopleFed: 3,
        breakdown: [{ recipeName: 'Rice Bowl', servingsMade: 3 }],
        leftoverIngredients: [{ id: 'ing-1', name: 'Rice', availableQuantity: 2 }],
      }),
    ),
  };

  const recipeServiceMock = {
    reset: jasmine.createSpy('reset').and.returnValue(of(undefined)),
  };

  beforeEach(async () => {
    ingredientStoreMock.load.calls.reset();
    recipeStoreMock.load.calls.reset();
    calculationServiceMock.calculate.calls.reset();
    recipeServiceMock.reset.calls.reset();

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: IngredientStore, useValue: ingredientStoreMock },
        { provide: RecipeStore, useValue: recipeStoreMock },
        { provide: CalculationService, useValue: calculationServiceMock },
        { provide: RecipeService, useValue: recipeServiceMock },
      ],
    }).compileComponents();
  });

  it('should create and load data on init using cache-aware store load', () => {
    const fixture = TestBed.createComponent(HomePageComponent);

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(ingredientStoreMock.load).toHaveBeenCalledWith(false);
    expect(recipeStoreMock.load).toHaveBeenCalledWith(false);
  });

  it('should force refresh when refreshData is requested', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as HomePageTestApi;

    ingredientStoreMock.load.calls.reset();
    recipeStoreMock.load.calls.reset();

    component.refreshData();

    expect(ingredientStoreMock.load).toHaveBeenCalledWith(true);
    expect(recipeStoreMock.load).toHaveBeenCalledWith(true);
  });

  it('should calculate rations and store result', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as HomePageTestApi;

    component.calculateRations();

    expect(calculationServiceMock.calculate).toHaveBeenCalled();
    expect(component.calculationResult()?.totalPeopleFed).toBe(3);
  });

  it('should set error message when refresh fails', () => {
    ingredientStoreMock.load.and.returnValue(throwError(() => new Error('Load failed')));

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as HomePageTestApi;

    expect(component.errorMessage()).toContain('Load failed');
  });
});
