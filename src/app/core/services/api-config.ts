import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiEndpoints {
  ingredients: string;
  recipes: string;
  calculation: string;
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: ApiEndpoints;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: environment.apiBaseUrl,
  endpoints: {
    ingredients: '/Ingredients',
    recipes: '/Recipes',
    calculation: '/Rations/Calculate',
  },
};

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  factory: () => DEFAULT_API_CONFIG,
});
