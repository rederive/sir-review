// npm run build — bundles src/index.mjs into dist/index.cjs, with the review's orchestration (rederive's
// cli/lsp/pr-review.mjs) taking every pure part from src/verified.mjs (the selfhost-verified review-core) instead of
// rederive's hand-written originals. A pure module the orchestration imports that is not redirected fails the build.
import { build } from 'esbuild';
import { verified } from './verified-plugin.mjs';
await build({ entryPoints: ['src/index.mjs'], bundle: true, platform: 'node', format: 'cjs', target: 'node22', preserveSymlinks: true, outfile: 'dist/index.cjs', logLevel: 'warning', plugins: [verified],
  banner: { js: '// rederive/sir-review: built from src/ and the rederive npm package by scripts/build.mjs; every pure part is the verified copy in vendor/review-core. Do not edit.' } });
