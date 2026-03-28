import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
} from '../models/ingredient.model';
import { IngredientService } from '../services/ingredient.service';

@Injectable({ providedIn: 'root' })
export class IngredientStore {
  private readonly service = inject(IngredientService);

  private readonly _ingredients = signal<Ingredient[]>([]);
  private readonly _loading = signal(false);
  private _loaded = false;

  readonly ingredients = this._ingredients.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(force = false): Observable<Ingredient[]> {
    if (this._loaded && !force) {
      return of(this._ingredients());
    }

    this._loading.set(true);
    return this.service.list().pipe(
      tap((list) => {
        this._ingredients.set(list);
        this._loaded = true;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  create(payload: CreateIngredientRequest): Observable<Ingredient> {
    return this.service
      .create(payload)
      .pipe(tap((created) => this._ingredients.update((list) => [...list, created])));
  }

  update(id: string, payload: UpdateIngredientRequest): Observable<Ingredient> {
    return this.service
      .update(id, payload)
      .pipe(
        tap((updated) =>
          this._ingredients.update((list) => list.map((i) => (i.id === id ? updated : i))),
        ),
      );
  }

  delete(id: string): Observable<void> {
    return this.service
      .delete(id)
      .pipe(tap(() => this._ingredients.update((list) => list.filter((i) => i.id !== id))));
  }
}
