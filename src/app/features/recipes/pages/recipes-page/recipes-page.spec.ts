import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { RecipeStore } from '../../../../core/stores/recipe.store';
import { RecipesPageComponent } from './recipes-page';

describe('RecipesPageComponent', () => {
  const recipeStoreMock = {
    recipes: signal([
      {
        id: 'recipe-2',
        name: 'Soup',
        servings: 3,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
      },
    ]),
    loading: signal(false),
    load: jasmine.createSpy('load').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(
      of({
        id: 'recipe-1',
        name: 'Stew',
        servings: 2,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
      }),
    ),
    update: jasmine.createSpy('update').and.returnValue(
      of({
        id: 'recipe-1',
        name: 'Stew',
        servings: 2,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
      }),
    ),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };

  const ingredientStoreMock = {
    ingredients: signal([{ id: 'ing-1', name: 'Rice', availableQuantity: 10 }]),
    loading: signal(false),
    load: jasmine.createSpy('load').and.returnValue(of([])),
  };

  beforeEach(async () => {
    recipeStoreMock.recipes.set([
      {
        id: 'recipe-2',
        name: 'Soup',
        servings: 3,
        ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
      },
    ]);
    ingredientStoreMock.ingredients.set([{ id: 'ing-1', name: 'Rice', availableQuantity: 10 }]);
    recipeStoreMock.load.calls.reset();
    recipeStoreMock.create.calls.reset();
    recipeStoreMock.update.calls.reset();
    recipeStoreMock.delete.calls.reset();
    ingredientStoreMock.load.calls.reset();

    await TestBed.configureTestingModule({
      imports: [RecipesPageComponent],
      providers: [
        { provide: RecipeStore, useValue: recipeStoreMock },
        { provide: IngredientStore, useValue: ingredientStoreMock },
      ],
    }).compileComponents();
  });

  it('should create and load recipes and ingredients on init', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(recipeStoreMock.load).toHaveBeenCalled();
    expect(ingredientStoreMock.load).toHaveBeenCalled();
  });

  it('should create recipe on submit with valid payload', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.controls.name.setValue('  Stew  ');
    component.form.controls.servings.setValue(2);
    component.requirements.at(0).controls.ingredientId.setValue('ing-1');
    component.requirements.at(0).controls.requiredQuantity.setValue(1);

    component.submit();

    expect(recipeStoreMock.create).toHaveBeenCalledWith({
      name: 'Stew',
      servings: 2,
      ingredients: [{ ingredientId: 'ing-1', requiredQuantity: 1 }],
    });
  });

  it('should reject whitespace-only recipe names', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.controls.name.setValue('   ');
    component.form.controls.servings.setValue(2);
    component.requirements.at(0).controls.ingredientId.setValue('ing-1');
    component.requirements.at(0).controls.requiredQuantity.setValue(1);

    component.submit();

    expect(component.form.controls.name.hasError('whitespace')).toBeTrue();
    expect(recipeStoreMock.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate recipe names', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.controls.name.setValue(' soup ');
    component.form.controls.servings.setValue(2);
    component.requirements.at(0).controls.ingredientId.setValue('ing-1');
    component.requirements.at(0).controls.requiredQuantity.setValue(1);

    component.submit();

    expect(component.form.controls.name.hasError('duplicateName')).toBeTrue();
    expect(recipeStoreMock.create).not.toHaveBeenCalled();
  });

  it('should reject recipe ingredient rows without an ingredient id', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.controls.name.setValue('Stew');
    component.form.controls.servings.setValue(2);
    component.requirements.at(0).controls.ingredientId.setValue('');
    component.requirements.at(0).controls.requiredQuantity.setValue(1);

    component.submit();

    expect(component.requirements.at(0).controls.ingredientId.hasError('required')).toBeTrue();
    expect(recipeStoreMock.create).not.toHaveBeenCalled();
  });

  it('should reject recipe ingredient rows with non-positive quantity', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.controls.name.setValue('Stew');
    component.form.controls.servings.setValue(2);
    component.requirements.at(0).controls.ingredientId.setValue('ing-1');
    component.requirements.at(0).controls.requiredQuantity.setValue(0);

    component.submit();

    expect(component.requirements.at(0).controls.requiredQuantity.hasError('min')).toBeTrue();
    expect(recipeStoreMock.create).not.toHaveBeenCalled();
  });

  it('should delete selected recipe on confirmDelete', () => {
    const fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.requestDelete({
      id: 'recipe-1',
      name: 'Stew',
      servings: 2,
      ingredients: [],
    });

    component.confirmDelete();

    expect(recipeStoreMock.delete).toHaveBeenCalledWith('recipe-1');
  });
});
