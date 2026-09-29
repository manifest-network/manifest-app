/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@cosmos-kit/web3auth', 'react-syntax-highlighter', 'troika-three-text'],
  reactStrictMode: true,
  images: {
    // Use a custom loader to validate and block malicious patterns
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    // No specific domain allowlist handled in the loader
    domains: [],
    remotePatterns: [],
    // Additional security settings
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // Runtime config written at container start (docker-entrypoint.mjs). Unlike the hashed
        // build assets its URL never changes, so browsers must revalidate it on every load.
        // `private` also keeps Cloudflare's Browser Cache TTL from replacing this with a long
        // max-age (it rewrote the default `public, max-age=0` to `max-age=14400`).
        source: '/env-config.js',
        headers: [{ key: 'Cache-Control', value: 'private, no-cache' }],
      },
    ];
  },
};

export default nextConfig;
