// Applies the saved theme (or the system preference) to <html> before the app loads, so the page
// never paints in the wrong theme. pages/_document.tsx loads this file synchronously.
//
// It must choose the same theme as ThemeProvider in contexts/useTheme.tsx;
// contexts/__tests__/themeInit.test.tsx compares the two.
(function () {
  var theme;
  try {
    var stored = window.localStorage.getItem('theme');
    if (stored) theme = stored === 'dark' ? 'dark' : 'light';
  } catch (e) {}
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
})();
