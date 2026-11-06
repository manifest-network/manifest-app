import { format as prettyFormat, plugins as prettyFormatPlugins } from 'pretty-format';

export function formatComponent(value: any): string {
  const formatted = prettyFormat(value, {
    escapeRegex: true,
    indent: 2,
    plugins: [
      prettyFormatPlugins.ReactTestComponent,
      prettyFormatPlugins.ReactElement,
      prettyFormatPlugins.DOMElement,
      prettyFormatPlugins.DOMCollection,
      prettyFormatPlugins.Immutable,
      prettyFormatPlugins.AsymmetricMatcher,
    ],
    printFunctionName: false,
  });

  // Normalize dynamic Headless UI IDs for consistent snapshots
  // React's useId values are «r1» up to 19.1 and _r_1_ from 19.2.
  return formatted.replace(
    /headlessui-([\w-]+?)-(?:«r\w+»|_r_\w+_)/g,
    'headlessui-$1-«normalized»'
  );
}
