import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-architecture-page',
  templateUrl: './architecture-page.html',
  styleUrl: './architecture-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitecturePageComponent {
  protected readonly sections = [
    {
      name: 'core',
      purpose: 'Application-wide singletons, providers, interceptors, and infrastructure services.',
    },
    {
      name: 'features',
      purpose: 'Route-centric areas that own their pages, facades, and domain-specific UI.',
    },
    {
      name: 'shared',
      purpose:
        'Reusable primitives such as buttons, directives, pipes, and framework-agnostic helpers.',
    },
    {
      name: 'layout',
      purpose:
        'Shells and navigation wrappers that compose feature routes without holding domain logic.',
    },
  ];
}
