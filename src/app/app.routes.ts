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
        title: 'AlgoRation UI',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page').then(
            (module) => module.HomePageComponent,
          ),
      },
      {
        path: 'architecture',
        title: 'Architecture | AlgoRation UI',
        loadComponent: () =>
          import('./features/architecture/pages/architecture-page/architecture-page').then(
            (module) => module.ArchitecturePageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
