import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Applies the saved theme before first paint, so the page never flashes the other one */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
        {/* Must load synchronously before React hydrates so window.__ENV__ is available */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/env-config.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
