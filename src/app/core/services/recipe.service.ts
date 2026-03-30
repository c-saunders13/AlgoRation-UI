import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '../models/recipe.model';
import { API_CONFIG, buildUrl } from './api-config';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly endpoint = buildUrl(this.config.endpoints.recipes, this.config);

  list(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.endpoint);
  }

  create(payload: CreateRecipeRequest): Observable<Recipe> {
    return this.http.post<Recipe>(this.endpoint, payload);
  }

  update(id: string, payload: UpdateRecipeRequest): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  reset(): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reset`, {});
  }
}
