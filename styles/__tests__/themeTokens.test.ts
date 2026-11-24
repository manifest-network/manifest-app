import tailwind from '@tailwindcss/postcss';
import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import postcss, { Root } from 'postcss';

import { THEME_COLOR_TOKENS } from '@/contexts/themeColors';

const STYLESHEET = path.resolve(import.meta.dir, '../globals.css');
const source = readFileSync(STYLESHEET, 'utf8');

/** The colors daisyUI defines itself. Every other `--color-*` is one of the app's own tokens. */
const DAISYUI_COLORS = [
  'primary',
  'primary-content',
  'secondary',
  'secondary-content',
  'accent',
  'accent-content',
  'neutral',
  'neutral-content',
  'base-100',
  'base-200',
  'base-300',
  'base-content',
  'info',
  'info-content',
  'success',
  'success-content',
  'warning',
  'warning-content',
  'error',
  'error-content',
];

type Declarations = Record<string, string>;

/** Custom properties declared directly inside the at-rule (not in nested rules). */
function customProperties(root: Root, name: string, params: RegExp): Declarations[] {
  const blocks: Declarations[] = [];
  root.walkAtRules(name, rule => {
    if (!params.test(rule.params)) return;
    const declarations: Declarations = {};
    rule.each(node => {
      if (node.type === 'decl' && node.prop.startsWith('--')) declarations[node.prop] = node.value;
    });
    blocks.push(declarations);
  });
  return blocks;
}

function themeBlock(root: Root, themeName: string): Declarations {
  const themes: Record<string, Declarations> = {};
  root.walkAtRules('plugin', rule => {
    if (!/daisyui\/theme/.test(rule.params)) return;
    const declarations: Declarations = {};
    let name = '';
    rule.each(node => {
      if (node.type !== 'decl') return;
      if (node.prop === 'name') name = node.value.replace(/['"]/g, '');
      if (node.prop.startsWith('--')) declarations[node.prop] = node.value;
    });
    themes[name] = declarations;
  });
  expect(Object.keys(themes).sort()).toEqual(['dark', 'light']);
  return themes[themeName];
}

const colorNames = (declarations: Declarations) =>
  Object.keys(declarations)
    .filter(prop => prop.startsWith('--color-'))
    .map(prop => prop.slice('--color-'.length));

describe('theme tokens in styles/globals.css', () => {
  const root = postcss.parse(source);
  const light = themeBlock(root, 'light');
  const dark = themeBlock(root, 'dark');
  const [registered] = customProperties(root, 'theme', /^$/);
  // Tokens the app registers with Tailwind, without the palette reset and white/black.
  const appTokens = colorNames(registered).filter(name => !['*', 'white', 'black'].includes(name));

  test('the light and dark themes define the same variables', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  test('the app registers its own color tokens', () => {
    expect(appTokens).toContain('surface-card');
    expect(appTokens).toContain('content-muted');
    expect(appTokens).toContain('line');
  });

  test('every registered color token has a value in both themes', () => {
    for (const token of appTokens) {
      expect(light).toHaveProperty(`--color-${token}`);
      expect(dark).toHaveProperty(`--color-${token}`);
    }
  });

  test('every theme color is a daisyUI color or a registered token', () => {
    // A color that is only set in the theme blocks generates no utility class.
    const known = [...DAISYUI_COLORS, ...appTokens].sort();
    expect(colorNames(light).sort()).toEqual(known);
    expect(colorNames(dark).sort()).toEqual(known);
  });

  test('the registered fallback values are the light theme values', () => {
    for (const token of appTokens) {
      expect(registered[`--color-${token}`]).toBe(light[`--color-${token}`]);
    }
  });

  test('colors handed to JavaScript are hex colors in both themes', () => {
    const hex = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/;
    for (const token of THEME_COLOR_TOKENS) {
      expect(light[`--color-${token}`]).toMatch(hex);
      expect(dark[`--color-${token}`]).toMatch(hex);
    }
  });

  describe('compiled stylesheet', () => {
    let compiled: Root;

    const rule = (selector: string) => {
      let found: Declarations | undefined;
      compiled.walkRules(node => {
        if (found || node.selector !== selector) return;
        found = {};
        node.each(child => {
          if (child.type === 'decl') found![child.prop] = child.value;
        });
      });
      return found;
    };

    /** Variables set by the rules whose selector list includes `selector`. */
    const variablesFor = (selector: string) => {
      const declarations: Declarations = {};
      compiled.walkRules(node => {
        if (!node.selectors.includes(selector)) return;
        node.each(child => {
          if (child.type === 'decl' && child.prop.startsWith('--')) {
            declarations[child.prop] = child.value;
          }
        });
      });
      return declarations;
    };

    beforeAll(async () => {
      // Compile the real stylesheet for a fixed list of classes, independent of what the source
      // files happen to use.
      const classes = [
        ...appTokens.map(token => `bg-${token}`),
        'text-white',
        'text-gray-500',
        'bg-red-500',
        'border-slate-200',
        'rounded-field',
        'rounded-box',
        'btn-gradient',
      ];
      const css = source
        .replace("@import 'tailwindcss';", "@import 'tailwindcss' source(none);")
        .concat(`\n@source inline("${classes.join(' ')}");\n`);
      expect(css).toContain('source(none)');
      const result = await postcss([tailwind()]).process(css, { from: STYLESHEET });
      compiled = result.root as Root;
    }, 30_000);

    test('every registered token generates a utility that follows the theme', () => {
      for (const token of appTokens) {
        expect(rule(`.bg-${token}`)).toEqual({ 'background-color': `var(--color-${token})` });
      }
    });

    test("Tailwind's default palette is not available", () => {
      expect(rule('.text-white')).toEqual({ color: 'var(--color-white)' });
      expect(rule('.text-gray-500')).toBeUndefined();
      expect(rule('.bg-red-500')).toBeUndefined();
      expect(rule('.border-slate-200')).toBeUndefined();
    });

    test('each theme sets every variable from its block', () => {
      expect(variablesFor('[data-theme="light"]')).toMatchObject(light);
      expect(variablesFor('[data-theme="dark"]')).toMatchObject(dark);
      // The dark theme is also the default for visitors whose system prefers dark.
      expect(variablesFor(':root:not([data-theme])')).toMatchObject(dark);
    });

    test('radii and gradients come from theme variables', () => {
      expect(rule('.rounded-field')).toEqual({ 'border-radius': 'var(--radius-field)' });
      expect(rule('.rounded-box')).toEqual({ 'border-radius': 'var(--radius-box)' });
      expect(rule('.btn-gradient')).toMatchObject({
        'background-image': 'var(--gradient-primary)',
      });
    });
  });
});
