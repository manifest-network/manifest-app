// Stylesheets imported for their side effects. TypeScript 6 type-checks side-effect imports, and
// these resolve to CSS files, which have no type declarations.
declare module '*.css';
declare module '@interchain-ui/react/styles';
