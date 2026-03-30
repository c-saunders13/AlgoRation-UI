import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NotFoundPageComponent } from './not-found-page';

@Component({
  template: '',
})
class DummyHomeComponent {}

describe('NotFoundPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent, DummyHomeComponent],
      providers: [provideRouter([{ path: '', component: DummyHomeComponent }])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show 404 heading', () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('404');
    expect(element.textContent).toContain('Page not found');
  });

  it('should navigate to home when go to home is clicked', async () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const homeLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/"]');

    expect(homeLink).not.toBeNull();

    homeLink?.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalled();

    const target = navigateSpy.calls.mostRecent().args[0];
    const targetUrl = typeof target === 'string' ? target : target.toString();
    expect(targetUrl).toBe('/');
  });
});
