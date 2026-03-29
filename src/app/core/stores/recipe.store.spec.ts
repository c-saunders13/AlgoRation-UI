import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { RecipeService } from '../services/recipe.service';
import { RecipeStore } from './recipe.store';

describe('RecipeStore', () => {
  let service: jasmine.SpyObj<RecipeService>;
  let store: RecipeStore;

  const initialRecipes = [
    {
      id: 'recipe-1',
      name: 'Chili',
      servings: 4,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 2 }],
    },
    {
      id: 'recipe-2',
      name: 'Soup',
      servings: 2,
      ingredients: [{ ingredientId: 'ing-2', requiredQuantity: 1 }],
    },
  ];

  beforeEach(() => {
    service = jasmine.createSpyObj<RecipeService>('RecipeService', [
      'list',
      'create',
      'update',
      'delete',
      'reset',
    ]);

    TestBed.configureTestingModule({
      providers: [RecipeStore, { provide: RecipeService, useValue: service }],
    });

    store = TestBed.inject(RecipeStore);
  });

  it('should cache load results and bypass the API until a forced reload occurs', () => {
    const initialLoad$ = new Subject<typeof initialRecipes>();
    const refreshedRecipes = [
      {
        id: 'recipe-3',
        name: 'Stew',
        servings: 5,
        ingredients: [{ ingredientId: 'ing-3', requiredQuantity: 3 }],
      },
    ];
    let firstLoadResult: typeof initialRecipes | undefined;
    let cachedLoadResult: typeof initialRecipes | undefined;
    let forcedLoadResult: typeof refreshedRecipes | undefined;

    service.list.and.returnValues(initialLoad$.asObservable(), of(refreshedRecipes));

    store.load().subscribe((recipes) => {
      firstLoadResult = recipes;
    });

    expect(store.loading()).toBeTrue();
    expect(service.list).toHaveBeenCalledTimes(1);

    initialLoad$.next(initialRecipes);
    initialLoad$.complete();

    expect(store.loading()).toBeFalse();
    expect(firstLoadResult).toEqual(initialRecipes);
    expect(store.recipes()).toEqual(initialRecipes);

    store.load().subscribe((recipes) => {
      cachedLoadResult = recipes;
    });

    expect(service.list).toHaveBeenCalledTimes(1);
    expect(cachedLoadResult).toEqual(initialRecipes);

    store.load(true).subscribe((recipes) => {
      forcedLoadResult = recipes;
    });

    expect(service.list).toHaveBeenCalledTimes(2);
    expect(forcedLoadResult).toEqual(refreshedRecipes);
    expect(store.recipes()).toEqual(refreshedRecipes);
  });

  it('should clear loading state after a load failure and retry the API on the next load', () => {
    let receivedError: unknown;

    service.list.and.returnValues(
      throwError(() => new Error('Load failed')),
      of(initialRecipes),
    );

    store.load().subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    expect(receivedError).toEqual(jasmine.any(Error));
    expect(store.loading()).toBeFalse();
    expect(store.recipes()).toEqual([]);

    let retryResult: typeof initialRecipes | undefined;

    store.load().subscribe((recipes) => {
      retryResult = recipes;
    });

    expect(service.list).toHaveBeenCalledTimes(2);
    expect(retryResult).toEqual(initialRecipes);
    expect(store.recipes()).toEqual(initialRecipes);
  });

  it('should keep create operations non-optimistic and serve created items from the cache afterward', () => {
    const create$ = new Subject<(typeof initialRecipes)[number]>();
    const createdRecipe = {
      id: 'recipe-3',
      name: 'Stew',
      servings: 5,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 2 }],
    };
    let createdResult: (typeof initialRecipes)[number] | undefined;
    let cachedResult: Array<(typeof initialRecipes)[number]> | undefined;

    service.list.and.returnValue(of(initialRecipes));
    service.create.and.returnValue(create$.asObservable());

    store.load().subscribe();

    store
      .create({
        name: 'Stew',
        servings: 5,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 2 }],
      })
      .subscribe((recipe) => {
        createdResult = recipe;
      });

    expect(store.recipes()).toEqual(initialRecipes);

    create$.next(createdRecipe);
    create$.complete();

    expect(createdResult).toEqual(createdRecipe);
    expect(store.recipes()).toEqual([...initialRecipes, createdRecipe]);

    store.load().subscribe((recipes) => {
      cachedResult = recipes;
    });

    expect(service.list).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual([...initialRecipes, createdRecipe]);
  });

  it('should only update and delete recipes after successful API responses', () => {
    const update$ = new Subject<(typeof initialRecipes)[number]>();
    const updatedRecipe = {
      id: 'recipe-1',
      name: 'Hearty Chili',
      servings: 6,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 3 }],
    };
    let deleteError: unknown;

    service.list.and.returnValue(of(initialRecipes));
    service.update.and.returnValue(update$.asObservable());
    service.delete.and.returnValues(
      throwError(() => new Error('Delete failed')),
      of(void 0),
    );

    store.load().subscribe();

    store
      .update('recipe-1', {
        name: 'Hearty Chili',
        servings: 6,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 3 }],
      })
      .subscribe();

    expect(store.recipes()).toEqual(initialRecipes);

    update$.next(updatedRecipe);
    update$.complete();

    expect(store.recipes()).toEqual([updatedRecipe, initialRecipes[1]]);

    store.delete('recipe-2').subscribe({
      error: (error) => {
        deleteError = error;
      },
    });

    expect(deleteError).toEqual(jasmine.any(Error));
    expect(store.recipes()).toEqual([updatedRecipe, initialRecipes[1]]);

    store.delete('recipe-2').subscribe();

    expect(store.recipes()).toEqual([updatedRecipe]);
  });
});
