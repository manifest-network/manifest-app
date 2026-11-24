import { beforeAll, describe, expect, test } from 'bun:test';
import { ESLint } from 'eslint';
import path from 'node:path';

/**
 * The theme only stays in one place if components cannot hardcode colors and radii. ESLint enforces
 * that (.eslintrc.json, `no-restricted-syntax`); these tests keep the rules honest.
 */
describe('lint rules against hardcoded colors and radii', () => {
  let eslint: ESLint;

  const lint = async (code: string, file = 'components/example.tsx') => {
    const [result] = await eslint.lintText(code, {
      filePath: path.resolve(import.meta.dir, '..', file),
    });
    return result.messages
      .filter(message => message.ruleId === 'no-restricted-syntax')
      .map(message => message.message);
  };
  const component = (className: string) =>
    `export const Example = () => <div className="${className}" />;\n`;

  beforeAll(() => {
    eslint = new ESLint({ cwd: path.resolve(import.meta.dir, '..') });
  });

  test('theme tokens and the radius scale are accepted', async () => {
    const classes = [
      'bg-surface-card text-content-muted border-line hover:bg-surface-hover',
      'bg-primary/10 text-base-content bg-neutral text-white bg-black/30 text-error',
      'rounded-xl rounded-t-lg rounded-field rounded-box rounded-full',
      'dark:invert w-[calc(50%-8px)] text-sm border-b-[0.5px]',
    ];
    for (const className of classes) {
      expect(await lint(component(className))).toEqual([]);
    }
  }, 30_000);

  test.each([
    ['bg-[#FFFFFF0F]', /Hardcoded color in a class name/],
    ['hover:text-[#161616]', /Hardcoded color in a class name/],
    ['text-gray-500', /Tailwind palette colors/],
    ['hover:bg-red-500', /Tailwind palette colors/],
    ['border-slate-200', /Tailwind palette colors/],
    ['dark:text-white', /already change with the theme/],
    ['dark:hover:bg-primary', /already change with the theme/],
    ['rounded-[12px]', /Hardcoded border radius/],
    ['sm:rounded-t-[4px]', /Hardcoded border radius/],
  ])('%s is rejected', async (className, message) => {
    const messages = await lint(component(`p-2 ${className} flex`));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(message);
  });

  test('classes built in template literals are checked too', async () => {
    const code =
      'export const Example = ({ on }: { on: boolean }) => (\n' +
      "  <div className={`p-2 ${on ? 'bg-primary' : 'bg-gray-700'} dark:bg-black rounded-[8px]`} />\n" +
      ');\n';
    const messages = await lint(code);
    expect(messages.some(message => /Tailwind palette colors/.test(message))).toBe(true);
    expect(messages.some(message => /already change with the theme/.test(message))).toBe(true);
    expect(messages.some(message => /Hardcoded border radius/.test(message))).toBe(true);
  });

  test('color strings are rejected outside the 3D scenes', async () => {
    const code = "export const color = '#a087ff';\n";
    expect(await lint(code, 'components/example.tsx')).toHaveLength(1);
    expect(await lint(code, 'hooks/example.ts')).toHaveLength(1);
    expect(await lint(code, 'components/3js/example.tsx')).toEqual([]);
    expect(await lint("export const id = '#section';\n")).toEqual([]);
  });
});
