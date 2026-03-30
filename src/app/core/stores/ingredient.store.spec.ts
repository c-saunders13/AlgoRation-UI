import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { IngredientService } from '../services/ingredient.service';
import { IngredientStore } from './ingredient.store';

describe('IngredientStore', () => {
  let service: jasmine.SpyObj<IngredientService>;
  let store: IngredientStore;

  const initialIngredients = [
    { id: 'ing-1', name: 'Rice', availableQuantity: 10 },
    { id: 'ing-2', name: 'Beans', availableQuantity: 6 },
  ];

  beforeEach(() => {
    service = jasmine.createSpyObj<IngredientService>('IngredientService', [
      'list',
      'create',
      'update',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [IngredientStore, { provide: IngredientService, useValue: service }],
    });

    store = TestBed.inject(IngredientStore);
  });

  it('should cache load results and bypass the API until a forced reload occurs', () => {
    const initialLoad$ = new Subject<typeof initialIngredients>();
    const refreshedIngredients = [{ id: 'ing-3', name: 'Lentils', availableQuantity: 8 }];
    let firstLoadResult: typeof initialIngredients | undefined;
    let cachedLoadResult: typeof initialIngredients | undefined;
    let forcedLoadResult: typeof refreshedIngredients | undefined;

    service.list.and.returnValues(initialLoad$.asObservable(), of(refreshedIngredients));

    store.load().subscribe((ingredients) => {
      firstLoadResult = ingredients;
    });

    expect(store.loading()).toBeTrue();
    expect(service.list.calls.count()).toBe(1);

    initialLoad$.next(initialIngredients);
    initialLoad$.complete();

    expect(store.loading()).toBeFalse();
    expect(firstLoadResult).toEqual(initialIngredients);
    expect(store.ingredients()).toEqual(initialIngredients);

    store.load().subscribe((ingredients) => {
      cachedLoadResult = ingredients;
    });

    expect(service.list.calls.count()).toBe(1);
    expect(cachedLoadResult).toEqual(initialIngredients);

    store.load(true).subscribe((ingredients) => {
      forcedLoadResult = ingredients;
    });

    expect(service.list.calls.count()).toBe(2);
    expect(forcedLoadResult).toEqual(refreshedIngredients);
    expect(store.ingredients()).toEqual(refreshedIngredients);
  });

  it('should clear loading state after a load failure and retry the API on the next load', () => {
    let receivedError: unknown;

    service.list.and.returnValues(
      throwError(() => new Error('Load failed')),
      of(initialIngredients),
    );

    store.load().subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    expect(receivedError).toEqual(jasmine.any(Error));
    expect(store.loading()).toBeFalse();
    expect(store.ingredients()).toEqual([]);

    let retryResult: typeof initialIngredients | undefined;

    store.load().subscribe((ingredients) => {
      retryResult = ingredients;
    });

    expect(service.list.calls.count()).toBe(2);
    expect(retryResult).toEqual(initialIngredients);
    expect(store.ingredients()).toEqual(initialIngredients);
  });

  it('should keep create operations non-optimistic and serve created items from the cache afterward', () => {
    const create$ = new Subject<(typeof initialIngredients)[number]>();
    const createdIngredient = { id: 'ing-3', name: 'Tomato', availableQuantity: 4 };
    let createdResult: (typeof initialIngredients)[number] | undefined;
    let cachedResult: ((typeof initialIngredients)[number])[] | undefined;

    service.list.and.returnValue(of(initialIngredients));
    service.create.and.returnValue(create$.asObservable());

    store.load().subscribe();

    store.create({ name: 'Tomato', availableQuantity: 4 }).subscribe((ingredient) => {
      createdResult = ingredient;
    });

    expect(store.ingredients()).toEqual(initialIngredients);

    create$.next(createdIngredient);
    create$.complete();

    expect(createdResult).toEqual(createdIngredient);
    expect(store.ingredients()).toEqual([...initialIngredients, createdIngredient]);

    store.load().subscribe((ingredients) => {
      cachedResult = ingredients;
    });

    expect(service.list.calls.count()).toBe(1);
    expect(cachedResult).toEqual([...initialIngredients, createdIngredient]);
  });

  it('should only update and delete ingredients after successful API responses', () => {
    const update$ = new Subject<(typeof initialIngredients)[number]>();
    const updatedIngredient = { id: 'ing-1', name: 'Brown Rice', availableQuantity: 12 };
    let deleteError: unknown;

    service.list.and.returnValue(of(initialIngredients));
    service.update.and.returnValue(update$.asObservable());
    service.delete.and.returnValues(
      throwError(() => new Error('Delete failed')),
      of(void 0),
    );

    store.load().subscribe();

    store.update('ing-1', { name: 'Brown Rice', availableQuantity: 12 }).subscribe();

    expect(store.ingredients()).toEqual(initialIngredients);

    update$.next(updatedIngredient);
    update$.complete();

    expect(store.ingredients()).toEqual([updatedIngredient, initialIngredients[1]]);

    store.delete('ing-2').subscribe({
      error: (error) => {
        deleteError = error;
      },
    });

    expect(deleteError).toEqual(jasmine.any(Error));
    expect(store.ingredients()).toEqual([updatedIngredient, initialIngredients[1]]);

    store.delete('ing-2').subscribe();

    expect(store.ingredients()).toEqual([updatedIngredient]);
  });
});
