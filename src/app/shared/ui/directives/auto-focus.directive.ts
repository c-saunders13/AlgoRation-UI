import { Directive, ElementRef, OnInit, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocusDirective implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appAutoFocus = input(true);

  ngOnInit(): void {
    if (!this.appAutoFocus()) {
      return;
    }

    queueMicrotask(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}
