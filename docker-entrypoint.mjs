import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Collect all NEXT_PUBLIC_* environment variables.
const runtimeEnv = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('NEXT_PUBLIC_')) {
    runtimeEnv[key] = value;
  }
}

const keys = Object.keys(runtimeEnv);
if (keys.length === 0) {
  console.warn(
    '[entrypoint] WARNING: No NEXT_PUBLIC_* environment variables found. ' +
      'The app will start with empty configuration.'
  );
}

// Escape '<' to prevent </script> injection if values are ever served inline.
const json = JSON.stringify(runtimeEnv).replace(/</g, '\\u003c');
const script = `window.__ENV__ = ${json};`;

const outputPath = join(__dirname, 'public', 'env-config.js');
try {
  writeFileSync(outputPath, script);
  console.log(`[entrypoint] Wrote env-config.js with keys: ${keys.join(', ')}`);
} catch (err) {
  console.error(
    `[entrypoint] FATAL: Failed to write ${outputPath}: ${err.message}\n` +
      'Ensure the public/ directory exists and is writable by the container user.'
  );
  process.exit(1);
}

// Start the Next.js server.
await import('./server.js');
