import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
} from '../models/ingredient.model';
import { API_CONFIG } from './api-config';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly endpoint = this.buildUrl(this.config.endpoints.ingredients);

  list(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.endpoint);
  }

  create(payload: CreateIngredientRequest): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.endpoint, payload);
  }

  update(id: string, payload: UpdateIngredientRequest): Observable<Ingredient> {
    return this.http.put<Ingredient>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  private buildUrl(path: string): string {
    return `${this.config.baseUrl}${path}`;
  }
}
