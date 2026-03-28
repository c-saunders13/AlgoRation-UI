import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '../models/recipe.model';
import { RecipeService } from '../services/recipe.service';

@Injectable({ providedIn: 'root' })
export class RecipeStore {
  private readonly service = inject(RecipeService);

  private readonly _recipes = signal<Recipe[]>([]);
  private readonly _loading = signal(false);
  private _loaded = false;

  readonly recipes = this._recipes.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(force = false): Observable<Recipe[]> {
    if (this._loaded && !force) {
      return of(this._recipes());
    }

    this._loading.set(true);
    return this.service.list().pipe(
      tap((list) => {
        this._recipes.set(list);
        this._loaded = true;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  create(payload: CreateRecipeRequest): Observable<Recipe> {
    return this.service
      .create(payload)
      .pipe(tap((created) => this._recipes.update((list) => [...list, created])));
  }

  update(id: string, payload: UpdateRecipeRequest): Observable<Recipe> {
    return this.service
      .update(id, payload)
      .pipe(
        tap((updated) =>
          this._recipes.update((list) => list.map((r) => (r.id === id ? updated : r))),
        ),
      );
  }

  delete(id: string): Observable<void> {
    return this.service
      .delete(id)
      .pipe(tap(() => this._recipes.update((list) => list.filter((r) => r.id !== id))));
  }
}
