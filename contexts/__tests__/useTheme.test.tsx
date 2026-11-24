import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, jest, mock, test } from 'bun:test';
import React from 'react';

import { ThemeProvider, useTheme } from '@/contexts';
import { THEME_COLOR_TOKENS, expandHex, readThemeColors } from '@/contexts/themeColors';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <button data-testid="toggle-btn" onClick={() => toggleTheme()}>
        Toggle Theme
      </button>
    </div>
  );
}

const THEMED_COLORS = `
  [data-theme='light'] {
    --color-primary: #a087ff;
    --color-secondary: #fbfbff;
    --color-base-100: #fff;
    --color-base-content: #161616;
    --color-content-muted: #00000099;
    --color-content-subtle: #0006;
    --color-success: #4caf50;
    --color-warning: #e17100;
    --color-warning-content: #161616;
    --color-error: #e53935;
    --color-error-content: #fff;
  }
  [data-theme='dark'] {
    --color-primary: #a087ff;
    --color-secondary: #1d192d;
    --color-base-100: #161616;
    --color-base-content: #fff;
    --color-content-muted: #ffffff99;
    --color-content-subtle: #fff6;
    --color-success: #4caf50;
    --color-warning: #ffb300;
    --color-warning-content: #161616;
    --color-error: #e53935;
    --color-error-content: #fff;
  }
`;

function ColorsProbe() {
  const { colors, toggleTheme } = useTheme();

  return (
    <div>
      <p data-testid="colors">{colors ? JSON.stringify(colors) : 'none'}</p>
      <button data-testid="toggle-btn" onClick={() => toggleTheme()}>
        Toggle Theme
      </button>
    </div>
  );
}

describe('expandHex', () => {
  test('expands shorthand hex colors and leaves full ones alone', () => {
    expect(expandHex('#fff')).toBe('#ffffff');
    expect(expandHex(' #A0F ')).toBe('#aa00ff');
    expect(expandHex('#fff9')).toBe('#ffffff99');
    expect(expandHex('#a087ff')).toBe('#a087ff');
    expect(expandHex('#FFFFFF99')).toBe('#ffffff99');
    expect(expandHex('')).toBe('');
  });
});

describe('theme colors', () => {
  let style: HTMLStyleElement | undefined;

  afterEach(() => {
    cleanup();
    style?.remove();
    style = undefined;
    localStorage.clear();
  });

  test('are undefined when the stylesheet does not define them', () => {
    render(
      <ThemeProvider>
        <ColorsProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('colors').textContent).toBe('none');
    expect(readThemeColors()).toBeUndefined();
  });

  test('are undefined when a single token is missing', () => {
    style = document.createElement('style');
    style.textContent = THEMED_COLORS.replace(/--color-error-content: #fff;/g, '');
    document.head.appendChild(style);

    render(
      <ThemeProvider>
        <ColorsProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('colors').textContent).toBe('none');
  });

  test('follow the active theme, as full-length hex colors', async () => {
    style = document.createElement('style');
    style.textContent = THEMED_COLORS;
    document.head.appendChild(style);

    render(
      <ThemeProvider>
        <ColorsProbe />
      </ThemeProvider>
    );
    const read = () => JSON.parse(screen.getByTestId('colors').textContent ?? '');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(Object.keys(read()).sort()).toEqual([...THEME_COLOR_TOKENS].sort());
    expect(read()).toMatchObject({
      secondary: '#fbfbff',
      'base-content': '#161616',
      'base-100': '#ffffff',
      'content-subtle': '#00000066',
      warning: '#e17100',
    });

    fireEvent.click(screen.getByTestId('toggle-btn'));
    await waitFor(() => expect(read().secondary).toBe('#1d192d'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(read()).toMatchObject({
      'base-content': '#ffffff',
      'base-100': '#161616',
      'content-subtle': '#ffffff66',
      warning: '#ffb300',
    });
  });
});

describe('useTheme', () => {
  afterAll(cleanup);

  test('should toggle theme', async () => {
    const { container } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    const themeEl = screen.getByTestId('theme');
    const toggleBtn = screen.getByTestId('toggle-btn');

    expect(themeEl.textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(toggleBtn);
    await waitFor(() => expect(themeEl.textContent).toBe('dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(toggleBtn);
    await waitFor(() => expect(themeEl.textContent).toBe('light'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
