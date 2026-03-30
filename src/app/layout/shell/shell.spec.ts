import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ShellComponent } from './shell';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render navigation links', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.shell__nav a'));

    expect(links.length).toBe(3);
    expect(links.map((link) => link.textContent.trim())).toEqual([
      'Home',
      'Ingredients',
      'Recipes',
    ]);
  });
});
