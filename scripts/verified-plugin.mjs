// The esbuild plugin that redirects rederive's review orchestration (cli/lsp/pr-review.mjs) to the verified review-core:
// its imports of explain / analyze / review-parts / canon resolve to src/verified.mjs. Any other cli/lsp or cli/sir import
// it makes fails the build, so nothing hand-written slips back in.
import { fileURLToPath } from 'node:url';
const VERIFIED = fileURLToPath(new URL('../src/verified.mjs', import.meta.url));
const REDIRECT = /\/cli\/(lsp\/(explain|analyze|review-parts)|sir\/canon)\.mjs$/;
export const verified = {
  name: 'verified-review-core',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\// }, (a) => {
      if (!/\/cli\/lsp\/pr-review\.mjs$/.test(a.importer)) return undefined;
      const target = new URL(a.path, `file://${a.importer}`).pathname;
      if (REDIRECT.test(target)) return { path: VERIFIED };
      if (/\/cli\/(lsp|sir)\//.test(target)) throw new Error(`pr-review imports ${a.path}, which is not redirected to a verified unit`);
      return undefined;
    });
  },
};
