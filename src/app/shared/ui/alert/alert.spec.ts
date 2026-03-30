import { TestBed } from '@angular/core/testing';

import { AlertComponent } from './alert';

describe('AlertComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title and message', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    fixture.componentRef.setInput('title', 'Heads up');
    fixture.componentRef.setInput('message', 'Something happened');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h3')?.textContent).toContain('Heads up');
    expect(element.querySelector('p')?.textContent).toContain('Something happened');
  });

  it('should emit dismissed when dismiss button is clicked', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();

    const emitSpy = spyOn(fixture.componentInstance.dismissed, 'emit');
    const element = fixture.nativeElement as HTMLElement;
    const dismissButton = element.querySelector<HTMLButtonElement>('.alert__dismiss');

    expect(dismissButton).not.toBeNull();

    dismissButton?.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
