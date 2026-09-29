const fs = require('fs');
const { execSync } = require('child_process');

// The Docker build context has no .git (see .dockerignore), so the Dockerfile passes the
// commit in GIT_COMMIT. Elsewhere, ask git.
function shortCommit() {
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    console.warn('GIT_COMMIT is not set and git is unavailable; using "unknown"');
    return 'unknown';
  }
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;
packageJson.version = `${currentVersion}-${shortCommit()}`;
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log(`Updated version to ${packageJson.version}`);
