// rederive/sir-review: built from src/index.mjs and the rederive npm package (npm run build). Do not edit.

// src/index.mjs
var import_node_child_process2 = require("node:child_process");
var import_node_fs5 = require("node:fs");

// node_modules/rederive/cli/lsp/pr-review.mjs
var import_node_child_process = require("node:child_process");
var import_node_fs4 = require("node:fs");
var import_node_path3 = require("node:path");

// node_modules/rederive/cli/sir/sir-parse.mjs
var import_node_crypto = require("node:crypto");
var sha256 = (s) => (0, import_node_crypto.createHash)("sha256").update(s).digest("hex");
var DIRECTIVES = {
  UNIT: "B:lb",
  SIR: "P:legacy",
  KIND: "P:lb",
  FIDELITY: "P:lb",
  VARIANT: "P:legacy",
  ANCHOR: "P:lb",
  SRC: "P:lb",
  TRIGGER: "P:lb",
  REACH: "P:lb",
  "ORACLE-CLASS": "P:lb",
  "TRACE-SEAM": "P:lb",
  SEAM: "P:lb",
  SIG: "B:lb",
  ENVELOPE: "B:lb",
  "DEPENDS-ON": "B:lb",
  DESCRIPTION: "B:pr",
  BEHAVIOR: "P:lb",
  INVARIANT: "P:pr",
  TABLE: "P:lb",
  PINNED: "B:lb",
  EARNED: "B:lb",
  NOTE: "B:pr",
  RATIONALE: "B:pr",
  SCOPE: "P:pr",
  "UNGUARDED-PRECONDITION": "P:lb",
  "OUT-OF-DOMAIN": "P:lb",
  ORACLE: "P:lb",
  PROVENANCE: "B:pr",
  CARRIED: "B:lb",
  SHAPE: "P:lb",
  "CANONICAL-SHA256": "P:lb",
  AUTHORITY: "P:lb",
  "CARRIED-DATA": "P:legacy",
  STATE: "P:lb",
  EMIT: "P:lb",
  REQUEST: "P:lb",
  BRANCH: "P:lb",
  "ON-ERROR": "P:lb",
  PAR: "P:lb",
  RING: "P:lb",
  LIFECYCLE: "P:lb",
  EFFECT: "P:lb",
  SURFACE: "P:lb",
  NOTES: "P:legacy",
  "GUARD-PINNED": "P:legacy",
  LANG: "L:lb",
  "PRIMARY-SHA256": "L:lb",
  ABI: "L:lb",
  MECHANISM: "L:lb"
};
var isDirectiveName = (w) => /^(?:[A-Z][A-Z0-9-]*|R\d+)$/.test(w);
var trimWS = (s) => s.replace(/^[ \t]+|[ \t]+$/g, "");
var OPENERS = " 	([{,=:;|<>!&-~";
var quotedSpans = (s) => {
  const spans2 = [];
  let closedAt = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '"' || !(i === 0 || OPENERS.includes(s[i - 1]) || i === closedAt)) continue;
    let j = i + 1;
    while (j < s.length && s[j] !== '"') j += s[j] === "\\" ? 1 + (s.codePointAt(j + 1) > 65535 ? 2 : 1) : 1;
    if (j >= s.length) break;
    spans2.push([i, j + 1]);
    i = j;
    closedAt = j + 1;
  }
  return spans2;
};
var inSpan = (spans2, i) => spans2.some(([a, b]) => i > a && i < b);
var splitTrailingComment = (s) => {
  const quoted = quotedSpans(s);
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "#" || !(i === 0 || s[i - 1] === " " || s[i - 1] === "	") || !(i + 1 === s.length || s[i + 1] === " " || s[i + 1] === "	")) continue;
    if (inSpan(quoted, i)) continue;
    return [s.slice(0, i).replace(/[ \t]+$/, ""), trimWS(s.slice(i + 1))];
  }
  return [s, null];
};
var ATTR = /[ \t]+(CITED|EARNED|ANCHOR)(?=[ \t]|$)/g;
var splitAttributes = (rest) => {
  const spans2 = quotedSpans(rest);
  const hits = [...rest.matchAll(ATTR)].filter((h) => !inSpan(spans2, h.index + h[0].length - h[1].length));
  if (!hits.length) return { body: trimWS(rest), list: [] };
  const list = hits.map((h, k) => [h[1], trimWS(rest.slice(h.index + h[0].length, k + 1 < hits.length ? hits[k + 1].index : rest.length))]);
  return { body: trimWS(rest.slice(0, hits[0].index)), list };
};
var ATTR_ONLY = /* @__PURE__ */ new Set(["CITED"]);
var GLUE = "\\u000A-\\u000D\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\u00AD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890\\u0891\\u08E2\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB\\u{110BD}\\u{110CD}\\u{13430}-\\u{1343F}\\u{1BCA0}-\\u{1BCA3}\\u{1D173}-\\u{1D17A}\\u{E0001}\\u{E0020}-\\u{E007F}";
var GLUED = new RegExp(`^(?:[A-Z][A-Z0-9-]*|R\\d+):?(?=[${GLUE}])`, "u");
var glued = (tok) => tok.match(GLUED)?.[0]?.replace(/:$/, "") ?? null;
var INVISIBLE_LEAD = new RegExp(`^[${GLUE}]+(?=(?:[A-Z][A-Z0-9-]*|R\\d+)(?:[ \\t:${GLUE}]|$)|#)`, "u");
var sirLines = (text2) => text2.split(/\r\n|\r|\n/).map((l) => l.replace(/^[ \t\uFEFF]+/, (lead) => lead.replace(/\uFEFF/g, "")).replace(/[ \t]+$/, ""));
function parse(text2, { mode = "legacy" } = {}) {
  const lines = sirLines(text2);
  const ast = [];
  const errors = [], warnings = [];
  const indents = /* @__PURE__ */ new Map();
  let cur = null;
  const addAttrs = (d, list) => {
    for (const [k, v] of list) {
      d.attrList.push([k, v]);
      d.attrs[k] = k in d.attrs ? [d.attrs[k], v].filter(Boolean).join("; ") : v;
    }
  };
  const continueWith = (code, trailing) => {
    const { body, list } = splitAttributes(" " + code);
    addAttrs(cur, list);
    if (body) cur.cont.push(body);
    if (trailing !== null) cur.comments.push(trailing);
  };
  const cut = (x) => Array.from(x).slice(0, 40).join("");
  lines.forEach((raw, i) => {
    const ln = i + 1;
    const line = raw;
    if (!line) return;
    const indent = line.match(/^[ \t]*/)[0];
    if (indent) indents.set(indent.includes("	") ? "tab" : `${indent.length}sp`, (indents.get(indent.includes("	") ? "tab" : `${indent.length}sp`) || 0) + 1);
    const content = line.slice(indent.length);
    if (content.startsWith("#")) {
      if (mode === "strict") errors.push({ line: ln, code: "E_COMMENT", msg: "comments are not part of the grammar; use DESCRIPTION / NOTE / RATIONALE" });
      else {
        warnings.push({ line: ln, code: "W_LEGACY_COMMENT" });
        if (cur) cur.comments.push(content.replace(/^#+[ \t]?/, ""));
        else ast.push({ directive: "#", name: "#", body: content, args: "", attrs: {}, attrList: [], cont: [], comments: [content], line: ln, register: null, kind: "comment" });
      }
      return;
    }
    const [code, trailing] = splitTrailingComment(content);
    if (trailing !== null) {
      if (mode === "strict") errors.push({ line: ln, code: "E_COMMENT", msg: "trailing comment; make it a CITED/EARNED attribute or a NOTE" });
      else warnings.push({ line: ln, code: "W_LEGACY_TRAILING_COMMENT" });
    }
    if (!indent) {
      const sp = code.search(/[ \t]/);
      let name = sp < 0 ? code : code.slice(0, sp);
      const rest = sp < 0 ? "" : code.slice(sp);
      if (name && /^[A-Z][A-Z0-9-]*:$/.test(name) && !ATTR_ONLY.has(name.slice(0, -1))) {
        name = name.slice(0, -1);
        if (mode === "strict") errors.push({ line: ln, code: "E_LEGACY_COLON", msg: name });
        else warnings.push({ line: ln, code: "W_LEGACY_COLON", msg: name });
      }
      if (name && isDirectiveName(name) && !ATTR_ONLY.has(name)) {
        const entry = DIRECTIVES[name] ?? (/^R\d+$/.test(name) ? "P:lb" : null);
        if (!entry) warnings.push({ line: ln, code: "W_UNKNOWN_DIRECTIVE", msg: name });
        const { body, list } = splitAttributes(rest);
        cur = { directive: name, name, args: body, attrs: {}, attrList: [], cont: [], comments: trailing !== null ? [trailing] : [], line: ln, register: entry ? entry.split(":")[0] : null, kind: entry ? entry.split(":")[1] : "unknown" };
        addAttrs(cur, list);
        ast.push(cur);
        return;
      }
      const g = glued(name) ?? (INVISIBLE_LEAD.test(code) ? code.match(INVISIBLE_LEAD)[0] : null);
      if (g) {
        const lead = INVISIBLE_LEAD.test(code) && !glued(name);
        const cp = lead ? code.codePointAt(0) : name.codePointAt(name.indexOf(g) + g.length + (name[g.length] === ":" ? 1 : 0));
        const hex = `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
        (mode === "strict" ? errors : warnings).push({ line: ln, code: mode === "strict" ? "E_NAME_SEPARATOR" : "W_NAME_SEPARATOR", msg: lead ? `the line starts with ${hex} (whitespace or an invisible character) before ${code.slice(code.match(INVISIBLE_LEAD)[0].length).startsWith("#") ? "a comment marker: not a comment" : `a directive-shaped name: not ${ATTR_ONLY.has(code.slice(code.match(INVISIBLE_LEAD)[0].length).match(/^[A-Z0-9-]+/)?.[0]) ? "an attribute" : "a directive"}`}` : `${g} is followed by ${hex}, not a space or tab: not ${ATTR_ONLY.has(g) ? "an attribute" : "a directive"}` });
      }
      if (cur) {
        continueWith(code, trailing);
        if (mode === "strict") {
          if (!g) errors.push({ line: ln, code: "E_UNINDENTED_CONTINUATION", msg: cut(code) });
        } else warnings.push({ line: ln, code: "W_UNINDENTED_CONTINUATION" });
      } else if (!(g && mode === "strict")) errors.push({ line: ln, code: "E_NO_DIRECTIVE", msg: cut(code) });
      return;
    }
    if (!cur) {
      errors.push({ line: ln, code: "E_ORPHAN_CONTINUATION", msg: cut(code) });
      return;
    }
    continueWith(code, trailing);
  });
  return { ast, errors, warnings, indents: Object.fromEntries(indents) };
}
function canonicalText(text2) {
  const out = [];
  if (!text2.isWellFormed()) throw new Error("not well-formed Unicode (a lone surrogate): UTF-8 cannot carry it, and every lone surrogate would hash alike");
  for (const raw of sirLines(text2)) {
    const line = raw.replace(/[ \t]+$/, "");
    if (!line) continue;
    const indent = line.match(/^[ \t]+/);
    out.push(indent ? "  " + line.slice(indent[0].length) : line);
  }
  return out.length ? out.join("\n") + "\n" : "";
}
var canonicalSha = (text2) => sha256(canonicalText(text2));
var get = (ast, name) => ast.find((d) => d.name === name) ?? null;

// node_modules/rederive/cli/sir/canon.mjs
var import_node_crypto2 = require("node:crypto");
var ENCODING = "sir-canonical-v1";
var TYPES = ["text", "bytes", "bool", "none", "i64", "u64", "f64", "json"];
var QNAN = 0x7ff8000000000000n;
var HEX16 = /^[0-9a-f]{16}$/;
function f64bits(x) {
  if (Number.isNaN(x)) return QNAN;
  const d = new DataView(new ArrayBuffer(8));
  d.setFloat64(0, x);
  return d.getBigUint64(0);
}
var hex16 = (b) => b.toString(16).padStart(16, "0");
var INT = /^(?:0|-?[1-9][0-9]*)$/;
var f64str = (x) => Number.isNaN(x) ? "NaN" : x === Infinity ? "Infinity" : x === -Infinity ? "-Infinity" : Object.is(x, -0) ? "-0" : String(x);
var MAX_DEPTH = 16;
var KEYS = /* @__PURE__ */ new WeakMap();
var typeKey = (t) => {
  let k = KEYS.get(t);
  if (k === void 0) {
    k = typeKeyOf(t);
    KEYS.set(t, k);
  }
  return k;
};
var typeKeyOf = (t) => t.k === "union" ? `union{${t.alts.map(typeKey).sort().join("|")}}` : t.k === "record" ? `record{${t.fields.map(([n, f]) => `${n}:${typeKey(f)}`).sort().join(",")}}` : t.k === "tuple" ? `tuple[${t.items.map(typeKey).join(",")}]` : t.k === "list" ? `list[${typeKey(t.item)}]` : t.k === "map" ? `map[${typeKey(t.key)},${typeKey(t.val)}]` : t.k;
var sameType = (a, b) => typeKey(a) === typeKey(b);
var inJson = (t) => ["none", "bool", "f64", "text", "json"].includes(t.k) || t.k === "list" && inJson(t.item) || t.k === "tuple" && t.items.every(inJson) || t.k === "map" && t.key.k === "text" && inJson(t.val) || t.k === "record" && t.fields.every(([, f]) => inJson(f)) || t.k === "union" && t.alts.every(inJson);
var COVERS = /* @__PURE__ */ new Map();
var covers = (a, b) => {
  const key = typeKey(a) + "\0" + typeKey(b);
  let r = COVERS.get(key);
  if (r === void 0) {
    r = coversOf(a, b);
    if (COVERS.size > 5e4) COVERS.clear();
    COVERS.set(key, r);
  }
  return r;
};
var coversOf = (a, b) => sameType(a, b) || a.k === "json" && inJson(b) || a.k === "list" && b.k === "list" && covers(a.item, b.item) || a.k === "tuple" && b.k === "tuple" && a.items.length === b.items.length && a.items.every((x, i) => covers(x, b.items[i])) || a.k === "map" && b.k === "map" && covers(a.key, b.key) && covers(a.val, b.val) || a.k === "record" && b.k === "record" && a.fields.every(([n, f]) => b.fields.some(([m, g]) => m === n && covers(f, g))) || a.k === "union" && a.alts.some((x) => covers(x, b)) || b.k === "union" && b.alts.every((y) => covers(a, y));
function reader(src) {
  let i = 0, depth = 0;
  const ws = () => {
    while (i < src.length && " 	\r\n".includes(src[i])) i++;
  };
  const fail = (what) => {
    throw new Error(`${what} at ${i} in ${JSON.stringify(src)}`);
  };
  const eat = (tok) => {
    ws();
    if (src.startsWith(tok, i)) {
      i += tok.length;
      return true;
    }
    return false;
  };
  const expect = (tok) => {
    if (!eat(tok)) fail(`expected '${tok}'`);
  };
  const ident = () => {
    ws();
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (!m) fail("expected an identifier");
    i += m[0].length;
    return m[0];
  };
  const list = (item) => {
    const out = [item()];
    while (eat(",")) out.push(item());
    return out;
  };
  function alt() {
    const word = ident();
    if (TYPES.includes(word)) return { k: word };
    if (!["tuple", "list", "map", "record"].includes(word)) fail(`unknown abstract type '${word}' (closed set: ${TYPES.join(", ")}, tuple[\u2026], list[\u2026], map[\u2026], record[\u2026])`);
    if (++depth > MAX_DEPTH) fail(`types nest deeper than ${MAX_DEPTH}`);
    expect("[");
    let node;
    if (word === "record") {
      const fields = list(() => {
        const n = ident();
        expect(":");
        return [n, type()];
      });
      const names = fields.map(([n]) => n);
      if (new Set(names).size !== names.length) fail("duplicate record field");
      node = { k: "record", fields };
    } else {
      const parts = list(type);
      if (word === "list" && parts.length !== 1) fail("list takes exactly one type");
      if (word === "map" && parts.length !== 2) fail("map takes exactly two types");
      node = word === "tuple" ? { k: "tuple", items: parts } : word === "list" ? { k: "list", item: parts[0] } : { k: "map", key: parts[0], val: parts[1] };
    }
    expect("]");
    depth--;
    return node;
  }
  function type() {
    const alts = [alt()];
    while (eat("|")) alts.push(alt());
    for (let j = 1; j < alts.length; j++) for (let k = 0; k < j; k++) if (covers(alts[k], alts[j])) fail(alts[k].k === alts[j].k && sameType(alts[k], alts[j]) ? "a union names the same alternative twice" : `a union alternative is unreachable: an earlier ${alts[k].k} accepts every value it does`);
    return alts.length > 1 ? { k: "union", alts } : alts[0];
  }
  function sig() {
    const prefix = (words2) => {
      const at2 = i;
      for (const w of words2) {
        ws();
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
        if (!m || m[0] !== w) {
          i = at2;
          return false;
        }
        i += m[0].length;
      }
      if (!" 	\r\n".includes(src[i] ?? "#") || !/^[ \t\r\n]*[A-Za-z_]/.test(src.slice(i))) {
        i = at2;
        return false;
      }
      return true;
    };
    if (!prefix(["pub", "fn"])) prefix(["export", "default", "function"]);
    const name = ident();
    expect("(");
    const args = [];
    if (!eat(")")) {
      for (; ; ) {
        const rest = eat("...");
        const n = ident();
        expect(":");
        args.push({ name: n, type: type(), ...rest ? { rest: true } : {} });
        if (eat(")")) break;
        expect(",");
      }
    }
    const ri = args.findIndex((a) => a.rest);
    if (ri >= 0 && ri !== args.length - 1) fail("a rest parameter must be last");
    if (new Set(args.map((a) => a.name)).size !== args.length) fail("duplicate parameter name");
    if (!eat("->") && !eat(":")) fail("expected '->' or ':' before the result type");
    return { name, args, result: type() };
  }
  const done = (v) => {
    ws();
    if (i !== src.length) fail("unexpected text");
    return v;
  };
  return { type: () => done(type()), sig: () => done(sig()) };
}
function parseType(s) {
  if (typeof s !== "string") throw new Error("a type is text");
  return reader(s).type();
}
function parseSig(s) {
  if (typeof s !== "string") throw new Error("bad SIG: not text");
  try {
    return reader(s).sig();
  } catch (e) {
    throw new Error("bad SIG: " + e.message);
  }
}
var UNWRAPPED = /* @__PURE__ */ new WeakSet();
var plainObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
var marker = (v, key) => plainObj(v) && Object.hasOwn(v, key) && typeof v[key] === "string" && !UNWRAPPED.has(v);
var isLegacy = (v) => marker(v, "__t");
var throwMarker = (v, key) => marker(v, key) && Object.keys(v).length === 1;
var isLegacyThrow = (v) => throwMarker(v, "__throw");
var isThrowMarker = (v) => throwMarker(v, "__threw");
var MAX_VALUE_DEPTH = 100;
var RAW_CAP = 4 * MAX_VALUE_DEPTH + 16;
function legacyToNative(v) {
  if (!isLegacy(v)) return v;
  switch (v.__t) {
    // strict (selfhost f64_bits: Number(v) turned {__t:'num', v:'abc'} into NaN, and '' into 0, with no error)
    case "num":
      if (["NaN", "Infinity", "-Infinity", "-0"].includes(v.v)) return v.v === "NaN" ? NaN : v.v === "Infinity" ? Infinity : v.v === "-Infinity" ? -Infinity : -0;
      if (typeof v.v === "string" && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(v.v)) {
        const n = Number(v.v);
        if (n === 0 && /[1-9]/.test(v.v.replace(/[eE].*$/, ""))) throw new Error(`legacy num tag: ${JSON.stringify(v.v)} underflows to zero`);
        if (Number.isFinite(n) && !Object.is(n, -0)) return n;
        throw new Error(`legacy num tag: ${JSON.stringify(v.v)} is ${Object.is(n, -0) ? "-0" : n} \u2014 that value has its own spelling`);
      }
      throw new Error(`legacy num tag: not a number literal ${JSON.stringify(v.v)}`);
    case "bigint":
      if (typeof v.v === "string" && INT.test(v.v)) return BigInt(v.v);
      throw new Error(`legacy bigint tag: not a decimal integer ${JSON.stringify(v.v)} (one spelling: no -0, no leading zeros)`);
    case "undef":
      return void 0;
    case "obj": {
      if (!plainObj(v.v)) throw new Error(`legacy obj tag: v must be a plain map (got ${v.v === null ? "null" : Array.isArray(v.v) ? "a list" : typeof v.v})`);
      const o = {};
      for (const k of Object.keys(v.v)) Object.defineProperty(o, k, { value: v.v[k], enumerable: true, writable: true, configurable: true });
      UNWRAPPED.add(o);
      return o;
    }
    // an escaped user map (its values stay legacy-tagged)
    default:
      throw new Error(`legacy codec tag '${v.__t}' has no language-neutral meaning \u2014 an ENVELOPE fact, not a value`);
  }
}
function textTag(s, opts) {
  if (s.isWellFormed()) return { t: "text", v: s, cu: "utf8" };
  if (opts.utf16) return { t: "text", v: s, cu: "utf16" };
  throw new Error("not well-formed Unicode (lone surrogate) \u2014 UTF-16 only, no utf8 form");
}
function encode(value, type, opts = {}) {
  if (isLegacyThrow(value)) return { t: "throw", msg: value.__throw };
  if (isThrowMarker(value)) return { t: "throw", msg: value.__threw };
  const depth = opts.depth ?? 0;
  if (depth > MAX_VALUE_DEPTH) throw new Error(`a value nests deeper than ${MAX_VALUE_DEPTH}`);
  const child = { ...opts, depth: depth + 1 };
  const plain = plainObj;
  if (type.k === "record") {
    value = legacyToNative(value);
    if (!plain(value)) throw new Error("not record");
    return { t: "record", v: type.fields.map(([name, ft]) => [name, encode(Object.hasOwn(value, name) ? value[name] : void 0, ft, child)]) };
  }
  if (type.k === "json") return encodeJson(value, opts);
  value = legacyToNative(value);
  switch (type.k) {
    case "union": {
      let last;
      for (const alt of type.alts) {
        try {
          return encode(value, alt, opts);
        } catch (e) {
          last = e;
        }
      }
      throw new Error(`fits no alternative: ${last?.message}`);
    }
    case "none":
      if (value === null || value === void 0) return { t: "none" };
      throw new Error("not none");
    case "bool":
      if (typeof value === "boolean") return { t: "bool", v: value };
      throw new Error("not bool");
    case "text":
      if (typeof value === "string") return textTag(value, opts);
      throw new Error("not text");
    case "bytes":
      if (value instanceof Uint8Array) return { t: "bytes", v: "base64:" + Buffer.from(value).toString("base64") };
      throw new Error("not bytes");
    case "f64":
      if (typeof value === "number") return { t: "f64", v: f64str(value), bits: hex16(f64bits(value)) };
      throw new Error(`not f64: ${String(value)}`);
    case "i64":
    case "u64": {
      let b;
      if (typeof value === "bigint") b = value;
      else if (typeof value === "number" && Number.isInteger(value)) b = BigInt(value);
      else throw new Error(`not ${type.k}: ${String(value)} (NaN/Inf/fraction can never occupy an integer slot \u2014 envelope violation)`);
      const lo = type.k === "i64" ? -(2n ** 63n) : 0n, hi = type.k === "i64" ? 2n ** 63n - 1n : 2n ** 64n - 1n;
      if (b < lo || b > hi) throw new Error(`${type.k} out of range: ${b}`);
      return { t: type.k, v: b.toString() };
    }
    case "tuple":
      if (!Array.isArray(value) || value.length !== type.items.length) throw new Error("not tuple");
      return { t: "tuple", v: value.map((x, i) => encode(x, type.items[i], child)) };
    case "list":
      if (!Array.isArray(value)) throw new Error("not list");
      return { t: "list", v: value.map((x) => encode(x, type.item, child)) };
    case "map": {
      if (!(value instanceof Map) && !plain(value)) throw new Error("not map");
      const ents = value instanceof Map ? [...value] : Object.entries(value);
      const sortKey = (k) => k.t === "text" ? k.v : canonicalString(k);
      return { t: "map", v: ents.map(([k, x]) => [encode(k, type.key, child), encode(x, type.val, child)]).sort((a, b) => {
        const x = sortKey(a[0]), y = sortKey(b[0]);
        return x < y ? -1 : x > y ? 1 : 0;
      }) };
    }
  }
  throw new Error("bad type " + JSON.stringify(type));
}
function encodeJson(v, opts = {}) {
  const depth = opts.depth ?? 0;
  if (depth > MAX_VALUE_DEPTH) throw new Error(`a value nests deeper than ${MAX_VALUE_DEPTH}`);
  const child = { ...opts, depth: depth + 1 };
  if (opts.utf16 && isLegacy(v) && v.__t === "u8") return { t: "bytes", v: "base64:" + Buffer.from(v.bytes).toString("base64") };
  v = legacyToNative(v);
  if (opts.utf16 && typeof v === "bigint") return { t: "bigint", v: v.toString() };
  if (opts.utf16 && v instanceof Uint8Array) return { t: "bytes", v: "base64:" + Buffer.from(v).toString("base64") };
  if (opts.utf16 && v instanceof Map) return { t: "jsmap", v: [...v].map(([k, x]) => [encodeJson(k, child), encodeJson(x, child)]) };
  if (opts.utf16 && v instanceof Set) return { t: "jsset", v: [...v].map((x) => encodeJson(x, child)) };
  if (v === void 0 && opts.utf16) return { t: "undefined" };
  if (v === null) return { t: "none" };
  if (typeof v === "boolean") return { t: "bool", v };
  if (typeof v === "number") return { t: "f64", v: f64str(v), bits: hex16(f64bits(v)) };
  if (typeof v === "string") return textTag(v, opts);
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) if (!(i in v) && !opts.utf16) throw new Error("json: sparse array (hole) \u2014 a JS envelope fact");
    return { t: "list", v: Array.from(v, (x) => encodeJson(x, child)) };
  }
  if (plainObj(v)) return { t: "map", v: Object.entries(v).map(([k, x]) => [textTag(k, opts), encodeJson(x, child)]).sort((a, b) => a[0].v < b[0].v ? -1 : a[0].v > b[0].v ? 1 : 0) };
  throw new Error(`json: ${v === void 0 ? "undefined" : typeof v === "function" ? "a function" : Object.prototype.toString.call(v)} has no language-neutral meaning \u2014 an envelope fact`);
}
function display(tv) {
  const fieldName = (n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : JSON.stringify(n);
  switch (tv.t) {
    case "throw":
      return `throw(${JSON.stringify(tv.msg ?? "")})`;
    case "record":
      return "{" + tv.v.map(([n, x]) => fieldName(n) + ":" + display(x)).join(", ") + "}";
    case "bigint":
      return `${tv.v}n`;
    case "none":
      return "null";
    case "undefined":
      return "undefined";
    case "text":
      return JSON.stringify(tv.v);
    case "f64":
    case "i64":
    case "u64":
      return tv.v;
    case "bool":
      return String(tv.v);
    case "bytes":
      return tv.v;
    case "tuple":
    case "list":
      return "[" + tv.v.map(display).join(",") + "]";
    case "map":
      return "{" + tv.v.map(([k, x]) => display(k) + ":" + display(x)).join(",") + "}";
  }
  return "?";
}
function canonicalString(x, depth = 0) {
  if (depth > RAW_CAP) throw new Error(`not canonical: nests deeper than ${RAW_CAP} levels (the codec's ${MAX_VALUE_DEPTH}-value cap)`);
  const cs = (y) => canonicalString(y, depth + 1);
  if (typeof x === "string") return JSON.stringify(x);
  if (typeof x === "boolean") return x ? "true" : "false";
  if (Array.isArray(x)) {
    for (let i = 0; i < x.length; i++) if (!(i in x)) throw new Error("not canonical: an array hole");
    return "[" + x.map(cs).join(",") + "]";
  }
  if (plainObj(x)) {
    if (x.t === "f64" && !(typeof x.bits === "string" && HEX16.test(x.bits))) throw new Error("not canonical: an f64 tag without 16-hex bits");
    const o = x.t === "f64" ? { t: "f64", bits: x.bits } : x.t === "throw" ? { t: "throw" } : x;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + cs(o[k])).join(",") + "}";
  }
  throw new Error(`not canonical: ${x === null ? "null" : x === void 0 ? "undefined" : typeof x === "object" ? Object.prototype.toString.call(x) : typeof x}`);
}
var sha2562 = (s) => (0, import_node_crypto2.createHash)("sha256").update(s).digest("hex");
var vectorSetSha = (o) => sha2562(canonicalString({ frozen: o.frozen.map((c) => ({ args: c.args, expected: c.expected })), heldout: o.heldout.map((c) => ({ args: c.args, expected: c.expected })) }));

// node_modules/rederive/cli/lsp/explain.mjs
var KIND = { FUNCTIONAL: "A pure function: the same input always gives the same output.", STATE: "Changes one of its arguments in place; the tests check the result and the changed argument.", EFFECT: "Talks to the outside world; the tests check the calls it makes, in order." };
var FIDELITY = { package: "Matches the original package exactly, quirks included.", spec: "Follows the cited standard, even where the original package does not." };
var PIN_KIND = { regex: "pattern", charset: "character set", grammar: "grammar", text: "exact text", set: "set", const: "constant", names: "names", number: "number", constant: "constant", chars: "characters", order: "order", map: "mapping", bytes: "bytes" };
var text = (d) => [d.args, ...d.cont].filter(Boolean).join(" ");
var why = (d) => d.attrList.filter(([k]) => k === "CITED" || k === "EARNED").map(([k, v]) => k === "EARNED" ? `added after a failed test (${v})` : v);
var humanRefs = (s) => s.replace(/\bR(\d+)\s*[-–]\s*R?(\d+)\b/g, "rules $1\u2013$2").replace(/\bR(\d+)\b/g, "rule $1");
function explain(primaryText, { langs = [], oracle = null } = {}) {
  const ast = parse(primaryText).ast.filter((d) => d.kind !== "comment");
  const all2 = (n) => ast.filter((d) => d.name === n);
  const one = (n) => all2(n)[0];
  const unit = one("UNIT")?.args ?? "(unnamed)";
  const summary2 = [KIND[one("KIND")?.args], FIDELITY[one("FIDELITY")?.args]].filter(Boolean);
  const anchor = one("ANCHOR");
  if (anchor) summary2.push(`Anchored to ${humanRefs(text(anchor))}.`);
  const sec = (id, title, checked, items) => items.length ? [{ id, title, checked, items }] : [];
  const item = (d, label) => ({ id: d.name === "PINNED" ? "PIN " + d.args.split("=")[0].trim() : d.name, ...label ? { label } : {}, text: humanRefs(d.name === "PINNED" ? d.args.split("=").slice(1).join("=").trim() : text(d)), why: why(d).map(humanRefs), line: d.line });
  const rules = ast.filter((d) => /^R\d+$/.test(d.name));
  const sections = [
    ...sec("what", "What it is for", false, all2("DESCRIPTION").map((d) => item(d))),
    ...sec("inputs", "What it accepts", true, [...all2("SIG").map((d) => item(d, "Signature")), ...all2("ENVELOPE").map((d) => item(d, "Inputs it is verified on")), ...all2("UNGUARDED-PRECONDITION").map((d) => item(d, "Assumes, without checking")), ...all2("OUT-OF-DOMAIN").map((d) => item(d, "Not covered"))]),
    ...sec("rules", "What it does", true, rules.map((d) => item(d, `Rule ${d.name.slice(1)}`))),
    ...sec("pins", "Exact definitions", true, all2("PINNED").map((d) => {
      const [kind2, name] = d.args.split("=")[0].trim().split(/\s+/);
      return { ...item(d), label: `${name} (${PIN_KIND[kind2] ?? kind2})` };
    })),
    ...sec("table", "Decision table", true, all2("TABLE").map((d) => item(d))),
    ...sec("data", "Data it carries", true, all2("CARRIED").map((d) => item(d, d.args.split(/\s+/)[0]))),
    ...sec("deps", "What it depends on", true, all2("DEPENDS-ON").map((d) => ({ ...item(d), text: /^none$/i.test(d.args) ? "Nothing. No other package is involved." : humanRefs(text(d)) }))),
    ...sec("holds", "Should always hold", false, all2("INVARIANT").map((d) => item(d))),
    ...sec("scope", "In and out of scope", false, all2("SCOPE").map((d) => item(d))),
    ...sec("notes", "Background", false, [...all2("NOTE").map((d) => item(d, "Note")), ...all2("RATIONALE").map((d) => item(d, "Why")), ...all2("PROVENANCE").map((d) => item(d, "Where it came from"))])
  ];
  const checks = [];
  if (oracle) checks.push(oracle.status === "ok" ? `${oracle.frozen + oracle.heldout} tests captured from the real package: ${oracle.frozen} the builders could see, ${oracle.heldout} kept hidden from them. The test file's fingerprint matches.` : `The test file does not match this contract (${oracle.status}).`);
  if (langs.length) checks.push(`Written for ${langs.map((l) => `${LANG[l.lang] ?? l.lang} ${l.ok ? "\u2713" : "(out of date)"}`).join(", ")}.`);
  return { unit, summary: summary2, sig: one("SIG") ? text(one("SIG")) : null, checks, sections };
}
var LANG = { js: "JavaScript", ts: "TypeScript", rust: "Rust" };
function wordDiff(a, b) {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/);
  const n = x.length, m = y.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i2 = n - 1; i2 >= 0; i2--) for (let j2 = m - 1; j2 >= 0; j2--) L[i2][j2] = x[i2] === y[j2] ? L[i2 + 1][j2 + 1] + 1 : Math.max(L[i2 + 1][j2], L[i2][j2 + 1]);
  const out = [];
  const push = (op, t) => {
    if (out.length && out.at(-1).op === op) out.at(-1).text += t;
    else out.push({ op, text: t });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      push("=", x[i]);
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) push("-", x[i++]);
    else push("+", y[j++]);
  }
  while (i < n) push("-", x[i++]);
  while (j < m) push("+", y[j++]);
  const merged = [];
  let k = 0;
  while (k < out.length) {
    if (out[k].op === "=") {
      merged.push(out[k++]);
      continue;
    }
    let del = "", ins = "", end = k;
    for (let q = k; q < out.length; q++) {
      const p = out[q];
      if (p.op === "-") {
        del += p.text;
        end = q;
        continue;
      }
      if (p.op === "+") {
        ins += p.text;
        end = q;
        continue;
      }
      const glue = /^\s*$/.test(p.text) || p.text.trim().split(/\s+/).length <= 2 && q + 1 < out.length && out[q + 1].op !== "=";
      if (!glue) break;
      del += p.text;
      ins += p.text;
    }
    if (del) merged.push({ op: "-", text: del });
    if (ins) merged.push({ op: "+", text: ins });
    k = end + 1;
  }
  return merged;
}
function explainDiff(beforeText, afterText, { oracleChanged = null, langs = [] } = {}) {
  const a = explain(beforeText), b = explain(afterText);
  const changes = [];
  const index = (e) => new Map(e.sections.flatMap((s) => s.items.map((it) => [`${s.id}|${it.id}`, { s, it }])));
  const A = index(a), B = index(b);
  for (const [k, { s, it }] of B) {
    const old = A.get(k);
    if (!old) changes.push({ section: s.title, id: it.id, label: it.label ?? s.title, kind: "added", checked: s.checked, text: it.text });
    else if (old.it.text !== it.text || old.it.why.join("|") !== it.why.join("|")) changes.push({ section: s.title, id: it.id, label: it.label ?? s.title, kind: "changed", checked: s.checked, diff: wordDiff(old.it.text, it.text), whyDiff: old.it.why.join("|") !== it.why.join("|") ? wordDiff(old.it.why.join("; "), it.why.join("; ")) : null });
  }
  for (const [k, { s, it }] of A) if (!B.has(k)) changes.push({ section: s.title, id: it.id, label: it.label ?? s.title, kind: "removed", checked: s.checked, text: it.text });
  for (const [f, label] of [["summary", "What kind of unit it is"]]) if (a[f].join(" ") !== b[f].join(" ")) changes.unshift({ section: "Summary", id: f, label, kind: "changed", checked: true, diff: wordDiff(a[f].join(" "), b[f].join(" ")) });
  const warnings = [];
  const behavior = changes.filter((c) => c.checked);
  if (behavior.length && oracleChanged === false) warnings.push({ level: "stop", kind: "untested-change", text: `${behavior.length} tested ${behavior.length === 1 ? "part changed" : "parts changed"} (${[...new Set(behavior.map((c) => c.label))].join(", ")}), but the tests did not. Nothing in this PR proves the new behavior: the hidden tests still expect the old one.` });
  if (/FIDELITY package/.test(beforeText.match(/^FIDELITY\b.*$/m)?.[0] ?? "")) {
    const cited = behavior.map((c) => ({ c, w: [...B.values()].find((v) => v.s.title === c.section && v.it.id === c.id)?.it.why.find((w) => /FIDELITY package|@\d/.test(w)) })).filter((x) => x.w);
    if (cited.length) {
      const q = cited[0].w.replace(/^FIDELITY package — /, "");
      warnings.push({ level: "stop", kind: "citation", text: `This contract promises to match the original package exactly, and ${cited.map((x) => x.c.label).join(" and ")} still ${cited.length > 1 ? "cite" : "cites"} that package as the reason for the old behavior ("${q.length > 110 ? q.slice(0, 109) + "\u2026" : q}"). The edit contradicts its own citation.` });
    }
  }
  if (!behavior.length && changes.length) warnings.push({ level: "ok", kind: "prose-only", text: "Only unchecked prose changed. The code is held to exactly what it was held to before." });
  if (behavior.length && langs.length) warnings.push({ level: "note", kind: "stale-langs", text: `The ${langs.map((l) => LANG[l] ?? l).join(", ")} files were written against the old version. They go out of date until someone reviews them against this one and re-binds them.` });
  return { unit: b.unit, changes, warnings };
}
var NAMES = { 27: "ESC", 7: "BEL", 10: "\\n", 13: "\\r", 9: "\\t", 0: "NUL", 155: "CSI" };
var shown = (tv) => {
  try {
    return display(tv).replace(/\\u00([0-9a-f]{2})|\\u([0-9a-f]{4})/g, (m, a, b) => {
      const c = parseInt(a ?? b, 16);
      return NAMES[c] ? `\u2039${NAMES[c]}\u203A` : m;
    });
  } catch {
    return "?";
  }
};
var same = (x, y) => {
  try {
    return canonicalString(x) === canonicalString(y);
  } catch {
    return JSON.stringify(x) === JSON.stringify(y);
  }
};
function oracleDiff(beforeJson, afterJson) {
  const parse3 = (t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  };
  const a = parse3(beforeJson), b = parse3(afterJson);
  const cases = (o) => new Map(o ? [...(o.frozen ?? []).map((c) => [c.name, { c, hidden: false }]), ...(o.heldout ?? []).map((c) => [c.name, { c, hidden: true }])] : []);
  const A = cases(a), B = cases(b);
  const out = { added: [], removed: [], rewritten: [], inputsChanged: [] };
  for (const [n, { c, hidden }] of B) {
    const old = A.get(n);
    const input2 = (c.args ?? []).map(shown).join(", ");
    if (!old) {
      out.added.push({ name: n, hidden, input: input2, to: shown(c.expected) });
      continue;
    }
    if (!same(old.c.args, c.args)) out.inputsChanged.push({ name: n, hidden, from: (old.c.args ?? []).map(shown).join(", "), to: input2 });
    else if (!same(old.c.expected, c.expected)) out.rewritten.push({ name: n, hidden, input: input2, from: shown(old.c.expected), to: shown(c.expected) });
  }
  for (const [n, { c, hidden }] of A) if (!B.has(n)) out.removed.push({ name: n, hidden, input: (c.args ?? []).map(shown).join(", "), to: shown(c.expected) });
  return out;
}

// node_modules/rederive/cli/sir/legacy-print.mjs
var import_node_crypto3 = require("node:crypto");
var sha2563 = (s) => (0, import_node_crypto3.createHash)("sha256").update(s).digest("hex");
var DIRECTIVES2 = {
  UNIT: "B:lb",
  SIR: "P:legacy",
  KIND: "P:lb",
  FIDELITY: "P:lb",
  VARIANT: "P:legacy",
  ANCHOR: "P:lb",
  SRC: "P:lb",
  TRIGGER: "P:lb",
  REACH: "P:lb",
  "ORACLE-CLASS": "P:lb",
  "TRACE-SEAM": "P:lb",
  SEAM: "P:lb",
  SIG: "B:lb",
  ENVELOPE: "B:lb",
  "DEPENDS-ON": "B:lb",
  DESCRIPTION: "B:pr",
  BEHAVIOR: "P:lb",
  INVARIANT: "P:pr",
  TABLE: "P:lb",
  PINNED: "B:lb",
  EARNED: "B:lb",
  NOTE: "B:pr",
  RATIONALE: "B:pr",
  SCOPE: "P:pr",
  "UNGUARDED-PRECONDITION": "P:lb",
  "OUT-OF-DOMAIN": "P:lb",
  ORACLE: "P:lb",
  PROVENANCE: "B:pr",
  CARRIED: "B:lb",
  SHAPE: "P:lb",
  "CANONICAL-SHA256": "P:lb",
  AUTHORITY: "P:lb",
  "CARRIED-DATA": "P:legacy",
  STATE: "P:lb",
  EMIT: "P:lb",
  REQUEST: "P:lb",
  BRANCH: "P:lb",
  "ON-ERROR": "P:lb",
  PAR: "P:lb",
  RING: "P:lb",
  LIFECYCLE: "P:lb",
  EFFECT: "P:lb",
  SURFACE: "P:lb",
  NOTES: "P:legacy",
  "GUARD-PINNED": "P:legacy",
  LANG: "L:lb",
  "PRIMARY-SHA256": "L:lb",
  ABI: "L:lb",
  MECHANISM: "L:lb"
};
var isDirectiveName2 = (w) => /^(?:[A-Z][A-Z0-9-]*|R\d+)$/.test(w);
var splitTrailingComment2 = (s) => {
  const m = s.match(/^(.*?)(?:^|\s)#(?=\s|$)(.*)$/);
  return m ? [m[1].replace(/\s+$/, ""), m[2].trim()] : [s, null];
};
function parse2(text2, { mode = "legacy" } = {}) {
  const lines = text2.split("\n");
  const ast = [];
  const errors = [], warnings = [];
  const indents = /* @__PURE__ */ new Map();
  let cur = null;
  const attrsOf = (rest) => {
    const attrs = {};
    let body = rest;
    const re = /\s+(CITED|EARNED|ANCHOR)\s+(.+)$/;
    let m;
    while (m = body.match(re)) {
      attrs[m[1]] = (attrs[m[1]] ? attrs[m[1]] + " " : "") + m[2].trim();
      body = body.slice(0, m.index);
    }
    return { body: body.trim(), attrs };
  };
  lines.forEach((raw, i) => {
    const ln = i + 1;
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) return;
    const indent = line.match(/^[ \t]*/)[0];
    if (indent) indents.set(indent.includes("	") ? "tab" : `${indent.length}sp`, (indents.get(indent.includes("	") ? "tab" : `${indent.length}sp`) || 0) + 1);
    const content = line.slice(indent.length);
    if (content.startsWith("#")) {
      if (mode === "strict") errors.push({ line: ln, code: "E_COMMENT", msg: "comments are not part of the grammar; use DESCRIPTION / NOTE / RATIONALE" });
      else {
        warnings.push({ line: ln, code: "W_LEGACY_COMMENT" });
        if (cur) cur.comments.push(content.replace(/^#+\s?/, ""));
        else ast.push({ directive: "#", name: "#", body: content, args: "", attrs: {}, cont: [], comments: [content], line: ln, register: null, kind: "comment" });
      }
      return;
    }
    const [code, trailing] = splitTrailingComment2(content);
    if (trailing !== null) {
      if (mode === "strict") errors.push({ line: ln, code: "E_COMMENT", msg: "trailing comment; make it a CITED/EARNED attribute or a NOTE" });
      else warnings.push({ line: ln, code: "W_LEGACY_TRAILING_COMMENT" });
    }
    if (!indent) {
      let m = code.match(/^(\S+)(?:\s+(.*))?$/);
      let name = m?.[1];
      if (name && /^[A-Z][A-Z0-9-]*:$/.test(name)) {
        name = name.slice(0, -1);
        m = [m[0], name, m[2]];
        if (mode === "strict") errors.push({ line: ln, code: "E_LEGACY_COLON", msg: name });
        else warnings.push({ line: ln, code: "W_LEGACY_COLON", msg: name });
      }
      if (name && isDirectiveName2(name)) {
        const entry = DIRECTIVES2[name] ?? (/^R\d+$/.test(name) ? "P:lb" : null);
        if (!entry) warnings.push({ line: ln, code: "W_UNKNOWN_DIRECTIVE", msg: name });
        const { body: body2, attrs: attrs2 } = attrsOf(m[2] ?? "");
        cur = { directive: name, name, args: body2, attrs: attrs2, cont: [], comments: trailing !== null ? [trailing] : [], line: ln, register: entry ? entry.split(":")[0] : null, kind: entry ? entry.split(":")[1] : "unknown" };
        ast.push(cur);
        return;
      }
      if (cur) {
        cur.cont.push(code);
        if (mode === "strict") errors.push({ line: ln, code: "E_UNINDENTED_CONTINUATION", msg: code.slice(0, 40) });
        else warnings.push({ line: ln, code: "W_UNINDENTED_CONTINUATION" });
      } else errors.push({ line: ln, code: "E_NO_DIRECTIVE", msg: code.slice(0, 40) });
      return;
    }
    if (!cur) {
      errors.push({ line: ln, code: "E_ORPHAN_CONTINUATION", msg: code.slice(0, 40) });
      return;
    }
    const { body, attrs } = attrsOf(code);
    Object.assign(cur.attrs, attrs);
    cur.cont.push(body);
    if (trailing !== null) cur.comments.push(trailing);
  });
  return { ast, errors, warnings, indents: Object.fromEntries(indents) };
}
function print(ast) {
  const out = [];
  for (const d of ast) {
    if (d.kind === "comment") continue;
    const attrs = Object.entries(d.attrs).map(([k, v]) => ` ${k} ${v}`).join("");
    out.push(`${d.name}${d.args ? " " + d.args : ""}${attrs}`);
    for (const c of d.cont) out.push("  " + c);
  }
  return out.join("\n") + "\n";
}
var legacyPrintSha = (text2) => sha2563(print(parse2(text2).ast));

// node_modules/rederive/cli/sir/validate.mjs
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");

// node_modules/rederive/cli/sir/v05.mjs
var import_node_fs = require("node:fs");
var import_node_crypto4 = require("node:crypto");
var import_node_path = require("node:path");

// node_modules/rederive/cli/capabilities.json
var capabilities_default = {
  $comment: [
    "THE CAPABILITY MODEL (docs/SIR_V04_PLAN.md F.1; moved here from sir-toolkit by",
    "SIR_V05_PLAN W.0c) \u2014 the single source of truth for what the toolchain can",
    "actually DO. It lives beside rdv because the claim is the verifier's to make.",
    "Consumers never duplicate it: rdv (what it can verify), sir-factory pack (what",
    "it may stamp, via cli/features.mjs), and the toolkit prompts (what a decomposer",
    "may propose).",
    "",
    "specVersion remains the COARSE gate: an rdv predating this file ignores it and",
    "still halts on a version it doesn't know, which must stay true (plan A6). This",
    "file REFINES that for consumers who understand it \u2014 a bundle is verifiable when",
    "every feature it declares is implemented here, so a partially-built v0.4 is",
    "usable instead of a cliff.",
    "",
    "ADDING A FEATURE HERE IS A CLAIM THAT THE VERIFIER IMPLEMENTS IT. Do not add one",
    "to unblock generation; that inverts the whole point (the version must track what",
    "rdv can check, not what the schema has published).",
    "",
    "`implemented` and `generable` are DIFFERENT claims and gate different things.",
    "`implemented`: rdv can check a unit that uses this. `generable`: a decomposer may",
    "EMIT it, earned only by the Phase 5 gate \u2014 cold re-emitters converge on it from",
    "the SIR alone, with no schema and no prompt fragment. A feature can be verifiable",
    "and still not safely writable, and shipping that pair backwards produces contracts",
    "only their author can read."
  ],
  schemaVersion: "1",
  toolchain: {
    maxSpecVersion: "0.4",
    $languages: "The target languages rdv can HARNESS (SIR_V05_PLAN design move 4: feature flags one level down). A bundle carrying a variant in any other language halts, naming the language. Grows only when a verifier-owned driver ships in rdv (Phase 2) \u2014 never to unblock generation.",
    languages: [
      "js",
      "ts",
      "rust"
    ],
    $toolchains: "What a harnessed language needs on the CONSUMER'S machine. rdv bundles no compiler: a language listed here is harnessed only where its toolchain resolves, and a bundle carrying it halts elsewhere with the hint.",
    toolchains: {
      ts: { resolves: "typescript, plus @types/node for an artifact that imports a Node built-in (from the bundle dir, then the working directory)", hint: "npm i -D typescript @types/node" },
      rust: { resolves: "cargo on PATH", hint: "install Rust: https://rustup.rs" }
    },
    $languageRegistry: "The CLOSED registry of language ids a <unit>.<lang>.sir file or a lang:<id> variant may use (the lab's registry, sir-lab/v05-lang lib/v05.mjs). A suffix outside it is an error, not a new language.",
    languageRegistry: [
      "js",
      "ts",
      "rust",
      "php",
      "csharp",
      "python"
    ]
  },
  features: {
    vectors: {
      since: "0.2",
      sections: [
        "\xA714"
      ],
      implemented: true,
      rungs: [
        "frozen+heldout"
      ],
      detect: "every bundle: the default value-oracle mode",
      summary: "frozen + held-out input/output vectors graded by quorum",
      generable: true,
      generationEvidence: "shipped factory record \u2014 the blind-quorum pipeline has emitted units using this feature since before fragments existed (colors, bcryptjs, request and the @rederive/* catalog); its generability is what the factory's whole history tests"
    },
    "carried-data": {
      since: "0.3",
      sections: [
        "\xA718"
      ],
      implemented: true,
      rungs: [
        "hash+authority"
      ],
      detect: "manifest.carriedData is non-empty",
      summary: "byte-exact constant tables + a re-runnable independent-authority assertion",
      generable: true,
      generationEvidence: "shipped factory record \u2014 the blind-quorum pipeline has emitted units using this feature since before fragments existed (colors, bcryptjs, request and the @rederive/* catalog); its generability is what the factory's whole history tests"
    },
    envelope: {
      since: "0.3",
      sections: [
        "\xA717"
      ],
      implemented: true,
      rungs: [
        "in-scope+boundary"
      ],
      detect: "the SIR declares ENVELOPE",
      summary: "the verified input scope is part of the contract",
      generable: true,
      generationEvidence: "shipped factory record \u2014 the blind-quorum pipeline has emitted units using this feature since before fragments existed (colors, bcryptjs, request and the @rederive/* catalog); its generability is what the factory's whole history tests"
    },
    "trace-seam": {
      since: "0.3",
      sections: [
        "\xA715",
        "\xA716"
      ],
      implemented: true,
      rungs: [
        "ordered-emit+reply"
      ],
      detect: `a unit's oracle mode is "trace"`,
      summary: "effect units verified over an injected boundary the harness owns",
      generable: true,
      generationEvidence: "shipped factory record \u2014 the blind-quorum pipeline has emitted units using this feature since before fragments existed (colors, bcryptjs, request and the @rederive/* catalog); its generability is what the factory's whole history tests"
    },
    scheduler: {
      since: "0.4",
      sections: [
        "\xA720"
      ],
      implemented: true,
      rungs: [
        "virtual-time"
      ],
      detect: "the SIR declares a time.timer / microtask control effect",
      summary: "timers + microtasks on virtual time, resolution order deterministic",
      evidence: "rederive/experiments/v04-phase1-scheduler \u2014 both race branches reachable + replayable (50x each); the real-clock control ran 20/20 one way, never executing the other branch",
      generable: true,
      generationEvidence: "rederive/experiments/v04-phase5-generation \u2014 3/3 cold re-emitters on the first round; two of the three were BYTE-IDENTICAL. All armed one timer per event up front and broke ties by arm order. Controls rejected: a sort arming no timers (right answer, no scheduling) and a reverse-tie unit that passed the distinct-delay case and failed only on ties"
    },
    lifecycle: {
      since: "0.4",
      sections: [
        "\xA721"
      ],
      implemented: true,
      rungs: [
        "armed-fired-cancelled"
      ],
      detect: "the SIR declares a cancellable resource (timer/handle/subscription)",
      summary: "resource lifecycle asserted separately; catches leaks invisible to value+trace",
      evidence: "rederive/experiments/v04-phase2-lifecycle \u2014 adversarial 3-channel proof + @fixture/lifecycle (correct VERIFIED 2/2, leaky FAILED 0/2 on the lifecycle field alone)",
      generable: true,
      generationEvidence: "rederive/experiments/v04-phase5-generation \u2014 3/3 cold re-emitters on the first round; every one cleared the timer on the gate-wins path. Controls rejected on the lifecycle channel while returning the CORRECT value: a leaky unit that never cleared, and a lazy unit that armed only after awaiting"
    },
    "par-interleaving": {
      since: "0.4",
      sections: [
        "\xA719"
      ],
      implemented: true,
      rungs: [
        "differential-sampled",
        "sampled",
        "partial-order-reduction",
        "exhaustive"
      ],
      detect: "the SIR declares PAR over dependent sub-traces, or a concurrency bound",
      summary: "verification over the space of interleavings, with the rung reported honestly",
      evidence: "rederive/experiments/v04-phase3-par + v04-phase0-pmap \u2014 @fixture/par correct VERIFIED 2/2, completion-order-keyed FAILED 0/2; coverage stamped (8 and 54 schedules, exhaustive)",
      generable: true,
      generationEvidence: "rederive/experiments/v04-phase5-generation \u2014 3/3 cold re-emitters built it from the SIR alone (no schema, no fragments), position-keyed across all 4/8/54 exhaustive schedules. Round 1 was 1/3, and the 2 misses were NOT about PAR: all three agreed on the concurrency shape and diverged on whether the gate or the unit computed the mapping. Hardening that one sentence fixed it."
    },
    ring: {
      since: "0.4",
      sections: [
        "\xA722"
      ],
      implemented: true,
      rungs: [
        "deterministic-schedule",
        "refinement-checked",
        "live"
      ],
      detect: "the SIR declares RING",
      summary: "token-coordinated concurrency reduces to a deterministic schedule; checked as a refinement (safety) AND for token loss/duplication (liveness)",
      evidence: "rederive/experiments/v04-phase4-ring \u2014 R_ring subset R_free checked; recognition (preserving) vs imposition (refinement) distinguished; a fake ring caught. @fixture/ring correct VERIFIED 2/2, broken FAILED 0/2 | LIVENESS (Phase 4b): token channel held->passed|released asserts mutual exclusion + return; generic halt detection; @fixture/ring-live sound VERIFIED 1/1, lost and duplicated both FAILED 0/1 on units whose OUTPUT IS CORRECT",
      generable: true,
      generationEvidence: "rederive/experiments/v04-phase5-generation \u2014 3/3 cold re-emitters on the first round, no hardening needed: correct take/pass/release path, one holder at any instant, released exactly once, reduced to a single schedule. RING survived the blind test unaided."
    },
    "lang-variant": {
      since: "0.5",
      sections: [
        "\xA723"
      ],
      implemented: true,
      implementedFor: "the languages in toolchain.languages (js; ts: Phase 2a, cli/lang-ts.mts; rust: Phase 2b, cli/lang/rust.mjs, canonical oracle only). Any other language still halts, by name.",
      rungs: [
        "type-checked",
        "harness-verified",
        "cross-verified"
      ],
      detect: "a per-language SIR file sir/<unit>.<lang>.sir, or a manifest variants key lang:<id>",
      summary: "a unit shipped in a target language: primary <unit>.sir + <unit>.<lang>.sir, graded against the SAME primary oracle through a verifier-owned per-language harness",
      evidence: "sir-lab/v05-lang (Tier A + Tier B, 2026-09-22/23): bytes + slugify VERIFIED js/ts/rust, minimist js/rust; cross-verified 1976-3000/each. Lab-only \u2014 no rdv driver yet",
      generable: false
    },
    "cross-lang-anchor": {
      since: "0.5",
      sections: [
        "\xA712",
        "\xA710"
      ],
      implemented: false,
      rungs: [
        "frozen+heldout"
      ],
      detect: "the SIR declares ANCHOR ref(<lang>:\u2026)",
      summary: "a fidelity variant anchored to a reference implementation in another language, over the language-neutral vector encoding",
      generable: false
    }
  },
  $rungs: {
    $comment: "Verification STRENGTH, weakest first. A bundle records the rung it earned; a feature gates which rungs are AVAILABLE, never whether a unit may ship (plan design move 2).",
    order: [
      "differential-sampled",
      "sampled",
      "partial-order-reduction",
      "exhaustive"
    ]
  }
};

// node_modules/rederive/cli/features.mjs
var languageRegistry = () => new Set(capabilities_default.toolchain.languageRegistry);
var SIR_TAIL = /\.[sS][iI][rR]$/;
var HIDDEN_TAIL = /\.[sS][iI][rR][^\x21-\x7e]+$/;
var langOfPath = (p, where) => {
  const base = p.split(/[\\/]/).pop().replace(/^[ \t]+|[ \t]+$/g, "");
  if (HIDDEN_TAIL.test(base)) throw new Error(`${where}: ${JSON.stringify(p)} is a .sir name followed by invisible or non-ASCII characters`);
  if (!SIR_TAIL.test(base)) return null;
  const parts = base.slice(0, -4).split(".");
  if (parts[0] && !/^[A-Za-z0-9_][A-Za-z0-9_-]*$/.test(parts[0])) throw new Error(`${where}: ${JSON.stringify(p)} \u2014 a unit name is letters, digits, _ and -`);
  if (parts.length > 2) throw new Error(`${where}: ${JSON.stringify(p)} has ${parts.length - 1} dotted segments before .sir \u2014 a unit name has no dots, so a SIR file is <unit>.sir or <unit>.<lang>.sir`);
  if (parts.length === 1) return null;
  if (!parts[1]) throw new Error(`${where}: an empty language segment in ${JSON.stringify(p)}`);
  return parts[1];
};
function languagesOf(input2 = {}) {
  if (input2 === null || typeof input2 !== "object" || Array.isArray(input2)) throw new Error("languagesOf takes a map { sirFiles, variants }");
  const { sirFiles = [], variants } = input2;
  const reg2 = languageRegistry(), langs = /* @__PURE__ */ new Set();
  const add = (id, where) => {
    if (!reg2.has(id)) throw new Error(`${where}: '${id}' is not in the closed language registry (${[...reg2].join(", ")})`);
    langs.add(id);
  };
  if (!Array.isArray(sirFiles)) throw new Error(`sirFiles must be a list of paths (got ${sirFiles === null ? "null" : typeof sirFiles})`);
  for (const f of sirFiles) {
    if (typeof f !== "string") throw new Error(`sirFiles: a path must be text (got ${f === null ? "null" : typeof f})`);
    const l = langOfPath(f, f);
    if (l !== null) add(l, f);
  }
  if (variants !== void 0 && variants !== null) {
    if (typeof variants !== "object" || Array.isArray(variants)) throw new Error("variants must be a map");
    const claimed = /* @__PURE__ */ new Map();
    for (const [k, v] of Object.entries(variants)) {
      if (v === null || typeof v !== "object" || Array.isArray(v)) throw new Error(`variant ${k}: a variant is a map`);
      if (v.lang !== void 0 && typeof v.lang !== "string") throw new Error(`variant ${k}: lang must be text`);
      if (typeof v.sir === "string") langOfPath(v.sir, `variant ${k} sir`);
      if (v.sir !== void 0 && (typeof v.sir !== "string" || !/\.[sS][iI][rR]$/.test(v.sir.split(/[\\/]/).pop().replace(/^[ \t]+|[ \t]+$/g, "")))) throw new Error(`variant ${k}: sir must be a path to a .sir file (got ${JSON.stringify(v.sir)})`);
      if (k !== "package" && !/^lang:[a-z][a-z0-9]*$/.test(k)) throw new Error(`variant ${k}: a variant key is 'package' or 'lang:<id>'`);
      const keyLang = k.startsWith("lang:") ? k.slice(5) : null, ownLang = v.lang ?? null, pathLang = v.sir !== void 0 ? langOfPath(v.sir, `variant ${k} sir`) : null;
      const named = [keyLang, ownLang, pathLang].filter((x) => x !== null);
      if (new Set(named).size > 1) throw new Error(`variant ${k}: its key, lang field and sir path name different languages (${named.join(", ")})`);
      if ((keyLang !== null || ownLang !== null) && v.sir !== void 0 && pathLang === null) throw new Error(`variant ${k}: its sir path ${JSON.stringify(v.sir)} names no language`);
      if (!named.length) continue;
      const l = named[0];
      add(l, `variant ${k}`);
      if (claimed.has(l)) throw new Error(`variants ${claimed.get(l)} and ${k} both claim language '${l}'`);
      claimed.set(l, k);
    }
  }
  return new Set([...langs].sort());
}
var VERSION = /^(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*))*$/;
var isVersion = (v) => typeof v === "string" && VERSION.test(v);
var show = (x) => {
  if (typeof x === "string") return JSON.stringify(x);
  try {
    return String(x);
  } catch {
    return typeof x;
  }
};
function detectFeatures({ sirText = "", carriedData, envelope, mode, sirFiles, variants } = {}) {
  if (typeof sirText !== "string") throw new Error("sirText must be text");
  if (carriedData !== void 0 && carriedData !== null && !Array.isArray(carriedData)) throw new Error("carriedData must be a list");
  if (envelope !== void 0 && envelope !== null && typeof envelope !== "string") throw new Error("envelope must be text");
  const reg2 = languageRegistry();
  const ds = parse(sirText).ast.filter((d) => d.kind !== "comment");
  const has = (name) => ds.some((d) => d.name === name);
  const argsOf = (name) => ds.filter((d) => d.name === name).map((d) => [d.args, ...d.cont].join(" "));
  const trimWS2 = (x) => x.replace(/^[ \t]+|[ \t]+$/g, "");
  const unquote = (l) => {
    let out = "", at2 = 0;
    for (const [a, b] of quotedSpans(l)) {
      out += l.slice(at2, a) + '""';
      at2 = b;
    }
    return out + l.slice(at2);
  };
  const piecesOf = (d) => [d.args, ...d.cont, ...(d.attrList ?? []).filter(([k]) => k === "ANCHOR").map(([, v]) => v)];
  const anchorTexts = (d) => d.name === "ANCHOR" ? piecesOf(d) : (d.name === "FIDELITY" || d.name === "VARIANT") && d.attrs?.ANCHOR !== void 0 ? [d.attrs.ANCHOR] : [];
  const anchorsCrossLang = ds.some((d) => anchorTexts(d).map(unquote).some((a) => [...a.matchAll(/\bref\([ \t]*([a-z][a-z0-9]*):/g)].some((m) => reg2.has(m[1]))));
  const f = /* @__PURE__ */ new Set(["vectors"]);
  if ((carriedData?.length ?? 0) > 0 || has("CARRIED") || ds.filter((d) => d.name === "CARRIED-DATA").some((d) => [[d.args, ...d.cont].join(" "), ...(d.attrList ?? []).map(([, v]) => v)].some((a) => trimWS2(a) && trimWS2(a) !== "none"))) f.add("carried-data");
  if (trimWS2(envelope ?? "") || has("ENVELOPE")) f.add("envelope");
  if (mode === "trace" || has("TRACE-SEAM") || argsOf("ORACLE-CLASS").some((a) => /^trace(?![A-Za-z0-9_])/.test(trimWS2(a)))) f.add("trace-seam");
  if (mode === "par" || has("PAR")) f.add("par-interleaving");
  if (mode === "ring" || has("RING")) f.add("ring");
  const body = sirLines(sirText).filter((l) => !/^[ \t]*#/.test(l)).map((l) => splitAttributes(" " + unquote(l)).body).join("\n");
  if (has("LIFECYCLE") || /\bsetTimer\b/.test(body)) f.add("lifecycle");
  if (argsOf("EFFECT").some((a) => /\btime\.timer\b|\bmicrotask\b/.test(unquote(a))) || /\bschedule\(|\bvirtual time\b|\btimers\./.test(body)) f.add("scheduler");
  if (languagesOf({ sirFiles: sirFiles ?? [], variants }).size) f.add("lang-variant");
  if (anchorsCrossLang) f.add("cross-lang-anchor");
  return [...f];
}
function checkCapabilities(c) {
  const bad = (m) => {
    throw new Error(`cli/capabilities.json: ${m}`);
  };
  const isMap = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  const textList = (x) => Array.isArray(x) && x.every((s) => typeof s === "string" && s);
  if (!isMap(c) || !isMap(c.toolchain) || !isMap(c.features)) bad("toolchain and features must be maps");
  const t = c.toolchain;
  if (!isVersion(t.maxSpecVersion)) bad(`toolchain.maxSpecVersion ${show(t.maxSpecVersion)} is not a version`);
  if (!textList(t.languageRegistry)) bad("toolchain.languageRegistry must be a list of ids");
  if (!textList(t.languages)) bad("toolchain.languages must be a list of ids");
  for (const l of t.languages) if (!t.languageRegistry.includes(l)) bad(`toolchain.languages names '${l}', which is not in languageRegistry`);
  if (t.toolchains !== void 0) {
    if (!isMap(t.toolchains)) bad("toolchain.toolchains must be a map");
    for (const [l, v] of Object.entries(t.toolchains)) if (!t.languages.includes(l) || !isMap(v) || typeof v.hint !== "string") bad(`toolchain.toolchains.${l} must be a harnessed language with a text hint`);
  }
  for (const [name, f] of Object.entries(c.features)) {
    if (!isMap(f)) bad(`feature ${name} must be a map`);
    if (!isVersion(f.since)) bad(`feature ${name}: since ${show(f.since)} is not a version`);
    if (typeof f.implemented !== "boolean" || typeof f.generable !== "boolean") bad(`feature ${name}: implemented and generable must be booleans`);
    if (!textList(f.rungs) || !f.rungs.length) bad(`feature ${name}: rungs must be a non-empty list`);
  }
  return c;
}
checkCapabilities(capabilities_default);

// node_modules/rederive/cli/sir/v05.mjs
var LANGS = languageRegistry();
var sha2564 = (buf) => (0, import_node_crypto4.createHash)("sha256").update(buf).digest("hex");
var directive = (text2, name) => {
  if (typeof name !== "string" || !/^(?:[A-Z][A-Z0-9-]*|R[0-9]+)$/.test(name)) throw new Error(`not a directive name: ${JSON.stringify(name)}`);
  if (ATTR_ONLY.has(name)) throw new Error(`${name} is an attribute, never a directive: read it from a directive's attrs`);
  const d = get(parse(text2).ast, name);
  return d ? [d.args, ...d.cont].filter(Boolean).join(" ") : null;
};
function family(sirDir, unit) {
  const primaryPath = (0, import_node_path.join)(sirDir, `${unit}.sir`);
  if (!(0, import_node_fs.existsSync)(primaryPath)) throw new Error(`no primary: ${primaryPath}`);
  const primaryBytes = (0, import_node_fs.readFileSync)(primaryPath);
  const primary = primaryBytes.toString("utf8");
  const primarySha = canonicalSha(primary);
  const legacySha = legacyPrintSha(primary);
  const langs = {}, errors = [], warnings = [];
  for (const f of (0, import_node_fs.readdirSync)(sirDir).sort()) {
    const m = f.match(/^(.+?)\.([^.]+)\.sir$/);
    if (!m || m[1] !== unit) continue;
    const lang = m[2];
    if (!LANGS.has(lang)) {
      errors.push(`${f}: '${lang}' is not in the closed language registry ${[...LANGS].join(",")}`);
      continue;
    }
    const bytes = (0, import_node_fs.readFileSync)((0, import_node_path.join)(sirDir, f));
    const text2 = bytes.toString("utf8");
    const bound = text2.match(/^PRIMARY-SHA256\s+([0-9a-f]{64})/m)?.[1] ?? null;
    const declared = directive(text2, "LANG");
    const legacyBinding = bound !== null && bound !== primarySha && bound === legacySha;
    const entry = { lang, path: (0, import_node_path.join)(sirDir, f), text: text2, sha: sha2564(bytes), bound, stale: bound !== primarySha && !legacyBinding, legacyBinding, declared };
    if (!bound) errors.push(`${f}: no PRIMARY-SHA256 binding`);
    else if (legacyBinding) errors.push(`${f}: LEGACY BINDING \u2014 bound to the pre-2026-10-26 print hash, which does not cover every character of the primary (an edit there after binding is invisible to it); re-bind it`);
    else if (entry.stale) errors.push(`${f}: STALE \u2014 bound to ${bound.slice(0, 12)}\u2026, primary is ${primarySha.slice(0, 12)}\u2026 (declared, not a claim)`);
    if (declared !== lang) errors.push(`${f}: LANG ${declared} \u2260 filename language ${lang}`);
    langs[lang] = entry;
  }
  return { unit, primaryPath, primary, primarySha, langs, errors, warnings, features: featuresOf(langs) };
}
function featuresOf(langs) {
  return detectFeatures({ sirFiles: Object.values(langs).map((e) => e.path) });
}
var CODE_SHAPES = [
  [/\btypeof\b/, "typeof"],
  [/=>/, "arrow fn"],
  [/\.(match|reduce|slice|test|exec|split|map|filter)\(/, "method call"],
  [/\b(parseInt|parseFloat|Number|String|Math)\s*[.(]/, "JS builtin"],
  [/\bif\s*\(/, "if ("],
  [/\breturn\b/, "return"],
  [/\bfor\s+\w+\s+in\b|\bfor\s*\(|\bwhile\s*\(/, "loop"],
  [/^\s*#?\s*(STEP|NODE|BRANCH|GATE)\s+[\w-]+/i, "STEP/NODE/BRANCH narration"],
  [/\w\[\w+\]\s*(?:\*\*|<<|>>>?|&&|\|\||\?\?|[-+*\/%&|^])?=(?![=>])/, "indexed assignment"],
  [/\/\^.*\$\/[a-z]*/, "dialect regex literal"],
  [/\b(null|undefined)\b/, "JS value name (say none)"],
  // NaN / ±Infinity / -0 are IEEE-754 value names, not code shapes; indexed assignment includes the compound forms (`a[i] += 1`, `a[i] ||= x`), never `x[0] => y` (#68)
  [/[A-Za-z_]\w*\s*=\s*[^=\s].*;\s*$/, "assignment statement"],
  [/\bgroup\d\b/, "capture-group reference"]
];
function transcriptionLint(primaryText) {
  const lines = sirLines(primaryText);
  const hits = [];
  lines.forEach((l, i) => {
    for (const [re, what] of CODE_SHAPES) if (re.test(stripQuoted(l))) hits.push({ line: i + 1, what, text: cut96(l.trim()) });
  });
  const nonEmpty = lines.filter((l) => l.trim()).length;
  const commentLines = lines.filter((l) => l.trim().startsWith("#")).length;
  const hitLines = new Set(hits.map((h) => h.line)).size;
  return { hits, hitLines, lines: nonEmpty, commentLines, density: nonEmpty ? hitLines / nonEmpty : 0 };
}
var DIALECT = [
  [/\/\^.*\$\/[gimsuy]*/, "anchored regex literal"],
  [/\\[wsdWSDbB]\b/, "regex class escape"],
  [/\\p\{/, "regex property escape"],
  [/\b(?:Math\.\w+|String\.prototype|parseInt|parseFloat|BigInt)\b|\b(?:Number|String|Boolean|BigInt)\(|(?:\.|\b)(?:toLowerCase|toUpperCase|charCodeAt|codePointAt|localeCompare|normalize|padStart|padEnd)\(/, "JS API name"],
  [/\b(?:JSON|Object|Array|Reflect|Symbol|Intl|Number|String|BigInt|Boolean|Date|RegExp|Promise)\.[A-Za-z]\w*/, "JS API name"],
  // a member, either case (Number.isFinite, String.fromCharCode, Object.Keys); a sentence's "a String." has no member
  [/\bfancy[-_]regex\b|\b(?:f64|u8|u64|i64|usize|String|Vec|char|str|Box|HashMap|BTreeMap)::|\bOption<|\bVec<|&str\b|\bto_lowercase\b/, "Rust API name"],
  [/\b(?:new)?line[- ]?terminator/i, "line-terminator mechanism"],
  [/\b(null|undefined)\b/, "JS value name (say none)"]
  // NaN / ±Infinity / -0 are IEEE-754 value names, not leaks
];
var stripQuoted = (l) => {
  let out = "", at2 = 0;
  for (const [a, b] of quotedSpans(l)) {
    out += l.slice(at2, a) + '""';
    at2 = b;
  }
  return out + l.slice(at2);
};
var cut96 = (x) => Array.from(x).slice(0, 96).join("");
function leakLint(text2, { isPrimary }) {
  const hits = [];
  const seen = /* @__PURE__ */ new Set();
  const hit = (line, what, raw) => {
    const k = `${line}\0${what}`;
    if (!seen.has(k)) {
      seen.add(k);
      hits.push({ line, what, text: cut96(raw.replace(/^[ \t]+/, "")) });
    }
  };
  const lines = sirLines(text2);
  if (isPrimary) lines.forEach((raw, i) => {
    const indent = raw.match(/^[ \t]*/)[0];
    const content = raw.slice(indent.length);
    if (!content) return;
    let segs;
    if (content.startsWith("#")) segs = [content.replace(/^#+/, "")];
    else {
      let [code, comment] = splitTrailingComment(content);
      if (!indent) {
        const sp = code.search(/[ \t]/);
        const name = (sp < 0 ? code : code.slice(0, sp)).replace(/:$/, "");
        if (isDirectiveName(name) && !ATTR_ONLY.has(name)) code = sp < 0 ? "" : code.slice(sp);
      }
      segs = [splitAttributes(" " + code).body, ...comment !== null ? [comment] : []];
    }
    for (const seg of segs) {
      const c = stripQuoted(seg);
      for (const [re, what] of DIALECT) if (re.test(c)) hit(i + 1, what, raw);
    }
  });
  else {
    for (const d of parse(text2).ast) if (d.register === "P") hit(d.line, "behavior in a language file", lines[d.line - 1]);
    lines.forEach((raw, i) => {
      if (/^[ \t]/.test(raw)) return;
      const lead = raw.match(INVISIBLE_LEAD)?.[0] ?? "";
      const g = glued(raw.slice(lead.length).split(/[ \t]/)[0]) ?? (lead ? raw.slice(lead.length).match(/^(?:[A-Z][A-Z0-9-]*|R\d+)/)?.[0] : null);
      if (g && (DIRECTIVES[g] ?? (/^R\d+$/.test(g) ? "P:lb" : "")).startsWith("P:")) hit(i + 1, "behavior in a language file", raw);
    });
    hits.sort((x, y) => x.line - y.line);
  }
  return { hits };
}
var visible = (v) => typeof v === "string" && /[^\s\p{Cf}"']/u.test(v);
var pinCited = (d) => d.attrList.some(([, v]) => visible(v)) || d.name === "EARNED" && [d.args, ...d.cont].some(visible);
function pinLint(text2) {
  const { ast } = parse(text2);
  const lines = sirLines(text2);
  const hits = [];
  let pins = 0;
  for (const d of ast) {
    if (d.name !== "PINNED" && d.name !== "EARNED") continue;
    pins++;
    const cited = pinCited(d);
    if (!cited) hits.push({ line: d.line, what: "pin without a citation", text: cut96(lines[d.line - 1].replace(/^[ \t]+/, "")) });
  }
  return { hits, pins };
}
function lintFamily(fam, { maxDensity = 0.1 } = {}) {
  const t = transcriptionLint(fam.primary);
  const leakP = leakLint(fam.primary, { isPrimary: true });
  const pinP = pinLint(fam.primary);
  const per = {};
  for (const [lang, e] of Object.entries(fam.langs)) per[lang] = { leak: leakLint(e.text, { isPrimary: false }), pin: pinLint(e.text), stale: e.stale };
  let decl = null, declErr = null;
  try {
    decl = carriedDeclared(fam.primary);
  } catch (e) {
    declErr = e.message;
  }
  const schemaHits = [
    ...schemaLint(fam.primary, decl?.name).hits.map((h) => ({ ...h, where: "primary" })),
    ...Object.entries(fam.langs).flatMap(([lang, e]) => schemaLint(e.text, decl?.name).hits.map((h) => ({ ...h, where: lang })))
  ];
  const problems = [
    ...fam.errors,
    ...declErr ? [`primary: carried data: ${declErr}`] : [],
    ...schemaHits.map((h) => `${h.where}:${h.line} ${h.what}: ${h.text}`),
    ...t.density > maxDensity ? [`primary: transcription density ${(t.density * 100).toFixed(0)}% > ${maxDensity * 100}% (${t.hitLines} code-shaped lines)`] : [],
    ...leakP.hits.map((h) => `primary:${h.line} language leak \u2014 ${h.what}: ${h.text}`),
    ...pinP.hits.map((h) => `primary:${h.line} ${h.what}: ${h.text}`),
    ...Object.entries(per).flatMap(([lang, r]) => [
      ...r.leak.hits.map((h) => `${lang}:${h.line} ${h.what}: ${h.text}`),
      ...r.pin.hits.map((h) => `${lang}:${h.line} ${h.what}: ${h.text}`)
    ])
  ];
  return { ok: problems.length === 0, problems, transcription: t, leakPrimary: leakP, pinsPrimary: pinP, per, features: fam.features, carried: decl };
}
function carriedDeclared(primaryText) {
  const ast = parse(primaryText).ast;
  const all2 = ast.filter((d2) => d2.name === "CARRIED");
  if (!all2.length) return null;
  const stray = ast.find((d2) => ["CANONICAL-SHA256", "SHAPE", "AUTHORITY"].includes(d2.name));
  if (stray) throw new Error(`CARRIED: ${stray.name} at line ${stray.line} is not indented under CARRIED`);
  if (all2.length > 1) throw new Error(`one CARRIED table per primary (lines ${all2.map((d2) => d2.line).join(", ")})`);
  const d = all2[0];
  const head = d.args.match(/^([A-Za-z_][A-Za-z0-9_]*)[ \t]+FROM[ \t]+(.+)$/);
  if (!head) throw new Error(`CARRIED must read \`CARRIED <name> FROM <source>\` (line ${d.line})`);
  let sha = null, shape = null;
  const assertions = [];
  const trimWS2 = (x) => x.replace(/^[ \t]+|[ \t]+$/g, "");
  for (const c of d.cont) {
    if (!/^(?:CANONICAL-SHA256|SHAPE|AUTHORITY)(?![A-Z0-9-])/.test(c)) continue;
    const k = c.match(/^(CANONICAL-SHA256|SHAPE|AUTHORITY)(?:[ \t]+([^]*))?$/);
    if (!k) throw new Error(`CARRIED: a malformed sub-field line ${JSON.stringify(c.slice(0, 60))} (the keyword, a space or tab, then its value)`);
    const v = k[2] ?? "";
    if (k[1] === "CANONICAL-SHA256") {
      if (sha !== null) throw new Error("CARRIED: two CANONICAL-SHA256 lines");
      if (!/^[0-9a-f]{64}$/.test(v)) throw new Error(`CARRIED: CANONICAL-SHA256 must be 64 lowercase hex (got ${JSON.stringify(v)})`);
      sha = v;
    } else if (k[1] === "SHAPE") {
      if (shape !== null) throw new Error("CARRIED: two SHAPE lines");
      if (!trimWS2(v)) throw new Error("CARRIED: an empty SHAPE");
      shape = trimWS2(v);
    } else {
      const a = v.match(/^\{[ \t]*expr:[ \t]*("(?:\\[^]|[^"\\])*")[ \t]*,[ \t]*equals:[ \t]*([^]+?)[ \t]*\}$/);
      if (!a) throw new Error(`CARRIED: AUTHORITY must read { expr: "<key>", equals: <json> } (got ${JSON.stringify(v.slice(0, 60))})`);
      let expr, equals;
      try {
        expr = JSON.parse(a[1]);
        equals = JSON.parse(a[2]);
      } catch (e) {
        throw new Error(`CARRIED: AUTHORITY ${JSON.stringify(v.slice(0, 60))} is not JSON: ${e.message}`);
      }
      const lits = a[2].replace(/"(?:\\.|[^"\\])*"/g, '""').match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? [];
      for (const n of lits) {
        const x = Number(n);
        if (!Number.isFinite(x) || Math.abs(x) > 2 ** 53 || x === 0 && /[1-9]/.test(n.replace(/[eE].*$/, "")) || /^-?\d+$/.test(n) && BigInt(n) !== BigInt(x)) throw new Error(`CARRIED: AUTHORITY equals ${n} has no exact JSON number`);
      }
      if (!/[^\s\p{Cf}]/u.test(expr)) throw new Error("CARRIED: AUTHORITY expr is empty");
      assertions.push({ expr, equals });
    }
  }
  return { name: head[1], from: trimWS2(head[2]), sha, shape, assertions };
}
function carriedBinding(langText) {
  const m = langText.match(/^CARRIED\s+(\w+)\s*=\s*(\S+)/m);
  return m ? { name: m[1], module: m[2] } : null;
}
function carriedTable(lang, filePath, decl = null) {
  const src = (0, import_node_fs.readFileSync)(filePath, "utf8");
  if (lang === "rust") return rustCarriedTable(src, filePath, typeof decl === "string" ? decl : decl?.shape ?? null);
  return JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
}
var RUST_CHAR = /^'(?:\\(?:u\{[0-9a-fA-F_]{1,8}\}|x[0-9a-fA-F]{2}|[nrt0\\'"])|[^'\\])'/u;
var RUST_NUM = /^(?:0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)(?:_?(?:[ui](?:8|16|32|64|128|size)|f32|f64))?/;
var rustNumber = (lit) => {
  const s = lit.replace(/_/g, "");
  const body = s.replace(/^0x/.test(s) ? /[ui](?:8|16|32|64|128|size)$/ : /(?:[ui](?:8|16|32|64|128|size)|f32|f64)$/, "");
  const n = Number(body);
  const inexact = /^(?:0x[0-9a-fA-F]+|0o[0-7]+|0b[01]+|\d+)$/.test(body) ? !Number.isFinite(n) || BigInt(body) !== BigInt(n) : !Number.isFinite(n);
  if (/f32$/.test(s) && !/^0x/.test(s)) {
    const f = Math.fround(n);
    return { n: f, inexact: inexact || f !== n };
  }
  return { n, inexact };
};
function rustUnescape(s, file, at2) {
  let out = "";
  for (let j = 0; j < s.length; ) {
    const c = s[j];
    if (c !== "\\") {
      out += c;
      j++;
      continue;
    }
    const d = s[j + 1];
    if (d === "n") {
      out += "\n";
      j += 2;
    } else if (d === "r") {
      out += "\r";
      j += 2;
    } else if (d === "t") {
      out += "	";
      j += 2;
    } else if (d === "0") {
      out += "\0";
      j += 2;
    } else if (d === "\\" || d === '"' || d === "'") {
      out += d;
      j += 2;
    } else if (d === "x") {
      out += String.fromCharCode(parseInt(s.slice(j + 2, j + 4), 16));
      j += 4;
    } else if (d === "u" && s[j + 2] === "{") {
      const e = s.indexOf("}", j + 3);
      const cp = parseInt(s.slice(j + 3, e).replace(/_/g, ""), 16);
      if (e < 0 || !Number.isFinite(cp)) throw new Error(`${file}:${at2} bad \\u{\u2026} escape in string literal`);
      out += String.fromCodePoint(cp);
      j = e + 1;
    } else if (d === "\n" || d === "\r") {
      j += 2;
      while (j < s.length && /[ \t\r\n]/.test(s[j])) j++;
    } else throw new Error(`${file}:${at2} unknown escape \\${d} in string literal`);
  }
  return out;
}
function rustTokens(src, file = "rust") {
  const toks = [];
  const n = src.length;
  let i = 0, line = 1;
  const push = (t, v) => toks.push({ t, v, line });
  const advance = (to) => {
    for (let k = i; k < to; k++) if (src[k] === "\n") line++;
    i = to;
  };
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "	" || c === "\r" || c === "\n") {
      advance(i + 1);
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      const e = src.indexOf("\n", i);
      advance(e < 0 ? n : e);
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let d = 1, j = i + 2;
      while (j < n && d) {
        if (src.startsWith("/*", j)) {
          d++;
          j += 2;
        } else if (src.startsWith("*/", j)) {
          d--;
          j += 2;
        } else j++;
      }
      advance(j);
      continue;
    }
    const raw = /^b?r(#*)"/.exec(src.slice(i, i + 32));
    if (raw) {
      const start = i + raw[0].length, close = '"' + raw[1], e = src.indexOf(close, start);
      if (e < 0) throw new Error(`${file}:${line} unterminated raw string`);
      push("str", src.slice(start, e));
      advance(e + close.length);
      continue;
    }
    if (c === '"' || c === "b" && src[i + 1] === '"') {
      let j = i + (c === "b" ? 2 : 1);
      const start = j;
      while (j < n && src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
      if (j >= n) throw new Error(`${file}:${line} unterminated string literal`);
      push("str", rustUnescape(src.slice(start, j), file, line));
      advance(j + 1);
      continue;
    }
    if (c === "'") {
      const m = RUST_CHAR.exec(src.slice(i, i + 16));
      if (m) {
        push("chr", rustUnescape(m[0].slice(1, -1), file, line));
        advance(i + m[0].length);
      } else {
        push("p", "'");
        advance(i + 1);
      }
      continue;
    }
    if (c >= "0" && c <= "9") {
      const m = RUST_NUM.exec(src.slice(i, i + 64));
      const r = rustNumber(m[0]);
      toks.push({ t: "num", v: r.n, inexact: r.inexact, lit: m[0], line });
      advance(i + m[0].length);
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      const w = src.slice(i, j);
      if (w === "true" || w === "false") push("bool", w === "true");
      else push("id", w);
      advance(j);
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === "=>" || two === "->" || two === "::" || two === "..") {
      push("p", two);
      advance(i + 2);
      continue;
    }
    push("p", c);
    advance(i + 1);
  }
  return toks;
}
var isP = (t, v) => t?.t === "p" && t.v === v;
var INT_RANGE = { u8: [0, 255], u16: [0, 65535], u32: [0, 4294967295], i8: [-128, 127], i16: [-32768, 32767], i32: [-2147483648, 2147483647] };
var castOf = (toks, i, v) => {
  if (!(toks[i]?.t === "id" && toks[i].v === "as")) return { v, next: i };
  const ty = toks[i + 1]?.t === "id" ? toks[i + 1].v : null;
  const where = `rust carried table: line ${toks[i].line}: \`${v} as ${ty}\``;
  if (ty === "f64" || ty === "f32") {
    if (ty === "f32" && Math.fround(v) !== v) throw new Error(`${where} changes the value`);
    return { v, next: i + 2 };
  }
  const r = INT_RANGE[ty] ?? (/^(?:u64|usize|u128)$/.test(ty) ? [0, 2 ** 53] : /^(?:i64|isize|i128)$/.test(ty) ? [-(2 ** 53), 2 ** 53] : null);
  if (!r) throw new Error(`${where} is not a numeric cast this reader applies`);
  if (!Number.isInteger(v) || v < r[0] || v > r[1]) throw new Error(`${where} changes the value \u2014 write the value itself`);
  return { v: v === 0 ? 0 : v, next: i + 2 };
};
var exact = (t) => {
  if (t.inexact) throw new Error(`rust carried table: line ${t.line}: ${t.lit} has no exact JSON number`);
  return t.v;
};
function rustValue(toks, i) {
  const t = toks[i];
  if (!t) return null;
  if (isP(t, "&")) return rustValue(toks, i + 1);
  if (t.t === "str" || t.t === "chr" || t.t === "bool") return { v: t.v, next: i + 1 };
  if (t.t === "num") return castOf(toks, i + 1, exact(t));
  if (isP(t, "-") && toks[i + 1]?.t === "num") return castOf(toks, i + 2, -exact(toks[i + 1]));
  if (t.t === "id" && t.v === "None") return { v: null, next: i + 1 };
  if (t.t === "id" && t.v === "Some" && isP(toks[i + 1], "(")) {
    if (toks[i + 2]?.t === "id" && (toks[i + 2].v === "Some" || toks[i + 2].v === "None")) throw new Error(`rust carried table: line ${t.line}: a nested Option is not read (Some(None) and None are one json value)`);
    const r = rustValue(toks, i + 2);
    return r && isP(toks[r.next], ")") ? { v: r.v, next: r.next + 1 } : null;
  }
  if (isP(t, "[") || isP(t, "(")) {
    const close = t.v === "[" ? "]" : ")";
    const items = [];
    let j = i + 1, comma = false;
    for (; ; ) {
      if (isP(toks[j], close)) {
        j++;
        break;
      }
      const r = rustValue(toks, j);
      if (!r) return null;
      items.push(r.v);
      j = r.next;
      if (isP(toks[j], ",")) {
        comma = true;
        j++;
      } else if (!isP(toks[j], close)) return null;
    }
    return { v: t.v === "(" && items.length === 1 && !comma ? items[0] : items, next: j };
  }
  return null;
}
function rustEntries(toks) {
  const tuples = [], arms = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (isP(t, "(") && toks[i + 1]?.t === "str" && isP(toks[i + 2], ",")) {
      const r = rustValue(toks, i + 3);
      if (r && isP(toks[r.next], ")")) {
        tuples.push([toks[i + 1].v, r.v, toks[i + 1].line]);
        i = r.next;
        continue;
      }
      if (!r) throw new Error(`rust carried table: line ${toks[i + 1].line}: the value of entry ${JSON.stringify(toks[i + 1].v)} is not one this reader reads \u2014 it would be dropped (#121)`);
    }
    if (t.t === "str" && isP(toks[i + 1], "|") && toks[i + 2]?.t === "str") throw new Error(`rust carried table: line ${t.line}: an or-pattern arm ("a" | "b" => v) is not read \u2014 one key per arm`);
    if (t.t === "str" && isP(toks[i + 1], "=>")) {
      const r = rustValue(toks, i + 2);
      if (r && (isP(toks[r.next], ",") || isP(toks[r.next], "}"))) {
        arms.push([t.v, r.v, t.line]);
        i = r.next - 1;
        continue;
      }
      throw new Error(`rust carried table: line ${t.line}: the arm ${JSON.stringify(t.v)} => \u2026 has a value this reader does not read \u2014 it would be dropped (#121)`);
    }
  }
  return tuples.length ? { entries: tuples, form: "tuple" } : { entries: arms, form: "match-arm" };
}
function carriedShapeType(shape) {
  const WS = "[ \\t\\r\\n]";
  const trim = (s) => s.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
  const norm = (s) => {
    s = trim(s);
    const m = s.match(new RegExp(`^map${WS}+(.+?)${WS}*->${WS}*(.+)$`, "s"));
    return m ? `map[${norm(m[1])}, ${norm(m[2])}]` : s;
  };
  const width = (s) => s.replace(new RegExp(`(^|[[,|:]${WS}*)([ui])(8|16|32)(?=${WS}*(?:[\\],|]|$))`, "g"), (_, pre, sign) => `${pre}${sign}64`);
  return parseType(width(norm(shape.split(";")[0])));
}
var typeText = (t) => t.k === "union" ? t.alts.map(typeText).join(" | ") : t.k === "tuple" ? `tuple[${t.items.map(typeText).join(", ")}]` : t.k === "list" ? `list[${typeText(t.item)}]` : t.k === "map" ? `map[${typeText(t.key)}, ${typeText(t.val)}]` : t.k === "record" ? `record[${t.fields.map(([n, f]) => `${n}: ${typeText(f)}`).join(", ")}]` : t.k;
function rustCarriedTable(src, file, shape = null) {
  const { entries, form } = rustEntries(rustTokens(src, file));
  if (!entries.length) throw new Error(`${file}: no carried entries found \u2014 expected a Rust table of ("key", value) tuples (&[(k, v), \u2026], [(k, v); N], vec![\u2026], HashMap::from([\u2026])) or "key" => value arms (phf_map! / match); string-literal keys, values a string / number / bool or a [..] / (..) of those`);
  let type = null;
  if (shape) {
    type = carriedShapeType(shape);
    if (type.k !== "map") throw new Error(`${file}: declared SHAPE '${shape.split(";")[0].trim()}' is not a map \u2014 a Rust (key, value) table can only realize map[K, V]`);
  }
  const table2 = {};
  for (const [k, v, line] of entries) {
    if (type) {
      try {
        encode(k, type.key);
      } catch (e) {
        throw new Error(`${file}:${line} key ${JSON.stringify(k)} does not fit the declared SHAPE key type ${typeText(type.key)}: ${e.message}`);
      }
      try {
        encode(v, type.val);
      } catch (e) {
        throw new Error(`${file}:${line} entry ${JSON.stringify(k)} has value ${JSON.stringify(v)} which does not fit the declared SHAPE value type ${typeText(type.val)}: ${e.message} (${form} form, ${entries.length} entries parsed)`);
      }
    }
    const same2 = (x, y) => Object.is(x, y) || typeof x === "object" && x !== null && JSON.stringify(x) === JSON.stringify(y);
    if (Object.hasOwn(table2, k) && !same2(table2[k], v)) throw new Error(`${file}:${line} duplicate key ${JSON.stringify(k)} with a different value (${JSON.stringify(table2[k])} then ${JSON.stringify(v)}) \u2014 the table is ambiguous`);
    Object.defineProperty(table2, k, { value: v, enumerable: true, writable: true, configurable: true });
  }
  return table2;
}
var plainMap = (x) => x !== null && typeof x === "object" && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
function canonical(t) {
  if (!plainMap(t)) throw new Error("a carried table is a map");
  return canonicalValue(t);
}
function canonicalValue(t) {
  const w = (x) => {
    if (typeof x === "string" || typeof x === "boolean" || x === null) return JSON.stringify(x);
    if (typeof x === "number") {
      if (!Number.isFinite(x) || Object.is(x, -0)) throw new Error(`carried table: ${Object.is(x, -0) ? "-0" : String(x)} has no JSON form`);
      return JSON.stringify(x);
    }
    if (Array.isArray(x)) {
      for (let i = 0; i < x.length; i++) if (!(i in x)) throw new Error("carried table: an array hole");
      return "[" + x.map(w).join(",") + "]";
    }
    if (plainMap(x)) return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + w(x[k])).join(",") + "}";
    throw new Error(`carried table: ${x === void 0 ? "undefined" : typeof x} is not a JSON value`);
  };
  return w(t);
}
function checkCarried(decl, table2) {
  if (decl === null || typeof decl !== "object" || !Array.isArray(decl.assertions)) throw new Error("carried: a declaration is { sha, assertions: [...] }");
  if (decl.sha !== void 0 && decl.sha !== null && !(typeof decl.sha === "string" && /^[0-9a-f]{64}$/.test(decl.sha))) throw new Error(`carried: sha must be 64 lowercase hex (got ${JSON.stringify(decl.sha)})`);
  const sha = sha2564(Buffer.from(canonical(table2)));
  const hashOk = typeof decl.sha === "string" ? sha === decl.sha : null;
  const results = decl.assertions.map((a) => {
    if (a === null || typeof a !== "object" || typeof a.expr !== "string" || !a.expr || !Object.hasOwn(a, "equals")) throw new Error(`carried: an assertion is { expr: <non-empty text>, equals: <json> } (got ${JSON.stringify(a)})`);
    const want = canonicalValue(a.equals);
    const has = a.expr === "count" || Object.hasOwn(table2, a.expr);
    const got = a.expr === "count" ? Object.keys(table2).length : has ? table2[a.expr] : void 0;
    let ok = false;
    if (has) {
      try {
        ok = canonicalValue(got) === want;
      } catch {
        ok = false;
      }
    }
    return { expr: a.expr, equals: a.equals, got, ok };
  });
  const attested = hashOk === true && decl.assertions.length > 0 && results.every((r) => r.ok);
  const status = hashOk === null ? "unpinned" : !hashOk ? "hash-mismatch" : !decl.assertions.length ? "unattested" : attested ? "attested" : "authority-FAIL";
  return { sha, hashOk, results, attested, status, entries: Object.keys(table2).length };
}
function schemaLint(text2, carriedName) {
  const lines = sirLines(text2);
  const hits = [];
  const esc2 = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRe = carriedName && carriedName !== "none" ? new RegExp(`(?<![A-Za-z0-9_])${esc2(carriedName)}(?![A-Za-z0-9_])`) : null;
  for (const d of parse(text2).ast) {
    if (d.name !== "DEPENDS-ON") continue;
    const content = [d.args, ...d.cont, ...d.attrList.map(([, v]) => v), ...d.comments].join(" ");
    if (/(?<![A-Za-z])carried(?![A-Za-z])/i.test(content) || nameRe && nameRe.test(content))
      hits.push({ line: d.line, what: "carried data declared under DEPENDS-ON \u2014 use CARRIED (\xA718)", text: cut96(lines[d.line - 1].replace(/^[ \t]+/, "")) });
  }
  return { hits };
}

// node_modules/rederive/cli/sir/validate.mjs
var import_meta = {};
var PSEUDO = /* @__PURE__ */ new Set(["LET", "FOR", "RETURN", "NODE", "CONTROL", "ERROR", "THROW-PATHS", "BEHAVIORAL", "OBSERVABLE", "PURITY", "FIREWALL", "ELSE", "TERMINATOR-SPLIT", "STEP", "GATE", "IF", "WHILE"]);
var META = /* @__PURE__ */ new Set(["EMISSION", "RE-EMITTER", "EMISSION-CONTRACT", "EMITTER-DIRECTIVE", "EMISSION-INTERFACE", "ABOUT", "SETUP", "FINALIZE"]);
function validate(unitDir, { mode = "strict", enforceDensity = false, gate = 0.1, unit: unitName = null } = {}) {
  const errors = [], warnings = [], advisories = [];
  const E = (code, where, line, msg = "") => errors.push({ code, where, line, msg: String(msg).slice(0, 120) });
  const W = (code, where, line, msg = "") => warnings.push({ code, where, line, msg: String(msg).slice(0, 120) });
  const unit = unitName ?? (0, import_node_path2.basename)((0, import_node_path2.resolve)(unitDir));
  const facts = { unit, mode };
  let fam;
  const sirDir = (0, import_node_path2.join)(unitDir, "sir");
  let unicodeOk = true;
  const strictUtf8 = new TextDecoder("utf-8", { fatal: true });
  if ((0, import_node_fs2.existsSync)(sirDir)) for (const f of (0, import_node_fs2.readdirSync)(sirDir).filter((x) => x.endsWith(".sir"))) {
    try {
      strictUtf8.decode((0, import_node_fs2.readFileSync)((0, import_node_path2.join)(sirDir, f)));
    } catch {
      E("E_NOT_UNICODE", f, 0, "not valid UTF-8: an invalid byte sequence would read as U+FFFD and bind like any other");
      unicodeOk = false;
    }
  }
  if (!unicodeOk) return finish();
  try {
    fam = family((0, import_node_path2.join)(unitDir, "sir"), unit);
  } catch (e) {
    E("E_NO_PRIMARY", "primary", 0, e.message);
    return finish();
  }
  for (const w of fam.warnings ?? []) W("W_LEGACY_BINDING", "family:" + w.split(":")[0], 0, w);
  for (const err of fam.errors) E(/STALE/.test(err) ? "E_STALE_BINDING" : /registry/.test(err) ? "E_LANG_REGISTRY" : /no PRIMARY-SHA256/.test(err) ? "E_UNBOUND" : "E_FAMILY", "family:" + err.split(":")[0], 0, err);
  const files = [["primary", fam.primary, "P"], ...Object.entries(fam.langs).map(([l, e]) => [l, e.text, "L"])];
  for (const [where, text2, reg2] of files) {
    const r = validateText(text2, { mode, reg: reg2 });
    for (const e of r.errors) E(e.code, where, e.line, e.msg);
    for (const w of r.warnings) W(w.code, where, w.line, w.msg);
  }
  const lint = lintFamily(fam, { maxDensity: gate });
  for (const p of lint.problems) {
    const where = p.split(":")[0];
    if (/carried data declared under DEPENDS-ON/.test(p)) E("E_CARRIED_AS_DEPENDENCY", where, 0, p);
    else if (/language leak/.test(p)) E("E_LANGUAGE_LEAK", where, 0, p);
    else if (/behavior in a language file/.test(p)) E("E_REGISTER", where, 0, p);
    else if (/pin without a citation/.test(p)) E("E_UNCITED_PIN", where, 0, p);
    else if (/transcription density/.test(p)) (enforceDensity ? E : W)(enforceDensity ? "E_TRANSCRIPTION_DENSITY" : "W_TRANSCRIPTION_DENSITY", "primary", 0, p);
    else if (/STALE|registry|PRIMARY-SHA256/.test(p)) {
    } else E("E_LINT", where, 0, p);
  }
  facts.primarySha = fam.primarySha;
  facts.languages = Object.keys(fam.langs);
  facts.features = fam.features;
  facts.transcriptionDensity = +lint.transcription.density.toFixed(3);
  const decl = lint.carried;
  if (decl) {
    facts.carried = { name: decl.name, sha: decl.sha, perLanguage: {} };
    for (const [lang, e] of Object.entries(fam.langs)) {
      const b = carriedBinding(e.text);
      if (!b) {
        E("E_CARRIED_UNBOUND", lang, 0, decl.name);
        continue;
      }
      const base = b.module.split("/").pop();
      const path = [(0, import_node_path2.join)(unitDir, "carried", base), (0, import_node_path2.join)(unitDir, "runs", base)].find(import_node_fs2.existsSync);
      if (!path) {
        E("E_CARRIED_MISSING", lang, 0, b.module);
        continue;
      }
      let table2;
      try {
        table2 = carriedTable(lang, path, decl);
      } catch (err) {
        facts.carried.perLanguage[lang] = "unparseable";
        E("E_CARRIED_UNPARSEABLE", lang, 0, err.message.startsWith(path) ? base + err.message.slice(path.length) : err.message);
        continue;
      }
      let c;
      try {
        c = checkCarried(decl, table2);
      } catch (e2) {
        E("E_CARRIED_DECL", lang, 0, e2.message);
        continue;
      }
      facts.carried.perLanguage[lang] = c.status;
      if (c.status !== "attested") E("E_CARRIED_" + c.status.toUpperCase().replace(/-/g, "_"), lang, 0, `${c.status} (${c.sha.slice(0, 12)})`);
    }
  }
  const op = (0, import_node_path2.join)(unitDir, "oracles", `${unit}.json`);
  if (!(0, import_node_fs2.existsSync)(op)) W("W_NO_ORACLE", "oracle", 0);
  else {
    const o = JSON.parse((0, import_node_fs2.readFileSync)(op, "utf8"));
    if (o.encoding !== ENCODING) W("W_ORACLE_LEGACY", "oracle", 0, "untyped \u2014 run tools/encode-oracle.mjs");
    else {
      const vs = vectorSetSha(o);
      const declared = (directive(fam.primary, "ORACLE") ?? "").match(/CANONICAL-SHA256\s+([0-9a-f]{64})/)?.[1] ?? null;
      if (vs !== o.canonicalSha256) E("E_ORACLE_FILE_SHA", "oracle", 0, `file says ${String(o.canonicalSha256).slice(0, 12)}, vectors hash ${vs.slice(0, 12)}`);
      if (!declared) W("W_ORACLE_UNDECLARED", "primary", 0);
      else if (declared !== vs) E("E_ORACLE_DECLARED_SHA", "primary", 0, `declares ${declared.slice(0, 12)}, vectors hash ${vs.slice(0, 12)}`);
      facts.oracle = { frozen: o.frozen.length, heldout: o.heldout.length, sha: vs };
    }
  }
  advisories.push({ tier: "jev", status: process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY || (0, import_node_fs2.existsSync)(process.env.JEV_ENV_FILE ?? (0, import_node_path2.join)(process.env.HOME ?? "", "jev-bakeoff", ".env")) ? "available via tools/jev_advisory.py (predict at prepare, triage at grade; advisory only)" : "not run (no key) \u2014 never affects the exit code" });
  return finish();
  function finish() {
    const seen = /* @__PURE__ */ new Set();
    const dedup = errors.filter((e) => {
      const k = `${e.code}|${e.where}|${e.line}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { ok: dedup.length === 0, errors: dedup, warnings, advisories, facts };
  }
}
function validateText(text2, { mode = "strict", reg: reg2 = "P" } = {}) {
  const errors = [], warnings = [];
  const E = (code, line, msg = "") => errors.push({ code, line, msg });
  const W = (code, line, msg = "") => warnings.push({ code, line, msg });
  const r = parse(text2, { mode });
  for (const e of r.errors) E(e.code, e.line, e.msg);
  for (const w of r.warnings) {
    if (w.code === "W_UNKNOWN_DIRECTIVE") {
      const n = w.msg;
      E(PSEUDO.has(n) ? "E_PSEUDOCODE" : META.has(n) ? "E_EMITTER_META" : "E_UNKNOWN_DIRECTIVE", w.line, n);
    } else W(w.code, w.line, w.msg);
  }
  let notes = 0, directives = 0;
  for (const d of r.ast) {
    if (d.kind === "comment") continue;
    directives++;
    if (d.name === "NOTE") notes++;
    if (d.register && d.register !== "B" && d.register !== reg2) E("E_REGISTER", d.line, `${d.name} belongs to the ${d.register === "P" ? "primary" : "language file"}`);
    if ((d.name === "PINNED" || d.name === "EARNED") && !pinCited(d)) E("E_UNCITED_PIN", d.line, d.args);
  }
  if (directives && notes / directives > 0.5) W("W_NOTE_DENSITY", 0, `${notes}/${directives} directives are NOTE`);
  if (reg2 === "P") {
    const sig = directive(text2, "SIG");
    let parsed = null;
    if (!sig) E("E_NO_SIG", 0);
    else {
      try {
        parsed = parseSig(sig);
      } catch (e) {
        E("E_SIG", 0, e.message);
      }
    }
    const kind2 = directive(text2, "KIND");
    const st = directive(text2, "STATE");
    if (st) {
      const m = st.match(/^mutates\s+(\w+)/);
      if (!m || !parsed || !parsed.args.some((a) => a.name === m[1])) E("E_STATE_ARG", 0, `STATE must read 'mutates <arg>' naming a SIG argument: ${st}`);
      if (kind2 && kind2 !== "STATE") E("E_STATE_KIND", 0, `STATE declared but KIND is ${kind2}`);
    } else if (kind2 === "STATE") W("W_STATE_UNDECLARED", 0, "KIND STATE without `STATE mutates <arg>` \u2014 the oracle observes result only");
  }
  return { errors, warnings };
}
if (import_meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const dir = a.find((x) => !x.startsWith("--"));
  const opt = (k) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : void 0;
  };
  const r = validate(dir, { mode: opt("--mode") ?? "strict", enforceDensity: a.includes("--enforce-density") });
  if (a.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else {
    console.log(`sir-validate ${r.facts.unit} [${r.facts.mode}]: ${r.ok ? "OK" : r.errors.length + " ERROR(S)"}, ${r.warnings.length} warning(s)`);
    for (const e of r.errors) console.log(`  ERROR ${e.code} @${e.where}${e.line ? ":" + e.line : ""} ${e.msg}`);
    for (const w of r.warnings) console.log(`  warn  ${w.code} @${w.where}${w.line ? ":" + w.line : ""} ${w.msg}`);
    console.log(`  facts: primary ${String(r.facts.primarySha).slice(0, 12)}\u2026 languages [${(r.facts.languages || []).join(",")}] features [${(r.facts.features || []).join(",")}] density ${r.facts.transcriptionDensity}${r.facts.carried ? ` carried ${r.facts.carried.name}:${JSON.stringify(r.facts.carried.perLanguage)}` : ""}${r.facts.oracle ? ` oracle ${r.facts.oracle.frozen}+${r.facts.oracle.heldout} ${r.facts.oracle.sha.slice(0, 12)}\u2026` : ""}`);
  }
  process.exit(r.ok ? 0 : 1);
}

// node_modules/rederive/cli/sir/directive-table.mjs
var import_meta2 = {};
var MEANINGS = {
  UNIT: "The unit name; the first line of every file (primary and language). Supersedes `SIR`.",
  SIR: "The v0.1 header. Read, never written.",
  KIND: "`FUNCTIONAL | STATE | EFFECT` (\xA71, \xA711).",
  FIDELITY: "`package | spec` (\xA712). Supersedes the `VARIANT` spelling; the manifest `variants` map is unchanged.",
  VARIANT: "The \xA712 spelling of `FIDELITY`. Read, never written.",
  ANCHOR: "What the contract is anchored to (\xA712). Also an attribute (`\u2026 ANCHOR <ref>`). `ref(<lang>:\u2026)` is the \xA712x extension.",
  SRC: "Source location of the original (\xA71).",
  TRIGGER: "Metadata, never structure (\xA78).",
  REACH: "An off-path unit, kept and marked (\xA76).",
  "ORACLE-CLASS": "`deterministic | trace` (\xA715).",
  "TRACE-SEAM": "The injectable effect boundary (\xA715).",
  SEAM: "An export-shape adapter (\xA716).",
  SIG: "Primary: the signature over the abstract types (\xA723b). Language file: the native signature.",
  ENVELOPE: "The verified input scope (\xA717). In a language file: a narrowing (any language) or, for `js` only, a widening.",
  "DEPENDS-ON": "Named dependencies (\xA79), or `none`. Never carried data (`E_CARRIED_AS_DEPENDENCY`).",
  DESCRIPTION: "Contract-level prose: what the unit is for.",
  BEHAVIOR: "Header for the numbered rules `R1 \u2026 Rn` (\xA723a rule 3).",
  INVARIANT: "A property the oracle should bear out. Prose until a vector pins it.",
  TABLE: "A decision table (\xA713 as a directive). Every row is verified by the oracle.",
  PINNED: "`PINNED <kind> <name> = <literal>`: a hard requirement. Neutral in the primary, dialect in a language file. Cited (\xA723a rule 4).",
  EARNED: "A rule or pin added after an observed divergence: `EARNED round-<n> heldout <vector>`.",
  NOTE: "Non-load-bearing prose. Metered (`W_NOTE_DENSITY`).",
  RATIONALE: "Why a rule is the way it is. Non-load-bearing.",
  SCOPE: "`IN:` / `OUT:` classification of behavior.",
  "UNGUARDED-PRECONDITION": "An input condition the unit does not check; behavior outside it is unspecified.",
  "OUT-OF-DOMAIN": "An input the contract explicitly does not cover, and what (if anything) is promised for it.",
  ORACLE: "`ORACLE value -> oracles/<unit>.json CANONICAL-SHA256 <hex>`: the oracle file and its declared hash (\xA710x).",
  PROVENANCE: "Where the contract came from: package, version, function, history.",
  CARRIED: "A carried constant table (\xA718). Primary: `CARRIED <name> FROM <source>` + `SHAPE` / `CANONICAL-SHA256` / `AUTHORITY`. Language file: where the module is.",
  SHAPE: "Sub-field of `CARRIED`: the table's abstract type and entry count.",
  "CANONICAL-SHA256": "Sub-field of `CARRIED`: the table's canonical hash. (The oracle's hash rides on the `ORACLE` line.)",
  AUTHORITY: "Sub-field of `CARRIED`: one re-runnable assertion against the independent authority (\xA718).",
  "CARRIED-DATA": "The v0.3 spelling of `CARRIED`. Read, never written.",
  STATE: "`STATE mutates <arg>`: the unit mutates an argument; the oracle observes `{result, post}` (\xA72, \xA711).",
  EMIT: "An effect emission that may bind a result (\xA73).",
  REQUEST: "An effect with no outbound payload (\xA73).",
  BRANCH: "A branch over a predicate (\xA74).",
  "ON-ERROR": "Error handling as a branch (\xA74).",
  PAR: "An unordered window over sub-traces (\xA75, \xA719).",
  RING: "Token-coordinated concurrency (\xA722).",
  LIFECYCLE: "A cancellable resource (\xA721).",
  EFFECT: "An effect across a `<domain>.<verb>` boundary (\xA77).",
  SURFACE: "The module surface at `domain.verb` level (\xA77).",
  NOTES: "An ad-hoc legacy prose block. Read, never written; becomes `NOTE`.",
  "GUARD-PINNED": "A legacy pinned guard. Read, never written; becomes `PINNED`.",
  LANG: "Language file only: the language id, which must equal the filename's (\xA723b).",
  "PRIMARY-SHA256": "Language file only: the canonical-text hash of the primary it was written against (\xA723b).",
  ABI: "Language file only: how abstract types map to native ones (text encoding, numeric semantics, crate or module shape).",
  MECHANISM: "Language file only: which built-ins realize which rules, and anything an emitter in that language would otherwise get wrong."
};
var reg = { P: "primary", L: "language", B: "both" };
var kind = { lb: "load-bearing", pr: "prose (unverified prior)", legacy: "legacy (read only)" };
function table() {
  const missing = Object.keys(DIRECTIVES).filter((k) => !MEANINGS[k]);
  if (missing.length) throw new Error("no meaning for " + missing);
  const extra = Object.keys(MEANINGS).filter((k) => !(k in DIRECTIVES));
  if (extra.length) throw new Error("not a directive: " + extra);
  const out = ["| directive | file | kind | meaning |\n|---|---|---|---|"];
  for (const [k, v] of Object.entries(DIRECTIVES)) {
    const [r, kd] = v.split(":");
    out.push(`| \`${k}\` | ${reg[r]} | ${kind[kd]} | ${MEANINGS[k].replace(/\|/g, "\\|")} |`);
  }
  out.push("| `R<n>` | primary | load-bearing | One numbered rule under `BEHAVIOR`. |");
  return out.join("\n");
}
if (import_meta2.url === `file://${process.argv[1]}`) console.log(table());

// node_modules/rederive/cli/lsp/spec-sections.mjs
var import_node_fs3 = require("node:fs");
var import_meta3 = {};
var slug = (heading) => heading.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-");
var sectionsOf = (schema) => Object.fromEntries([...schema.matchAll(/^## ((\d+[a-z]?)\.\s.*)$/gm)].map(([, h, n]) => [n, slug(h)]));
if (import_meta3.url === `file://${process.argv[1]}`) console.log(JSON.stringify(sectionsOf((0, import_node_fs3.readFileSync)(process.argv[2], "utf8")), null, 1));

// node_modules/rederive/cli/lsp/analyze.mjs
var safeSha = (text2) => {
  try {
    return canonicalSha(text2);
  } catch {
    return null;
  }
};
function bindingOf(langText, ptext) {
  const bound = langText.match(/^PRIMARY-SHA256\s+([0-9a-f]{64})/m)?.[1] ?? null;
  if (ptext === null) return { status: "no-primary", bound, primarySha: null };
  const primarySha = safeSha(ptext);
  if (!bound) return { status: "unbound", bound, primarySha };
  if (bound === primarySha) return { status: "ok", bound, primarySha };
  let legacy = false;
  try {
    legacy = bound === legacyPrintSha(ptext);
  } catch {
  }
  return { status: legacy ? "legacy" : "stale", bound, primarySha };
}

// node_modules/rederive/cli/lsp/pr-review.mjs
var MARKER = "<!-- sir-review -->";
var NOTE = "<!-- sir-review:inline -->";
var FAMILY_FILE = /^(.+?)\.([^.]+)\.sir$/;
var git = (args) => {
  try {
    return (0, import_node_child_process.execFileSync)("git", args, { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
};
var at = (sha, path) => git(["show", `${sha}:${path}`]);
var esc = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
var chip = (checked) => checked ? "\u{1F9EA} tested" : "\u{1F4DD} note \xB7 not tested";
var words = (d) => d.map((p) => p.op === "=" ? esc(p.text) : p.op === "+" ? `<ins><b>${esc(p.text)}</b></ins>` : `<del>${esc(p.text)}</del>`).join("");
function changedLines(base, head, path) {
  const out = /* @__PURE__ */ new Set();
  const d = git(["diff", "-U0", base, head, "--", path]) ?? "";
  for (const m of d.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const s = +m[1], n = m[2] === void 0 ? 1 : +m[2];
    for (let i = s; i < s + n; i++) out.add(i);
  }
  return out;
}
function spans(text2) {
  const ast = parse(text2).ast.filter((d) => d.kind !== "comment");
  const n = text2.split(/\r\n|\r|\n/).length;
  return new Map(ast.map((d, i) => [d.line, ast[i + 1] ? ast[i + 1].line - 1 : n]));
}
function review({ base, head, files = null }) {
  const changed = files ?? (git(["diff", "--name-only", "--diff-filter=AMDR", base, head, "--", "*.sir", "**/oracles/*.json"]) ?? "").split("\n").filter(Boolean);
  const sirChanged = changed.filter((f) => f.endsWith(".sir"));
  const primaries = /* @__PURE__ */ new Set(), langOnly = [];
  for (const f of changed.filter((x) => x.endsWith(".json"))) {
    const root = (0, import_node_path3.dirname)((0, import_node_path3.dirname)(f));
    const unit = (0, import_node_path3.basename)(f).split(".")[0];
    const p = import_node_path3.posix.join(root, "sir", `${unit}.sir`);
    if (at(head, p) !== null) primaries.add(p);
  }
  for (const f of sirChanged) {
    const m = (0, import_node_path3.basename)(f).match(FAMILY_FILE);
    if (m) {
      const p = import_node_path3.posix.join((0, import_node_path3.dirname)(f), `${m[1]}.sir`);
      if (!sirChanged.includes(p)) langOnly.push(f);
    } else primaries.add(f);
  }
  const blocks = [], inline = [], oracleNotes = [], findings = [], units = [];
  let stops = 0;
  const plain = (s) => s.replace(/<[^>]+>/g, "");
  for (const path of primaries) {
    const before = at(base, path), after = at(head, path);
    const unit = (0, import_node_path3.basename)(path, ".sir");
    const root = (0, import_node_path3.basename)((0, import_node_path3.dirname)(path)) === "sir" ? (0, import_node_path3.dirname)((0, import_node_path3.dirname)(path)) : (0, import_node_path3.dirname)(path);
    if (after === null) {
      blocks.push(`### \`${path}\` \xB7 removed
The contract for \`${unit}\` is deleted in this PR.`);
      continue;
    }
    const langs = (git(["ls-tree", "--name-only", head, (0, import_node_path3.dirname)(path) + "/"]) ?? "").split("\n").map((f) => (0, import_node_path3.basename)(f).match(FAMILY_FILE)).filter((m) => m && m[1] === unit).map((m) => ({ lang: m[2], path: import_node_path3.posix.join((0, import_node_path3.dirname)(path), m[0]) }));
    if (before === null) {
      const rel = after.match(/^ORACLE\b.*?->\s*(\S+)/m)?.[1];
      const declared = after.match(/^ORACLE\b.*?CANONICAL-SHA256\s+([0-9a-f]{64})/m)?.[1];
      let o = null;
      try {
        o = rel ? JSON.parse(at(head, import_node_path3.posix.join(root, rel)) ?? "null") : null;
      } catch {
      }
      let vs = null;
      try {
        vs = o ? vectorSetSha(o) : null;
      } catch {
      }
      const anchor = after.match(/^ANCHOR\s+(\S+(?:\s+\S+)?)/m)?.[1];
      const checks = [
        o ? vs && vs === o.canonicalSha256 && vs === declared ? `\u2705 ${o.frozen.length + o.heldout.length} tests (${o.heldout.length} hidden from the builders)${o.anchor ? `, captured from ${esc(o.anchor)}` : ""}; the fingerprint the contract declares matches the file.` : "\u{1F6D1} The test file does not match the fingerprint the contract declares." : "\u26A0\uFE0F No test file: nothing checks this contract yet.",
        ...langs.map((l) => {
          const t2 = at(head, l.path);
          const b = t2 === null ? "missing" : bindingOf(t2, after).status;
          return `${b === "ok" ? "\u2705" : "\u{1F6D1}"} ${l.lang} file ${b === "ok" ? "bound to this contract" : b}.`;
        })
      ];
      stops += checks.filter((c) => c.startsWith("\u{1F6D1}")).length;
      for (const c of checks.filter((x) => x.startsWith("\u{1F6D1}"))) findings.push({ level: "error", path, line: 1, title: `${unit}: new contract`, message: plain(c.slice(3)) });
      units.push({
        unit,
        path,
        status: checks.some((c) => c.startsWith("\u{1F6D1}")) ? "fail" : "pass",
        change: "new contract",
        tests: o ? vs === o.canonicalSha256 && vs === declared ? `\u2713 ${o.frozen.length + o.heldout.length}${o.anchor ? ` from ${o.anchor.split(/\s+/)[0]}` : ""}` : "\u2717 fingerprint mismatch" : "\u2013 none",
        bindings: langs.length ? langs.map((l) => {
          const t2 = at(head, l.path);
          return `${l.lang} ${t2 !== null && bindingOf(t2, after).status === "ok" ? "\u2713" : "\u2717"}`;
        }).join(" ") : "\u2013",
        citations: "\u2713"
      });
      blocks.push(`### \`${path}\` \xB7 new contract${anchor ? ` \xB7 anchored to ${esc(anchor)}` : ""}
${checks.map((c) => `> ${c}`).join("\n>\n")}

${readable(explain(after))}`);
      continue;
    }
    const oracleRel = after.match(/^ORACLE\b.*?->\s*(\S+)/m)?.[1];
    const op = oracleRel ? import_node_path3.posix.join(root, oracleRel) : null;
    const oracleChanged = op ? at(base, op) !== at(head, op) : null;
    const stale = langs.filter((l) => {
      const t2 = at(head, l.path);
      return t2 !== null && bindingOf(t2, after).status !== "ok";
    }).map((l) => l.lang);
    const d = explainDiff(before, after, { oracleChanged, langs: stale });
    const od = oracleChanged ? oracleDiff(at(base, op) ?? "", at(head, op) ?? "") : null;
    const anchorOf = (t2) => t2.match(/^ANCHOR\s+(.*)$/m)?.[1] ?? null;
    const pkgFidelity = /^FIDELITY\s+package\b/m.test(before);
    if (od && od.rewritten.length && pkgFidelity && anchorOf(before) === anchorOf(after)) {
      const src = (anchorOf(after) ?? "the original package").split(/\s+/)[0];
      const hid = od.rewritten.filter((x) => x.hidden).length;
      d.warnings.unshift({ level: "stop", text: `${od.rewritten.length} existing test answer${od.rewritten.length > 1 ? "s were" : " was"} rewritten${hid ? ` (${hid} of them hidden from the builders)` : ""}. These answers were captured by running ${src}, and the contract still says to match ${src} exactly. Running it again gives back the old answer, so the new one came from the author, not the package. The gate passes because the test now agrees with the change it is supposed to check.` });
    }
    if (od && od.rewritten.length && pkgFidelity && anchorOf(before) === anchorOf(after)) d.warnings[0].kind = "rewritten";
    if (!d.changes.length && !(od && (od.added.length || od.removed.length || od.rewritten.length || od.inputsChanged.length))) {
      blocks.push(`### \`${path}\`
Formatting only: nothing a reader or a test can see changed.`);
      units.push({ unit, path, status: "pass", change: "formatting only", tests: "\u2713 unchanged", bindings: "\u2713", citations: "\u2713" });
      continue;
    }
    stops += d.warnings.filter((w) => w.level === "stop").length;
    if (od && od.rewritten.length && pkgFidelity && anchorOf(before) === anchorOf(after)) oracleNotes.push([op, od.rewritten, (anchorOf(after) ?? "the original package").split(/\s+/)[0]]);
    const icon = { stop: "\u{1F6D1} **Stop.**", note: "\u26A0\uFE0F **Heads up.**", ok: "\u2705" };
    const warn = d.warnings.map((w) => `> ${icon[w.level]} ${esc(w.text)}`).join("\n>\n");
    const staleLine = stale.length ? `

> \u{1F517} In this PR, the ${stale.join(", ")} file${stale.length > 1 ? "s are" : " is"} still bound to the old contract (STALE): \`rdv check\` refuses ${stale.length > 1 ? "them" : "it"} until re-bound.` : "";
    const rows = d.changes.map((c) => `#### ${esc(c.label)} \xB7 ${c.kind} \xB7 ${chip(c.checked)}
${c.diff ? words(c.diff) : c.kind === "removed" ? `<del>${esc(c.text)}</del>` : `<ins><b>${esc(c.text)}</b></ins>`}${c.whyDiff ? `

<sub>Why: ${words(c.whyDiff)}</sub>` : ""}`).join("\n\n");
    const t = od ? [
      ...od.rewritten.map((x) => `- ${x.hidden ? "\u{1F648} Hidden" : "\u{1F440} Visible"} test \`${x.name}\`: for input ${esc(x.input)}, the expected answer was **rewritten** from <del>${esc(x.from)}</del> to <ins><b>${esc(x.to)}</b></ins>`),
      ...od.inputsChanged.map((x) => `- ${x.hidden ? "\u{1F648} Hidden" : "\u{1F440} Visible"} test \`${x.name}\`: its input changed from ${esc(x.from)} to ${esc(x.to)}`),
      ...od.added.map((x) => `- New ${x.hidden ? "hidden" : "visible"} test \`${x.name}\`: ${esc(x.input)} \u2192 ${esc(x.to)}`),
      ...od.removed.map((x) => `- Removed ${x.hidden ? "hidden" : "visible"} test \`${x.name}\`: ${esc(x.input)} \u2192 ${esc(x.to)}`)
    ] : [];
    const tests = od ? `#### Tests \xB7 \`${op}\`
${t.length ? t.join("\n") : "Re-hashed only: no case changed."}` : "";
    blocks.push(`### \`${path}\` \xB7 unit \`${d.unit}\`
${warn}${staleLine}

${rows}${tests ? "\n\n" + tests : ""}

<details><summary>Read the whole contract in plain English (after this PR)</summary>

${readable(explain(after))}
</details>`);
    const lines = changedLines(base, head, path), sp = spans(after);
    const testsMoved = oracleChanged !== false;
    const e = explain(after);
    const lineOf = new Map(e.sections.flatMap((s) => s.items.map((it) => [`${s.title}|${it.id}`, it.line])));
    for (const c of d.changes.filter((x) => x.checked && x.kind !== "removed")) {
      const start = lineOf.get(`${c.section}|${c.id}`);
      if (!start) continue;
      const end = sp.get(start) ?? start;
      let line = null;
      for (let i = start; i <= end; i++) if (lines.has(i)) {
        line = i;
        break;
      }
      if (!line) continue;
      inline.push({ path, line, body: `${NOTE}
**${esc(c.label)}** changed \xB7 ${chip(true)}${testsMoved ? "" : "\n\n\u{1F6D1} **No test changed in this PR.** The hidden tests still expect the old behavior, so nothing proves this one."}

${c.diff ? words(c.diff) : esc(c.text)}${stale.length ? `

\u{1F517} Still bound to the old version: ${stale.join(", ")}.` : ""}` });
      findings.push(testsMoved ? { level: "notice", path, line, title: `${unit}: ${c.label} changed`, message: plain(c.diff ? c.diff.filter((p) => p.op !== "-").map((p) => p.text).join("") : c.text) } : { level: "error", path, line, title: `${unit}: ${c.label} changed, no test did`, message: "The hidden tests still expect the old behavior, so nothing in this PR proves the new one." });
    }
    const first = inline.find((x) => x.path === path)?.line;
    for (const w of d.warnings.filter((x) => x.kind === "citation")) findings.push({ level: "error", path, ...first ? { line: first } : {}, title: `${unit}: contradicts its own citation`, message: w.text });
    if (stale.length) findings.push({ level: "warning", path, title: `${unit}: language files left on the old contract`, message: `${stale.join(", ")} still bound to the old version (STALE): rdv check refuses them until re-bound.` });
    const tested = d.changes.filter((c) => c.checked);
    units.push({
      unit,
      path,
      status: d.warnings.some((w) => w.level === "stop") ? "fail" : "pass",
      change: tested.length ? tested.map((c) => c.label).join(", ") : d.changes.length ? "prose only" : "tests only",
      tests: od ? od.rewritten.length ? `\u2717 ${od.rewritten.length} answer${od.rewritten.length > 1 ? "s" : ""} rewritten` : `\u2713 ${[od.added.length && `${od.added.length} added`, od.removed.length && `${od.removed.length} removed`].filter(Boolean).join(", ") || "re-hashed"}` : tested.length ? "\u2717 unchanged" : "\u2713 unchanged",
      bindings: stale.length ? `\u2717 ${stale.join(", ")} stale` : "\u2713",
      citations: d.warnings.some((w) => w.kind === "citation") ? "\u2717 contradicted" : "\u2713"
    });
  }
  for (const [op, cases, src] of oracleNotes) {
    const lines = changedLines(base, head, op);
    const text2 = (at(head, op) ?? "").split("\n");
    for (const x of cases) {
      const at0 = text2.findIndex((l) => l.includes(`"name": "${x.name}"`));
      if (at0 < 0) continue;
      let line = null;
      for (let i = at0 + 1; i <= Math.min(text2.length, at0 + 60); i++) if (lines.has(i)) {
        line = i;
        break;
      }
      if (!line) continue;
      findings.push({ level: "error", path: op, line, title: `${x.hidden ? "Hidden" : "Visible"} test ${x.name}: answer rewritten`, message: `For input ${x.input} it expected ${x.from}, captured from ${src}. Now it expects ${x.to}. ${src} still gives the old answer.` });
      inline.push({ path: op, line, body: `${NOTE}
${x.hidden ? "\u{1F648} **Hidden test" : "\u{1F440} **Visible test"} \`${x.name}\`: answer rewritten.** For input ${esc(x.input)} it expected <del>${esc(x.from)}</del>, captured from ${src}. Now it expects <ins><b>${esc(x.to)}</b></ins>.

\u{1F6D1} ${src} still gives the old answer. Edit the contract's anchor (or add a new unit) instead of the test.` });
    }
  }
  for (const f of langOnly) {
    const t = at(head, f), m = (0, import_node_path3.basename)(f).match(FAMILY_FILE);
    const p = at(head, import_node_path3.posix.join((0, import_node_path3.dirname)(f), `${m[1]}.sir`));
    const b = t === null ? null : p === null ? { status: "no-primary" } : bindingOf(t, p);
    blocks.push(`### \`${f}\` \xB7 ${m[2]} language file
${t === null ? "Removed." : b.status === "ok" ? "Changed. Still bound to the current primary." : `Changed, and its binding is **${b.status}**: \`rdv check\` refuses it until it is re-bound.`}`);
  }
  const head1 = stops ? `\u{1F6D1} **${stops} problem${stops > 1 ? "s" : ""} to read before approving.**` : changed.length ? "\u2705 **Nothing to stop on.** Plain-English review of the contract changes in this PR." : "No SIR contract changed in this PR.";
  const body = `${MARKER}
## SIR review
${head1}

${blocks.join("\n\n---\n\n")}

<sub>Generated from the .sir files by rederive (no AI): every line is the contract's own text or a fixed phrase. \u{1F9EA} tested = held by the hidden tests \xB7 \u{1F4DD} note = prose nobody grades.</sub>`;
  return { body, inline, findings, units, stops };
}
var prop = (v) => String(v).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
var data = (v) => String(v).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
var annotations = (findings) => findings.map((f) => `::${f.level} file=${prop(f.path)}${f.line ? `,line=${f.line}` : ""},title=${prop(f.title)}::${data(f.message)}`).join("\n");
function summary({ units, stops }) {
  if (!units.length) return "## SIR review\nNo SIR contract changed.\n";
  const fail = units.filter((u) => u.status === "fail").length;
  return `## SIR review: ${fail ? `\u274C ${fail} of ${units.length} contract${units.length > 1 ? "s" : ""} failing` : `\u2705 ${units.length} contract${units.length > 1 ? "s" : ""} passing`}

| | unit | change | tests | bindings | citations |
|---|---|---|---|---|---|
${units.map((u) => `| ${u.status === "fail" ? "\u274C" : "\u2705"} | \`${u.unit}\` | ${u.change} | ${u.tests} | ${u.bindings} | ${u.citations} |`).join("\n")}

${stops ? `${stops} Stop${stops > 1 ? "s" : ""}: each one is an annotation on its line, explained in full in the review.` : ""}
`;
}
function readable(e) {
  return [e.summary.map((s) => `- ${esc(s)}`).join("\n"), ...e.sections.map((s) => `**${esc(s.title)}** \xB7 ${chip(s.checked)}
${s.items.map((it) => `- ${it.label ? `*${esc(it.label)}:* ` : ""}${esc(it.text)}${it.why.length ? ` <sub>(why: ${esc(it.why.join("; "))})</sub>` : ""}`).join("\n")}`)].join("\n\n");
}
async function gh(method, url, body) {
  const r = await fetch(`https://api.github.com${url}`, { method, headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", ...body ? { "content-type": "application/json" } : {} }, body: body ? JSON.stringify(body) : void 0 });
  if (!r.ok) throw new Error(`${method} ${url}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}
var all = async (url) => {
  const out = [];
  for (let p = 1; ; p++) {
    const page = await gh("GET", `${url}${url.includes("?") ? "&" : "?"}per_page=100&page=${p}`);
    out.push(...page);
    if (page.length < 100) return out;
  }
};
async function run({ failOn: failOn2 = "stop", comment = true, notes = true } = {}) {
  const ev2 = JSON.parse((0, import_node_fs4.readFileSync)(process.env.GITHUB_EVENT_PATH, "utf8"));
  const pr = ev2.pull_request;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!pr) {
    console.log("sir-review: not a pull_request event; nothing to review");
    return 0;
  }
  const r = review({ base: pr.base.sha, head: pr.head.sha });
  const { body, inline } = r;
  if (r.findings.length) console.log(annotations(r.findings));
  if (process.env.GITHUB_STEP_SUMMARY) (0, import_node_fs4.writeFileSync)(process.env.GITHUB_STEP_SUMMARY, summary(r), { flag: "a" });
  if (!comment) return r.stops && failOn2 === "stop" ? 1 : 0;
  const mine = (await all(`/repos/${repo}/issues/${pr.number}/comments`)).find((c) => c.body?.startsWith(MARKER));
  if (mine) await gh("PATCH", `/repos/${repo}/issues/comments/${mine.id}`, { body });
  else await gh("POST", `/repos/${repo}/issues/${pr.number}/comments`, { body });
  for (const c of (await all(`/repos/${repo}/pulls/${pr.number}/comments`)).filter((c2) => c2.body?.startsWith(NOTE))) await gh("DELETE", `/repos/${repo}/pulls/comments/${c.id}`);
  if (notes && inline.length) await gh("POST", `/repos/${repo}/pulls/${pr.number}/reviews`, { commit_id: pr.head.sha, event: "COMMENT", comments: inline.map((c) => ({ path: c.path, line: c.line, side: "RIGHT", body: c.body })) });
  console.log(`sir-review: comment ${mine ? "updated" : "posted"}, ${notes ? inline.length : 0} line note(s), ${r.stops} stop(s)`);
  return r.stops && failOn2 === "stop" ? 1 : 0;
}

// src/index.mjs
var input = (name, fallback) => {
  const v = process.env[`INPUT_${name.toUpperCase()}`];
  return v === void 0 || v === "" ? fallback : v.trim();
};
var failOn = input("fail-on", "stop");
if (!["stop", "never"].includes(failOn)) {
  console.log(`::error title=sir-review::fail-on must be stop or never (got ${failOn})`);
  process.exit(1);
}
process.env.GITHUB_TOKEN = input("github-token", process.env.GITHUB_TOKEN ?? "");
var ev = JSON.parse((0, import_node_fs5.readFileSync)(process.env.GITHUB_EVENT_PATH, "utf8"));
for (const sha of [ev.pull_request?.base?.sha, ev.pull_request?.head?.sha].filter(Boolean)) {
  try {
    (0, import_node_child_process2.execFileSync)("git", ["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
  } catch {
    (0, import_node_child_process2.execFileSync)("git", ["fetch", "--no-tags", "--quiet", "origin", sha], { stdio: "inherit" });
  }
}
(async () => {
  try {
    process.exitCode = await run({ failOn, comment: input("comment", "true") === "true", notes: input("line-notes", "true") === "true" });
  } catch (e) {
    console.log(`::error title=sir-review::${String(e.message).replace(/\r?\n/g, " ")}`);
    process.exitCode = 1;
  }
})();
