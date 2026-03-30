import { Routes } from '@angular/router';

import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'AlgoRation',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page').then(
            (module) => module.HomePageComponent,
          ),
      },
      {
        path: 'ingredients',
        title: 'Ingredients | AlgoRation',
        loadComponent: () =>
          import('./features/ingredients/pages/ingredients-page/ingredients-page').then(
            (module) => module.IngredientsPageComponent,
          ),
      },
      {
        path: 'recipes',
        title: 'Recipes | AlgoRation',
        loadComponent: () =>
          import('./features/recipes/pages/recipes-page/recipes-page').then(
            (module) => module.RecipesPageComponent,
          ),
      },
      {
        path: 'not-found',
        title: 'Not Found | AlgoRation',
        loadComponent: () =>
          import('./features/not-found/pages/not-found-page/not-found-page').then(
            (module) => module.NotFoundPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
