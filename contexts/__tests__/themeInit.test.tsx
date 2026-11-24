import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';

import { ThemeProvider } from '@/contexts';

const script = readFileSync(path.resolve(import.meta.dir, '../../public/theme-init.js'), 'utf8');
const originalMatchMedia = window.matchMedia;

function setEnvironment(stored: string | null, systemPrefersDark: boolean) {
  localStorage.clear();
  if (stored !== null) localStorage.setItem('theme', stored);
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && systemPrefersDark,
  })) as typeof window.matchMedia;
}

function appliedTheme() {
  const root = document.documentElement;
  return {
    attribute: root.getAttribute('data-theme'),
    classes: ['light', 'dark'].filter(name => root.classList.contains(name)),
  };
}

function resetRoot() {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('light', 'dark');
}

/**
 * public/theme-init.js runs before the app and ThemeProvider runs with it. If they disagreed, the
 * page would paint in one theme and then switch to the other.
 */
describe('theme-init.js', () => {
  afterEach(() => {
    cleanup();
    resetRoot();
    localStorage.clear();
    window.matchMedia = originalMatchMedia;
  });

  test.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    [null, true, 'dark'],
    [null, false, 'light'],
    ['not-a-theme', true, 'light'],
  ] as const)('stored=%p, system prefers dark=%p → %s', (stored, systemPrefersDark, expected) => {
    setEnvironment(stored, systemPrefersDark);
    // Leftovers from a previous visit must not survive.
    document.documentElement.classList.add(expected === 'dark' ? 'light' : 'dark');

    new Function(script)();
    const fromScript = appliedTheme();
    expect(fromScript).toEqual({ attribute: expected, classes: [expected] });

    resetRoot();
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(appliedTheme()).toEqual(fromScript);
  });

  test('falls back to the system preference when storage is unavailable', () => {
    setEnvironment('light', true);
    // Browsers that block storage throw as soon as `localStorage` is read.
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
    try {
      new Function(script)();
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
      else delete (window as { localStorage?: Storage }).localStorage;
    }

    expect(appliedTheme()).toEqual({ attribute: 'dark', classes: ['dark'] });
  });

  test('is loaded by the document before the runtime configuration', () => {
    const document = readFileSync(
      path.resolve(import.meta.dir, '../../pages/_document.tsx'),
      'utf8'
    );
    const themeInit = document.indexOf('<script src="/theme-init.js" />');
    expect(themeInit).toBeGreaterThan(-1);
    expect(themeInit).toBeLessThan(document.indexOf('<script src="/env-config.js" />'));
  });
});
