// The review's pure parts, bound to their selfhost-VERIFIED copies: vendor/review-core is @rederive/review-core, packed by
// rederive's selfhost/core.mjs from units that passed the full loop (sighted contract, oracle stamped from a pinned authority,
// 3 blind js + 3 blind ts emitters in quorum, cross-verified), and CI re-checks it with `rdv check` on every build. The build
// (scripts/build.mjs) redirects the orchestration's imports of explain / analyze / review-parts / canon here, so the code that
// runs in your CI for these functions is the verified emission, not the hand-written original.
import * as explainContract from '../vendor/review-core/src/explain_contract.mjs';
import * as explainDiffU from '../vendor/review-core/src/explain_diff.mjs';
import * as oracleDiffU from '../vendor/review-core/src/oracle_diff.mjs';
import * as bindingOfU from '../vendor/review-core/src/binding_of.mjs';
import * as vectorSetShaU from '../vendor/review-core/src/vector_set_sha.mjs';
import * as hunkLinesU from '../vendor/review-core/src/hunk_lines.mjs';
import * as gitLineU from '../vendor/review-core/src/git_line.mjs';
import * as spansU from '../vendor/review-core/src/directive_spans.mjs';
import * as escPropU from '../vendor/review-core/src/escape_property.mjs';
import * as escDataU from '../vendor/review-core/src/escape_data.mjs';
import * as annotationsU from '../vendor/review-core/src/annotations_text.mjs';
import * as summaryU from '../vendor/review-core/src/review_summary.mjs';

// the export a unit's SIG names, else its default (rdv's own driver resolves it the same way)
const pick = (m, ...names) => { for (const n of names) if (typeof m[n] === 'function') return m[n]; if (typeof m.default === 'function') return m.default; throw new Error(`review-core: no export ${names.join('/')}`); };
const explain_contract = pick(explainContract, 'explain_contract'), explain_diff = pick(explainDiffU, 'explain_diff'), oracle_diff = pick(oracleDiffU, 'oracle_diff');
const binding_of = pick(bindingOfU, 'bindingOf', 'binding_of'), vector_set_sha = pick(vectorSetShaU, 'vector_set_sha', 'vectorSetSha'), hunk_lines = pick(hunkLinesU, 'hunk_lines');
const git_line = pick(gitLineU, 'git_line'), directive_spans = pick(spansU, 'directive_spans'), escape_property = pick(escPropU, 'escape_property', 'escapeProperty');
const escape_data = pick(escDataU, 'escapeData', 'escape_data'), annotations_text = pick(annotationsU, 'annotations_text'), review_summary = pick(summaryU, 'review_summary');

// the orchestration's call shapes → the units' SIGs
export const explain = (text) => explain_contract(text);
export const explainDiff = (before, after, { oracleChanged = null, langs = [] } = {}) => explain_diff(before, after, oracleChanged, langs);
export const oracleDiff = (before, after) => oracle_diff(before, after);
export const bindingOf = (langText, primaryText) => binding_of(langText, primaryText);
export const vectorSetSha = (oracle) => vector_set_sha(oracle);
export const hunkLines = (diff) => hunk_lines(diff);
export const gitLine = (text) => (line) => git_line(text, [line])[0];
export const spans = (text) => new Map(directive_spans(text));
export const escapeProperty = (v) => escape_property(v);
export const escapeData = (v) => escape_data(v);
export const annotations = (findings) => annotations_text(findings);
export const summary = ({ units, stops }) => review_summary(units, stops);
