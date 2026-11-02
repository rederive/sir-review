// The rederive/sir-review action: rederive's `rdv review` engine (cli/lsp/pr-review.mjs, bundled from the `rederive` npm
// package into dist/index.cjs) run on a pull_request event. It posts one sticky PR comment and line notes, writes the
// per-contract report to the job summary, annotates every finding, and fails the check on a Stop unless fail-on is never.
// Bundled as CommonJS on purpose: in one ESM file every module's import.meta.url is the bundle's, so rederive's
// main-module guards (`node validate.mjs …`) would all fire.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { run } from 'rederive/cli/lsp/pr-review.mjs';

const input = (name, fallback) => { const v = process.env[`INPUT_${name.toUpperCase()}`]; return v === undefined || v === '' ? fallback : v.trim(); };
const failOn = input('fail-on', 'stop');
if (!['stop', 'never'].includes(failOn)) { console.log(`::error title=sir-review::fail-on must be stop or never (got ${failOn})`); process.exit(1); }
process.env.GITHUB_TOKEN = input('github-token', process.env.GITHUB_TOKEN ?? '');

// the review reads both sides of the PR through git: fetch them if the checkout was shallow
const ev = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
for (const sha of [ev.pull_request?.base?.sha, ev.pull_request?.head?.sha].filter(Boolean)) {
  try { execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { stdio: 'ignore' }); }
  catch { execFileSync('git', ['fetch', '--no-tags', '--quiet', 'origin', sha], { stdio: 'inherit' }); }
}
(async () => {
  try { process.exitCode = await run({ failOn, comment: input('comment', 'true') === 'true', notes: input('line-notes', 'true') === 'true' }); }
  catch (e) { console.log(`::error title=sir-review::${String(e.message).replace(/\r?\n/g, ' ')}`); process.exitCode = 1; }
})();
