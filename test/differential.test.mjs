// The Action ships the review with every pure part replaced by its verified copy (vendor/review-core). This differential
// runs that build and rederive's original review() side by side on the same pull requests — 200
// seeded edits to a real contract family (rules, pins, headers, comments, stray lines, oracle answers, inputs, moves,
// encodings, bindings) — and requires byte-identical results: the comment, the line notes, the findings, the report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { verified } from '../scripts/verified-plugin.mjs';
import { review as original } from 'rederive/cli/lsp/pr-review.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const out = join(mkdtempSync(join(tmpdir(), 'sir-review-diff-')), 'verified-review.mjs');
await build({ stdin: { contents: "export { review } from 'rederive/cli/lsp/pr-review.mjs';", resolveDir: ROOT }, bundle: true, platform: 'node', format: 'esm', preserveSymlinks: true, outfile: out, logLevel: 'error', plugins: [verified] });
const { review: fromVerified } = await import(out);

const repo = mkdtempSync(join(tmpdir(), 'sir-review-prs-')); process.chdir(repo);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).trim();
cpSync(join(ROOT, 'test/fixtures/colors'), join(repo, 'packages/colors'), { recursive: true });
git('init', '-q', '-b', 'main'); git('add', '-A'); git('commit', '-qm', 'base');
const P = 'packages/colors/'; const rd = (f) => readFileSync(P + f, 'utf8'); const wr = (f, s) => writeFileSync(P + f, s);
const oracle = (f) => { let o; try { o = JSON.parse(rd('oracles/strip.json')); } catch { return; } f(o); wr('oracles/strip.json', JSON.stringify(o, null, 1) + '\n'); };   // skipped once an earlier edit broke the file
let seed = 20261102; const rnd = (n) => { seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) | 0; return ((seed >>> 0) % n); };
const pickOne = (xs) => xs[rnd(xs.length)];

// one seeded PR = 1 to 3 edits drawn from the kinds a reviewer meets
const EDITS = [
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('then a lowercase "m"', 'then a lowercase "m" or "M"')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('PINNED grammar CODE = ESC "[" DIGIT+ "m"', 'PINNED grammar CODE = ESC "[" DIGIT+ (";" DIGIT+)* "m"')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('INVARIANT ', 'R5 A new rule that nobody tested.\nINVARIANT ')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('FIDELITY package', 'FIDELITY spec')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('ANCHOR colors@1.4.0', 'ANCHOR colors@1.5.0')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('NOTE ', 'NOTE A second note first.\nNOTE ')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace('DESCRIPTION ', 'DESCRIPTION (edited) ')),
  () => wr('sir/strip.sir', 'stray text before the unit\n' + rd('sir/strip.sir')),
  () => wr('sir/strip.sir', rd('sir/strip.sir').replace(/\n/g, '\r\n')),
  () => oracle((o) => { const c = pickOne(o.heldout); c.expected = { t: 'text', v: 'rewritten', cu: 'utf8' }; }),
  () => oracle((o) => { const c = pickOne(o.frozen); c.args = [{ t: 'text', v: 'changed input', cu: 'utf8' }]; c.expected = { t: 'text', v: 'changed input', cu: 'utf8' }; }),
  () => oracle((o) => { o.frozen.push(o.heldout.shift()); }),
  () => oracle((o) => { o.heldout.push({ name: 'new_case', args: [{ t: 'text', v: 'x', cu: 'utf8' }], expected: { t: 'text', v: 'x', cu: 'utf8' } }); }),
  () => oracle((o) => { o.encoding = 'other'; }),
  () => wr('oracles/strip.json', '{ not json'),
  () => wr('sir/strip.js.sir', rd('sir/strip.js.sir').replace(/PRIMARY-SHA256 [0-9a-f]{64}/, 'PRIMARY-SHA256 ' + '0'.repeat(64))),
  () => wr('sir/strip.ts.sir', rd('sir/strip.ts.sir').replace('MECHANISM', 'MECHANISM (edited)')),
  () => git('rm', '-q', P + 'sir/strip.rust.sir'),
];
const prs = [];
for (let i = 0; i < 200; i++) { git('checkout', '-q', 'main'); git('checkout', '-q', '-b', `pr${i}`); const k = 1 + rnd(3); for (let j = 0; j < k; j++) pickOne(EDITS)(); git('add', '-A'); try { git('commit', '-qm', `pr ${i}`); prs.push(`pr${i}`); } catch { /* an edit that changed nothing */ } }
git('checkout', '-q', 'main');

test('the verified build and rederive\'s original agree byte for byte on every PR', () => {
  assert.ok(prs.length >= 180, `${prs.length} PRs generated`);
  let stops = 0;
  for (const pr of prs) { const a = original({ base: 'main', head: pr }), b = fromVerified({ base: 'main', head: pr }); stops += a.stops;
    assert.equal(JSON.stringify(b), JSON.stringify(a), `${pr} differs`); }
  assert.ok(stops > 0, 'the seeded PRs exercise the Stop rules');
  console.log(`differential: ${prs.length} PRs, ${stops} Stops, identical`);
});
