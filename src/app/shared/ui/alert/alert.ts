import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly variant = input('info' as AlertVariant);
  readonly title = input('');
  readonly message = input('');
  readonly dismissible = input(false);

  readonly dismissed = output();

  protected dismiss(): void {
    this.dismissed.emit();
  }
}
