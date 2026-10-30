import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg?.slice('--mode='.length) === 'preview' ? 'preview' : 'production';
const env = {
  ...process.env,
  HEJIU_BUILD_MODE: mode,
};
if (mode === 'preview') {
  env.HEJIU_PREVIEW_ORIGINS = JSON.stringify({
    beverages: 'http://127.0.0.1:4401',
    guide: 'http://127.0.0.1:4402',
    culture: 'http://127.0.0.1:4403',
    atlas: 'http://127.0.0.1:4404',
  });
}

function run(command, args) {
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
  const result = spawnSync(executable, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) console.error(result.error);
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Building four sites in ${mode} mode`);
run('npm', ['run', 'build:tools']);
run('node', [path.join(root, 'scripts', 'build-legacy-compat.mjs')]);
for (const workspace of ['@hejiu/site-guide', '@hejiu/site-culture', '@hejiu/site-atlas', '@hejiu/site-main']) {
  run('npm', ['run', 'build', '-w', workspace]);
}
run('node', [
  path.join(
    root,
    'site-repositories',
    'site-alcoholic-beverages',
    'packages',
    'build-tools',
    'dist',
    'cli.js',
  ),
  'aggregate',
  '--published-only',
]);
run('node', [path.join(root, 'scripts', 'build-search-index.mjs')]);
console.log(`Build complete (${mode}).`);
