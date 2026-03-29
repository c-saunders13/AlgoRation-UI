import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { IngredientStore } from '../../../../core/stores/ingredient.store';
import { IngredientsPageComponent } from './ingredients-page';

describe('IngredientsPageComponent', () => {
  const ingredientStoreMock = {
    ingredients: signal([{ id: 'ing-1', name: 'Salt', availableQuantity: 2 }]),
    loading: signal(false),
    load: jasmine.createSpy('load').and.returnValue(of([])),
    create: jasmine
      .createSpy('create')
      .and.returnValue(of({ id: 'new-id', name: 'Tomato', availableQuantity: 10 })),
    update: jasmine
      .createSpy('update')
      .and.returnValue(of({ id: 'up-id', name: 'Rice', availableQuantity: 20 })),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    ingredientStoreMock.ingredients.set([{ id: 'ing-1', name: 'Salt', availableQuantity: 2 }]);
    ingredientStoreMock.load.calls.reset();
    ingredientStoreMock.create.calls.reset();
    ingredientStoreMock.update.calls.reset();
    ingredientStoreMock.delete.calls.reset();

    await TestBed.configureTestingModule({
      imports: [IngredientsPageComponent],
      providers: [{ provide: IngredientStore, useValue: ingredientStoreMock }],
    }).compileComponents();
  });

  it('should create and load ingredients on init', () => {
    const fixture = TestBed.createComponent(IngredientsPageComponent);

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(ingredientStoreMock.load).toHaveBeenCalled();
  });

  it('should create ingredient on submit when not editing', () => {
    const fixture = TestBed.createComponent(IngredientsPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.setValue({ name: '  Tomato  ', availableQuantity: 10 });

    component.submit();

    expect(ingredientStoreMock.create).toHaveBeenCalledWith({
      name: 'Tomato',
      availableQuantity: 10,
    });
  });

  it('should reject whitespace-only ingredient names', () => {
    const fixture = TestBed.createComponent(IngredientsPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.setValue({ name: '   ', availableQuantity: 10 });

    component.submit();

    expect(component.form.controls.name.hasError('whitespace')).toBeTrue();
    expect(ingredientStoreMock.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate ingredient names', () => {
    const fixture = TestBed.createComponent(IngredientsPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.form.setValue({ name: ' salt ', availableQuantity: 10 });

    component.submit();

    expect(component.form.controls.name.hasError('duplicateName')).toBeTrue();
    expect(ingredientStoreMock.create).not.toHaveBeenCalled();
  });

  it('should delete selected ingredient on confirmDelete', () => {
    const fixture = TestBed.createComponent(IngredientsPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.requestDelete({ id: 'ing-1', name: 'Salt', availableQuantity: 2 });

    component.confirmDelete();

    expect(ingredientStoreMock.delete).toHaveBeenCalledWith('ing-1');
  });
});
