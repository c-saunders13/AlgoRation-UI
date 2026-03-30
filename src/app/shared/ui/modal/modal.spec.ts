import { TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal';

describe('ModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render modal content when open is true', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.modal-backdrop')).not.toBeNull();
  });

  it('should emit closed on close button click', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const emitSpy = spyOn(fixture.componentInstance.closed, 'emit');
    const element = fixture.nativeElement as HTMLElement;
    const closeButton = element.querySelector<HTMLButtonElement>('.modal__close');

    expect(closeButton).not.toBeNull();

    closeButton?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit closed on escape key when open', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const emitSpy = spyOn(fixture.componentInstance.closed, 'emit');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(emitSpy).toHaveBeenCalled();
  });
});
