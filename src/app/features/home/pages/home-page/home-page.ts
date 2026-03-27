import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly principles = [
    'Standalone components and route-driven composition.',
    'Feature folders for pages and domain-specific UI.',
    'Shared and core layers separated by responsibility.',
    'Strict typing with generator defaults for OnPush components.',
  ];
}
