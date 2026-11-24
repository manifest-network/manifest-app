/**
 * Theme colors for code that needs a color as a string (third-party widgets, canvases). Everything
 * else should use the Tailwind utilities (`bg-primary`, `text-content-muted`, …).
 *
 * The values live in styles/globals.css, in the two `@plugin "daisyui/theme"` blocks. A token
 * listed here must be a hex color in both blocks: styles/__tests__/themeTokens.test.ts checks it.
 */
export const THEME_COLOR_TOKENS = [
  'primary',
  'secondary',
  'base-100',
  'base-content',
  'content-muted',
  'content-subtle',
  'success',
  'warning',
  'warning-content',
  'error',
  'error-content',
] as const;

export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];
export type ThemeColors = Readonly<Record<ThemeColorToken, string>>;

/**
 * Expands shorthand hex colors (`#fff`, `#fff9`) to their full form. The production CSS build
 * shortens `#ffffff` to `#fff`, and consumers that append an alpha channel to a color need all six
 * digits.
 */
export function expandHex(value: string): string {
  const color = value.trim().toLowerCase();
  const short = /^#([0-9a-f]{3,4})$/.exec(color);
  return short ? `#${[...short[1]].map(digit => digit + digit).join('')}` : color;
}

/**
 * Reads the theme colors in effect on `element`. Returns undefined when the stylesheet that
 * defines them is not loaded (unit tests, for example).
 */
export function readThemeColors(
  element: Element = document.documentElement
): ThemeColors | undefined {
  const style = getComputedStyle(element);
  const colors: Partial<Record<ThemeColorToken, string>> = {};

  for (const token of THEME_COLOR_TOKENS) {
    const value = expandHex(style.getPropertyValue(`--color-${token}`));
    if (!value) return undefined;
    colors[token] = value;
  }

  return colors as ThemeColors;
}
