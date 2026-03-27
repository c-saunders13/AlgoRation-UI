import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly navigation = [
    {
      label: 'Home',
      path: '/',
    },
    {
      label: 'Ingredients',
      path: '/ingredients',
    },
    {
      label: 'Recipes',
      path: '/recipes',
    },
  ];
}
