import { NgZone, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { App } from './app';
import { routes } from './app.routes';
import { CalculationService } from './core/services/calculation.service';
import { RecipeService } from './core/services/recipe.service';
import { IngredientStore } from './core/stores/ingredient.store';
import { RecipeStore } from './core/stores/recipe.store';

describe('App user flows', () => {
  let fixture: ComponentFixture<App>;

  interface RecipePayload {
    name: string;
    servings: number;
    ingredients: { ingredientId: string; requiredQuantity: number }[];
  }

  const initialIngredients = [
    { id: 'ing-1', name: 'Rice', availableQuantity: 10 },
    { id: 'ing-2', name: 'Beans', availableQuantity: 4 },
  ];

  const initialRecipes = [
    {
      id: 'recipe-1',
      name: 'Chili',
      servings: 4,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
    },
  ];

  let ingredientStoreMock: {
    ingredients: ReturnType<typeof signal<typeof initialIngredients>>;
    loading: ReturnType<typeof signal<boolean>>;
    load: jasmine.Spy;
    create: jasmine.Spy;
    update: jasmine.Spy;
    delete: jasmine.Spy;
  };
  let recipeStoreMock: {
    recipes: ReturnType<typeof signal<typeof initialRecipes>>;
    loading: ReturnType<typeof signal<boolean>>;
    load: jasmine.Spy;
    create: jasmine.Spy;
    update: jasmine.Spy;
    delete: jasmine.Spy;
  };
  let calculationServiceMock: { calculate: jasmine.Spy };
  let recipeServiceMock: { reset: jasmine.Spy };

  beforeEach(async () => {
    ingredientStoreMock = {
      ingredients: signal(structuredClone(initialIngredients)),
      loading: signal(false),
      load: jasmine.createSpy('load').and.callFake(() => of(ingredientStoreMock.ingredients())),
      create: jasmine
        .createSpy('create')
        .and.callFake((payload: { name: string; availableQuantity: number }) => {
          const created = {
            id: `ing-${String(ingredientStoreMock.ingredients().length + 1)}`,
            ...payload,
          };
          ingredientStoreMock.ingredients.update((list) => [...list, created]);
          return of(created);
        }),
      update: jasmine
        .createSpy('update')
        .and.callFake((id: string, payload: { name: string; availableQuantity: number }) => {
          const updated = { id, ...payload };
          ingredientStoreMock.ingredients.update((list) =>
            list.map((ingredient) => (ingredient.id === id ? updated : ingredient)),
          );
          return of(updated);
        }),
      delete: jasmine.createSpy('delete').and.callFake((id: string) => {
        ingredientStoreMock.ingredients.update((list) =>
          list.filter((ingredient) => ingredient.id !== id),
        );
        return of(void 0);
      }),
    };

    recipeStoreMock = {
      recipes: signal(structuredClone(initialRecipes)),
      loading: signal(false),
      load: jasmine.createSpy('load').and.callFake(() => of(recipeStoreMock.recipes())),
      create: jasmine
        .createSpy('create')
        .and.callFake((payload: RecipePayload) => {
            const created = {
              id: `recipe-${String(recipeStoreMock.recipes().length + 1)}`,
              ...payload,
            };
            recipeStoreMock.recipes.update((list) => [...list, created]);
            return of(created);
          }),
      update: jasmine.createSpy('update').and.callFake(
        (id: string, payload: RecipePayload) => {
          const updated = { id, ...payload };
          recipeStoreMock.recipes.update((list) =>
            list.map((recipe) => (recipe.id === id ? updated : recipe)),
          );
          return of(updated);
        },
      ),
      delete: jasmine.createSpy('delete').and.callFake((id: string) => {
        recipeStoreMock.recipes.update((list) => list.filter((recipe) => recipe.id !== id));
        return of(void 0);
      }),
    };

    calculationServiceMock = {
      calculate: jasmine.createSpy('calculate').and.callFake(() =>
        of({
          totalPeopleFed: recipeStoreMock
            .recipes()
            .reduce((total, recipe) => total + recipe.servings, 0),
          breakdown: recipeStoreMock.recipes().map((recipe) => ({
            recipeName: recipe.name,
            servingsMade: recipe.servings,
          })),
          leftoverIngredients: ingredientStoreMock.ingredients(),
        }),
      ),
    };

    recipeServiceMock = {
      reset: jasmine.createSpy('reset').and.callFake(() => {
        ingredientStoreMock.ingredients.set(structuredClone(initialIngredients));
        recipeStoreMock.recipes.set(structuredClone(initialRecipes));
        return of(void 0);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: IngredientStore, useValue: ingredientStoreMock },
        { provide: RecipeStore, useValue: recipeStoreMock },
        { provide: CalculationService, useValue: calculationServiceMock },
        { provide: RecipeService, useValue: recipeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('should let a user edit ingredients, edit recipes, and calculate rations across routes', async () => {
    await navigate('/ingredients');

    click(queryButton('tbody tr .ghost-button'));
    fixture.detectChanges();
    await fixture.whenStable();

    setInputValue(queryInput('input[formControlName="name"]'), 'Brown Rice');
    setInputValue(queryInput('input[formControlName="availableQuantity"]'), '12');
    click(buttonByText('Update ingredient'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ingredientStoreMock.update).toHaveBeenCalledWith('ing-1', {
      name: 'Brown Rice',
      availableQuantity: 12,
    });
    expect(textContent()).toContain('Brown Rice');
    expect(textContent()).toContain('12');

    await navigate('/recipes');

    expect(textContent()).toContain('Brown Rice - 1');

    click(queryButton('.recipe-list article .ghost-button'));
    fixture.detectChanges();
    await fixture.whenStable();

    setInputValue(queryInput('input[formControlName="name"]'), 'Hearty Chili');
    setInputValue(queryInput('input[formControlName="servings"]'), '5');
    setSelectValue(querySelect('select[formControlName="ingredientId"]'), 'ing-1');
    setInputValue(queryInput('input[formControlName="requiredQuantity"]'), '2');
    click(buttonByText('Update recipe'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(recipeStoreMock.update).toHaveBeenCalledWith('recipe-1', {
      name: 'Hearty Chili',
      servings: 5,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 2 }],
    });
    expect(textContent()).toContain('Hearty Chili');
    expect(textContent()).toContain('Servings: 5');
    expect(textContent()).toContain('Brown Rice - 2');

    await navigate('/');

    click(buttonByText('Calculate rations'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(calculationServiceMock.calculate).toHaveBeenCalled();
    expect(textContent()).toContain('People fed: 5');
    expect(textContent()).toContain('Hearty Chili - 5 servings');
    expect(textContent()).toContain('Brown Rice - 12');
  });

  it('should let a user recover from an ingredient save failure by retrying successfully', async () => {
    let shouldFail = true;

    ingredientStoreMock.update.and.callFake(
      (id: string, payload: { name: string; availableQuantity: number }) => {
        if (shouldFail) {
          shouldFail = false;
          return throwError(() => new Error('Validation failed'));
        }

        const updated = { id, ...payload };
        ingredientStoreMock.ingredients.update((list) =>
          list.map((ingredient) => (ingredient.id === id ? updated : ingredient)),
        );
        return of(updated);
      },
    );

    await navigate('/ingredients');

    click(queryButton('tbody tr .ghost-button'));
    fixture.detectChanges();
    await fixture.whenStable();

    setInputValue(queryInput('input[formControlName="name"]'), 'Rice Deluxe');
    setInputValue(queryInput('input[formControlName="availableQuantity"]'), '14');
    click(buttonByText('Update ingredient'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textContent()).toContain('Unable to save ingredient');
    expect(textContent()).toContain('Validation failed');

    click(queryButton('tbody tr .ghost-button'));
    fixture.detectChanges();
    await fixture.whenStable();

    click(buttonByText('Update ingredient'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ingredientStoreMock.update).toHaveBeenCalledTimes(2);
    expect(textContent()).toContain('Ingredient updated');
    expect(textContent()).toContain('Ingredient details have been updated.');
  });

  async function navigate(url: string): Promise<void> {
    const router = TestBed.inject(Router);
    const zone = TestBed.inject(NgZone);

    await zone.run(() => router.navigateByUrl(url));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function rootElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function query(selector: string): Element {
    const element = rootElement().querySelector(selector);

    if (!element) {
      throw new Error(`Missing element for selector: ${selector}`);
    }

    return element;
  }

  function queryButton(selector: string): HTMLButtonElement {
    const element = query(selector);

    if (!(element instanceof HTMLButtonElement)) {
      throw new Error(`Expected HTMLButtonElement for selector: ${selector}`);
    }

    return element;
  }

  function queryInput(selector: string): HTMLInputElement {
    const element = query(selector);

    if (!(element instanceof HTMLInputElement)) {
      throw new Error(`Expected HTMLInputElement for selector: ${selector}`);
    }

    return element;
  }

  function querySelect(selector: string): HTMLSelectElement {
    const element = query(selector);

    if (!(element instanceof HTMLSelectElement)) {
      throw new Error(`Expected HTMLSelectElement for selector: ${selector}`);
    }

    return element;
  }

  function buttonByText(label: string): HTMLButtonElement {
    const buttons = Array.from(rootElement().querySelectorAll<HTMLButtonElement>('button'));
    const match = buttons.find((button) => normalize(button.textContent) === label);

    if (!match) {
      throw new Error(`Missing button with label: ${label}`);
    }

    return match;
  }

  function click(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function setSelectValue(select: HTMLSelectElement, value: string): void {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function textContent(): string {
    return normalize(rootElement().textContent);
  }

  function normalize(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }
});
