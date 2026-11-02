// rederive/sir-review: built from src/ and the rederive npm package by scripts/build.mjs; every pure part is the verified copy in vendor/review-core. Do not edit.
var __defProp = Object.defineProperty;
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};

// src/index.mjs
var import_node_child_process2 = require("node:child_process");
var import_node_fs2 = require("node:fs");

// node_modules/rederive/cli/lsp/pr-review.mjs
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// vendor/review-core/src/explain_contract.mjs
var explain_contract_exports = {};
__export(explain_contract_exports, {
  default: () => explain_contract_default,
  explain_contract: () => explain_contract
});
var FEFF = String.fromCharCode(65279);
var RET = String.fromCharCode(9166);
var LEAD = new RegExp("^[ \\t\\uFEFF]*");
var VOCAB = new Set("UNIT SIR KIND FIDELITY VARIANT ANCHOR SRC TRIGGER REACH ORACLE-CLASS TRACE-SEAM SEAM SIG ENVELOPE DEPENDS-ON DESCRIPTION BEHAVIOR INVARIANT TABLE PINNED EARNED NOTE RATIONALE SCOPE UNGUARDED-PRECONDITION OUT-OF-DOMAIN ORACLE PROVENANCE CARRIED SHAPE CANONICAL-SHA256 AUTHORITY CARRIED-DATA STATE EMIT REQUEST BRANCH ON-ERROR PAR RING LIFECYCLE EFFECT SURFACE NOTES GUARD-PINNED LANG PRIMARY-SHA256 ABI MECHANISM".split(" "));
var KIND_PHRASE = /* @__PURE__ */ new Map([
  ["FUNCTIONAL", "A pure function: the same input always gives the same output."],
  ["STATE", "Changes one of its arguments in place; the tests check the result and the changed argument."],
  ["EFFECT", "Talks to the outside world; the tests check the calls it makes, in order."]
]);
var FID_PHRASE = /* @__PURE__ */ new Map([
  ["package", "Matches the original package exactly, quirks included."],
  ["spec", "Follows the cited standard, even where the original package does not."]
]);
var PIN_KIND = new Map(Object.entries({ regex: "pattern", charset: "character set", grammar: "grammar", text: "exact text", set: "set", const: "constant", names: "names", number: "number", constant: "constant", chars: "characters", order: "order", map: "mapping", bytes: "bytes" }));
var OTHER = new Map(Object.entries({ ORACLE: "The tests (file and fingerprint)", "ORACLE-CLASS": "Kind of tests", STATE: "What it changes in place", SEAM: "Export shape", "TRACE-SEAM": "Effect boundary", SRC: "Source location", EFFECT: "Effect", SURFACE: "Module surface", EMIT: "Emits", REQUEST: "Requests", BRANCH: "Branch", "ON-ERROR": "On error", PAR: "Unordered window", RING: "Token ring", LIFECYCLE: "Resource lifecycle", REACH: "Off-path unit", TRIGGER: "Trigger", EARNED: "Earned rule", BEHAVIOR: "Behavior header" }));
var OPENERS = /* @__PURE__ */ new Set(["	", " ", "(", "[", "{", ",", "=", ":", ";", "|", "<", ">", "!", "&", "-", "~"]);
var SECTIONS = [
  ["header", "What kind of unit it is", true, [["UNIT", "Name"], ["KIND", "Kind"], ["FIDELITY", "Fidelity"], ["ANCHOR", "Anchor"]]],
  ["what", "What it is for", false, [["DESCRIPTION", null]]],
  ["inputs", "What it accepts", true, [["SIG", "Signature"], ["ENVELOPE", "Inputs it is verified on"], ["UNGUARDED-PRECONDITION", "Assumes, without checking"], ["OUT-OF-DOMAIN", "Not covered"]]],
  ["rules", "What it does", true, "R"],
  ["pins", "Exact definitions", true, "PINNED"],
  ["table", "Decision table", true, [["TABLE", null]]],
  ["data", "Data it carries", true, "CARRIED"],
  ["deps", "What it depends on", true, [["DEPENDS-ON", null]]],
  ["more", "Other parts of the contract", true, "MORE"],
  ["stray", "Text outside any directive", true, "STRAY"],
  ["holds", "Should always hold", false, [["INVARIANT", null]]],
  ["scope", "In and out of scope", false, [["SCOPE", null]]],
  ["notes", "Background", false, [["NOTE", "Note"], ["RATIONALE", "Why"], ["PROVENANCE", "Where it came from"]]]
];
var WS = (c) => c === " " || c === "	";
var trimWS = (s) => s.replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
function spansOf(s) {
  const out = [];
  let i = 0, prev = -2;
  while (i < s.length) {
    if (s[i] === '"' && (i === 0 || OPENERS.has(s[i - 1]) || i === prev + 1)) {
      let j = i + 1, found = -1;
      while (j < s.length) {
        if (s[j] === "\\") j += 2;
        else if (s[j] === '"') {
          found = j;
          break;
        } else j++;
      }
      if (found < 0) break;
      out.push([i, found]);
      prev = found;
      i = found + 1;
    } else i++;
  }
  return out;
}
var inside = (spans2, p) => spans2.some(([o, c]) => p > o && p < c);
function splitAttrs(S, spans2, off) {
  const re = /[ \t]+(CITED|EARNED|ANCHOR)(?=[ \t]|$)/g;
  const hits = [];
  let m;
  while ((m = re.exec(S)) !== null) {
    const kwStart = m.index + m[0].length - m[1].length;
    if (!inside(spans2, kwStart + off)) hits.push({ idx: m.index, kw: m[1], end: m.index + m[0].length });
    if (m[0].length === 0) re.lastIndex++;
  }
  const body = trimWS(hits.length ? S.slice(0, hits[0].idx) : S);
  const pairs = hits.map((h, k) => [h.kw, trimWS(S.slice(h.end, k + 1 < hits.length ? hits[k + 1].idx : S.length))]);
  return { body, pairs };
}
function parse(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const dirs = [], stray = [];
  let cur = null;
  lines.forEach((raw, k) => {
    const ln = k + 1;
    const lead = LEAD.exec(raw)[0];
    let line = lead.split(FEFF).join("") + raw.slice(lead.length);
    line = line.replace(/[ \t]+$/, "");
    if (line === "") return;
    const indent = /^[ \t]*/.exec(line)[0];
    const content = line.slice(indent.length);
    if (content[0] === "#") {
      if (cur) cur.comments.push(content.replace(/^#+[ \t]?/, ""));
      else stray.push({ line: ln, text: content });
      return;
    }
    const spans2 = spansOf(content);
    let marker = -1;
    for (let p = 0; p < content.length; p++) {
      if (content[p] === "#" && p > 0 && WS(content[p - 1]) && (p + 1 === content.length || WS(content[p + 1])) && !inside(spans2, p)) {
        marker = p;
        break;
      }
    }
    const code = marker < 0 ? content : content.slice(0, marker).replace(/[ \t]+$/, "");
    const tcom = marker < 0 ? null : trimWS(content.slice(marker + 1));
    if (indent === "") {
      let n = 0;
      while (n < code.length && !WS(code[n])) n++;
      let name = code.slice(0, n);
      const rest = code.slice(n);
      if (/^[A-Z][A-Z0-9-]*:$/.test(name) && name.slice(0, -1) !== "CITED") name = name.slice(0, -1);
      if (/^([A-Z][A-Z0-9-]*|R[0-9]+)$/.test(name) && name !== "CITED") {
        const { body: body2, pairs: pairs2 } = splitAttrs(rest, spans2, n);
        cur = { name, line: ln, args: body2, attrs: pairs2, cont: [], comments: tcom === null ? [] : [tcom], known: VOCAB.has(name) || /^R[0-9]+$/.test(name) };
        dirs.push(cur);
        return;
      }
    }
    if (!cur) {
      stray.push({ line: ln, text: content });
      return;
    }
    const { body, pairs } = splitAttrs(" " + code, spans2, -1);
    cur.attrs.push(...pairs);
    if (body !== "") cur.cont.push(body);
    if (tcom !== null) cur.comments.push(tcom);
  });
  return { dirs, stray };
}
var pieces = (d) => [d.args, ...d.cont].filter((x) => x !== "");
var textOf = (d) => pieces(d).join(d.name === "TABLE" ? " " + RET + " " : " ");
var rawOf = (d) => pieces(d).join(d.name === "TABLE" ? "\n" : " ") + d.comments.map((c) => " # " + c).join("");
function whyOf([kw, v]) {
  if (kw === "CITED") return v !== "" ? v : "no reason given";
  if (kw === "EARNED") return v !== "" ? "added after a failed test (" + v + ")" : "added after a failed test";
  return v !== "" ? "anchored to " + v : "anchored (no reference given)";
}
function pinParts(d) {
  const a = d.args;
  const sp = spansOf(a);
  let eq = -1;
  for (let i = 0; i < a.length; i++) if (a[i] === "=" && !inside(sp, i)) {
    eq = i;
    break;
  }
  const words2 = trimWS(eq < 0 ? a : a.slice(0, eq)).split(/[ \t]+/);
  const kind = words2[0] || "", name = words2[1] || "";
  let shown2, empty = false;
  if (eq >= 0) {
    shown2 = [trimWS(a.slice(eq + 1)), ...d.cont].filter((x) => x !== "").join(" ");
    empty = shown2 === "";
  } else shown2 = textOf(d);
  const kp = kind !== "" ? PIN_KIND.has(kind) ? PIN_KIND.get(kind) : kind : "no kind";
  const label2 = (name !== "" ? name : "(unnamed pin)") + " (" + kp + (empty ? ", empty value" : "") + ")";
  return { shown: shown2, label: label2, base: "PIN" + (name !== "" ? ":" + name : "") };
}
function explain_contract(primaryText) {
  if (typeof primaryText !== "string") throw new TypeError("primaryText must be a string");
  const { dirs, stray } = parse(primaryText);
  const head = (n, legacy) => {
    const l = dirs.filter((d) => d.name === n).concat(dirs.filter((d) => d.name === legacy));
    return l.find((d) => textOf(d) !== "") || l[0] || null;
  };
  const hu = head("UNIT", "SIR");
  const unit = hu && textOf(hu) !== "" ? textOf(hu) : "(unnamed)";
  const summary2 = [];
  const hk = head("KIND", "KIND");
  if (hk && textOf(hk) !== "") {
    const t = textOf(hk);
    summary2.push(KIND_PHRASE.has(t) ? KIND_PHRASE.get(t) : "Kind: " + t + " (not a kind SIR defines).");
  }
  const hf = head("FIDELITY", "VARIANT");
  if (hf && textOf(hf) !== "") {
    const t = textOf(hf);
    summary2.push(FID_PHRASE.has(t) ? FID_PHRASE.get(t) : "Fidelity: " + t + " (not a fidelity SIR defines).");
  }
  for (const d of dirs) {
    if (d.name !== "ANCHOR") continue;
    const s = textOf(d).replace(/\.+$/, "");
    if (s !== "") {
      summary2.push("Anchored to " + s + ".");
      break;
    }
  }
  const sd = dirs.find((d) => d.name === "SIG");
  const sig = sd ? textOf(sd) : null;
  const members = /* @__PURE__ */ new Set();
  for (const s of SECTIONS) if (Array.isArray(s[3])) for (const [n] of s[3]) members.add(n);
  members.add("PINNED");
  members.add("CARRIED");
  const isR = (n) => /^R[0-9]+$/.test(n);
  const counts = /* @__PURE__ */ new Map();
  const nextId = (base) => {
    const k = (counts.get(base) || 0) + 1;
    counts.set(base, k);
    return k === 1 ? base : base + " #" + k;
  };
  const mk = (d, base, label2, shown2) => {
    const it = { id: nextId(base) };
    if (label2 !== null) it.label = label2;
    it.text = shown2;
    it.why = d.attrs.map(whyOf);
    it.raw = rawOf(d);
    it.rawWhy = d.attrs.map(([k, v]) => v !== "" ? k + " " + v : k);
    it.line = d.line;
    return it;
  };
  const sections = [];
  for (const [id, title, checked, spec] of SECTIONS) {
    const items = [];
    if (Array.isArray(spec)) {
      for (const [n, label2] of spec) for (const d of dirs) if (d.name === n) {
        let shown2 = textOf(d);
        if (n === "DEPENDS-ON" && /^none$/i.test(shown2)) shown2 = "Nothing. No other package is involved.";
        items.push(mk(d, n, label2, shown2));
      }
    } else if (spec === "R") {
      for (const d of dirs) if (isR(d.name)) items.push(mk(d, d.name, "Rule " + d.name.slice(1), textOf(d)));
    } else if (spec === "PINNED") {
      for (const d of dirs) if (d.name === "PINNED") {
        const p = pinParts(d);
        items.push(mk(d, p.base, p.label, p.shown));
      }
    } else if (spec === "CARRIED") {
      for (const d of dirs) if (d.name === "CARRIED") {
        let n = 0;
        while (n < d.args.length && !WS(d.args[n])) n++;
        items.push(mk(d, "CARRIED", d.args === "" ? "Carried data" : d.args.slice(0, n), textOf(d)));
      }
    } else if (spec === "MORE") {
      for (const d of dirs) {
        if (members.has(d.name) || isR(d.name)) continue;
        if (d.name === "BEHAVIOR" && textOf(d) === "" && d.attrs.length === 0) continue;
        const label2 = !d.known ? d.name + " (not in the SIR vocabulary)" : OTHER.has(d.name) ? OTHER.get(d.name) : d.name;
        items.push(mk(d, d.name, label2, textOf(d)));
      }
    } else if (spec === "STRAY") {
      for (const s of stray) items.push({ id: nextId("STRAY"), label: "Line " + s.line, text: s.text, why: [], raw: s.text, rawWhy: [], line: s.line });
    }
    if (items.length) sections.push({ id, title, checked, items });
  }
  return { unit, summary: summary2, sig, checks: [], sections };
}
var explain_contract_default = explain_contract;

// vendor/review-core/src/explain_diff.mjs
var explain_diff_exports = {};
__export(explain_diff_exports, {
  default: () => explain_diff_default,
  explain_diff: () => explain_diff
});
var OPEN = " 	([{,=:;|<>!&-~";
var LEAD2 = new RegExp("^[ \\t\\uFEFF]*");
var FEFF2 = new RegExp("\\uFEFF", "g");
var ATTR_SRC = "[ \\t]+(CITED|EARNED|ANCHOR)(?=[ \\t]|$)";
var trimST = (s) => s.replace(/^[ \t]+|[ \t]+$/g, "");
var fields = (s) => s.split(/[ \t]+/).filter((x) => x !== "");
function quoted(s) {
  const sp = [];
  let i = 0, prev = -2;
  while (i < s.length) {
    if (s[i] === '"' && (i === 0 || OPEN.includes(s[i - 1]) || i === prev + 1)) {
      let j = i + 1, close = -1;
      while (j < s.length) {
        const c = s[j];
        if (c === "\\") {
          j += 1;
          const cp = s.codePointAt(j);
          j += cp === void 0 ? 0 : cp > 65535 ? 2 : 1;
          continue;
        }
        if (c === '"') {
          close = j;
          break;
        }
        j++;
      }
      if (close < 0) break;
      sp.push([i, close]);
      prev = close;
      i = close + 1;
    } else i++;
  }
  return sp;
}
var inside2 = (sp, p) => sp.some(([a, b]) => a < p && p < b);
function splitAttr(piece) {
  const sp = quoted(piece);
  const re = new RegExp(ATTR_SRC, "g");
  const marks = [];
  let m;
  while ((m = re.exec(piece)) !== null) {
    const ks = m.index + m[0].length - m[1].length;
    if (inside2(sp, ks)) continue;
    marks.push({ idx: m.index, kw: m[1], end: m.index + m[0].length });
  }
  const body = marks.length ? trimST(piece.slice(0, marks[0].idx)) : trimST(piece);
  const attrs = marks.map((mk, k) => [mk.kw, trimST(piece.slice(mk.end, k + 1 < marks.length ? marks[k + 1].idx : void 0))]);
  return [body, attrs];
}
function splitTrailing(content) {
  const sp = quoted(content);
  for (let i = 1; i < content.length; i++) {
    if (content[i] === "#" && (content[i - 1] === " " || content[i - 1] === "	") && (i + 1 === content.length || content[i + 1] === " " || content[i + 1] === "	") && !inside2(sp, i)) {
      return [content.slice(0, i).replace(/[ \t]+$/, ""), trimST(content.slice(i + 1))];
    }
  }
  return [content, null];
}
function parse2(text) {
  const ds = [], strays = [];
  let cur = null;
  text.split(/\r\n|\r|\n/).forEach((raw, ix) => {
    const no = ix + 1;
    const m = LEAD2.exec(raw)[0];
    let line = m.replace(FEFF2, "") + raw.slice(m.length);
    line = line.replace(/[ \t]+$/, "");
    if (line === "") return;
    const ind = /^[ \t]*/.exec(line)[0];
    const content = line.slice(ind.length);
    if (content[0] === "#") {
      if (cur) cur.comments.push(content.replace(/^#+[ \t]?/, ""));
      else strays.push({ no, text: content });
      return;
    }
    const [code, tc] = splitTrailing(content);
    if (ind.length === 0) {
      let name = /^[^ \t]*/.exec(code)[0];
      const rest = code.slice(name.length);
      if (/^[A-Z][A-Z0-9-]*:$/.test(name)) name = name.slice(0, -1);
      if (/^[A-Z][A-Z0-9-]*$/.test(name) && name !== "CITED") {
        const [args, attrs2] = splitAttr(rest);
        cur = { name, args, attrs: attrs2, pieces: [], comments: tc !== null ? [tc] : [] };
        ds.push(cur);
        return;
      }
    }
    if (!cur) {
      strays.push({ no, text: content });
      return;
    }
    const [body, attrs] = splitAttr(" " + code);
    for (const a of attrs) cur.attrs.push(a);
    if (body !== "") cur.pieces.push(body);
    if (tc !== null) cur.comments.push(tc);
  });
  return { ds, strays };
}
var joined = (d) => [d.args, ...d.pieces].filter((x) => x !== "").join(d.name === "TABLE" ? " \u23CE " : " ");
var rawOf2 = (d) => [d.args, ...d.pieces].filter((x) => x !== "").join(d.name === "TABLE" ? "\n" : " ") + (d.comments.length ? " # " + d.comments.join(" # ") : "");
var PINKINDS = /* @__PURE__ */ new Map([["regex", "pattern"], ["charset", "character set"], ["grammar", "grammar"], ["text", "exact text"], ["set", "set"], ["const", "constant"], ["constant", "constant"], ["names", "names"], ["number", "number"], ["chars", "characters"], ["order", "order"], ["map", "mapping"], ["bytes", "bytes"]]);
var OTHER2 = /* @__PURE__ */ new Map([["ORACLE", "The tests (file and fingerprint)"], ["ORACLE-CLASS", "Kind of tests"], ["STATE", "What it changes in place"], ["SEAM", "Export shape"], ["TRACE-SEAM", "Effect boundary"], ["SRC", "Source location"], ["EFFECT", "Effect"], ["SURFACE", "Module surface"], ["EMIT", "Emits"], ["REQUEST", "Requests"], ["BRANCH", "Branch"], ["ON-ERROR", "On error"], ["PAR", "Unordered window"], ["RING", "Token ring"], ["LIFECYCLE", "Resource lifecycle"], ["REACH", "Off-path unit"], ["TRIGGER", "Trigger"], ["EARNED", "Earned rule"], ["BEHAVIOR", "Behavior header"]]);
var KNOWN = /* @__PURE__ */ new Set(["SIR", "VARIANT", "SHAPE", "CANONICAL-SHA256", "AUTHORITY", "CARRIED-DATA", "NOTES", "GUARD-PINNED", "LANG", "PRIMARY-SHA256", "ABI", "MECHANISM", "CITED", "R11"]);
var NAMED = /* @__PURE__ */ new Set(["UNIT", "KIND", "FIDELITY", "ANCHOR", "DESCRIPTION", "SIG", "ENVELOPE", "UNGUARDED-PRECONDITION", "OUT-OF-DOMAIN", "PINNED", "TABLE", "CARRIED", "DEPENDS-ON", "INVARIANT", "SCOPE", "NOTE", "RATIONALE", "PROVENANCE"]);
var isRule = (n) => /^R[0-9]+$/.test(n);
var S_KIND = "What kind of unit it is";
var S_FOR = "What it is for";
var S_ACC = "What it accepts";
var S_DOES = "What it does";
var S_PIN = "Exact definitions";
var S_TAB = "Decision table";
var S_CAR = "Data it carries";
var S_DEP = "What it depends on";
var S_OTH = "Other parts of the contract";
var S_STRAY = "Text outside any directive";
var S_INV = "Should always hold";
var S_SCOPE = "In and out of scope";
var S_BG = "Background";
function listItems(text) {
  const { ds, strays } = parse2(text);
  const out = [];
  const mk = (section, tested, base, label2, d, shown2) => {
    const cites = d.attrs.map(([k, v]) => v === "" ? k : k + " " + v);
    const whys = d.attrs.map(([k, v]) => k === "CITED" ? v === "" ? "no reason given" : v : k === "EARNED" ? v === "" ? "added after a failed test" : "added after a failed test (" + v + ")" : v === "" ? "anchored (no reference given)" : "anchored to " + v);
    out.push({ section, tested, base, label: label2, raw: rawOf2(d), text: shown2 === void 0 ? joined(d) : shown2, cites, whys });
  };
  const plain = (section, tested, names, labels) => {
    names.forEach((n, k) => {
      for (const d of ds) if (d.name === n) mk(section, tested, n, labels ? labels[k] : null, d);
    });
  };
  plain(S_KIND, true, ["UNIT", "KIND", "FIDELITY", "ANCHOR"], ["Name", "Kind", "Fidelity", "Anchor"]);
  plain(S_FOR, false, ["DESCRIPTION"]);
  plain(S_ACC, true, ["SIG", "ENVELOPE", "UNGUARDED-PRECONDITION", "OUT-OF-DOMAIN"], ["Signature", "Inputs it is verified on", "Assumes, without checking", "Not covered"]);
  for (const d of ds) if (isRule(d.name)) mk(S_DOES, true, d.name, "Rule " + d.name.slice(1), d);
  for (const d of ds) {
    if (d.name !== "PINNED") continue;
    const sp = quoted(d.args);
    let eq = -1;
    for (let i = 0; i < d.args.length; i++) if (d.args[i] === "=" && !inside2(sp, i)) {
      eq = i;
      break;
    }
    const f = fields(eq < 0 ? d.args : d.args.slice(0, eq));
    const kw = f[0] || "", nm = f[1] || "";
    let shown2;
    if (eq >= 0) shown2 = [trimST(d.args.slice(eq + 1)), ...d.pieces].filter((x) => x !== "").join(" ");
    else shown2 = joined(d);
    const phrase = PINKINDS.has(kw) ? PINKINDS.get(kw) : kw || "no kind";
    const label2 = (nm || "(unnamed pin)") + " (" + phrase + (eq >= 0 && shown2 === "" ? ", empty value" : "") + ")";
    mk(S_PIN, true, nm ? "PIN:" + nm : "PIN", label2, d, shown2);
  }
  plain(S_TAB, true, ["TABLE"]);
  for (const d of ds) if (d.name === "CARRIED") mk(S_CAR, true, "CARRIED", fields(d.args)[0] || "Carried data", d);
  for (const d of ds) {
    if (d.name !== "DEPENDS-ON") continue;
    const j = joined(d);
    mk(S_DEP, true, "DEPENDS-ON", null, d, /^[Nn][Oo][Nn][Ee]$/.test(j) ? "Nothing. No other package is involved." : j);
  }
  for (const d of ds) {
    if (NAMED.has(d.name) || isRule(d.name)) continue;
    if (d.name === "BEHAVIOR" && joined(d) === "" && d.attrs.length === 0) continue;
    const label2 = OTHER2.has(d.name) ? OTHER2.get(d.name) : KNOWN.has(d.name) ? d.name : d.name + " (not in the SIR vocabulary)";
    mk(S_OTH, true, d.name, label2, d);
  }
  for (const s of strays) out.push({ section: S_STRAY, tested: true, base: "STRAY", label: "Line " + s.no, raw: s.text, text: s.text, cites: [], whys: [] });
  plain(S_INV, false, ["INVARIANT"]);
  plain(S_SCOPE, false, ["SCOPE"]);
  plain(S_BG, false, ["NOTE", "RATIONALE", "PROVENANCE"], ["Note", "Why", "Where it came from"]);
  const counts = /* @__PURE__ */ new Map();
  for (const it of out) {
    const k = (counts.get(it.base) || 0) + 1;
    counts.set(it.base, k);
    it.id = k === 1 ? it.base : it.base + " #" + k;
  }
  return { items: out, ds };
}
function diff(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/), n = A.length, m = B.length;
  const L = [];
  for (let i2 = 0; i2 <= n; i2++) L.push(new Int32Array(m + 1));
  for (let i2 = n - 1; i2 >= 0; i2--)
    for (let j2 = m - 1; j2 >= 0; j2--)
      L[i2][j2] = A[i2] === B[j2] ? L[i2 + 1][j2 + 1] + 1 : Math.max(L[i2 + 1][j2], L[i2][j2 + 1]);
  const s1 = [];
  const push = (op, t) => {
    const l = s1[s1.length - 1];
    if (l && l.op === op) l.text += t;
    else s1.push({ op, text: t });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      push("=", A[i]);
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) {
      push("-", A[i]);
      i++;
    } else {
      push("+", B[j]);
      j++;
    }
  }
  while (i < n) push("-", A[i++]);
  while (j < m) push("+", B[j++]);
  const out = [];
  let k = 0;
  while (k < s1.length) {
    const e = s1[k];
    if (e.op === "=") {
      out.push(e);
      k++;
      continue;
    }
    let del = "", ins = "", last = k, ds = "", is = "";
    for (let q = k; q < s1.length; q++) {
      const x = s1[q];
      if (x.op === "-") {
        del += x.text;
        last = q;
        ds = del;
        is = ins;
      } else if (x.op === "+") {
        ins += x.text;
        last = q;
        ds = del;
        is = ins;
      } else {
        const t = x.text.trim();
        if (q < s1.length - 1 && (t === "" || t.split(/\s+/).length <= 2)) {
          del += x.text;
          ins += x.text;
        } else break;
      }
    }
    if (ds !== "") out.push({ op: "-", text: ds });
    if (is !== "") out.push({ op: "+", text: is });
    k = last + 1;
  }
  return out.filter((x) => x.text !== "");
}
var sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
var gkey = (it) => it.section + "\n" + it.id.replace(/ #\d+$/, "");
var firstNonEmpty = (ds, name) => {
  for (const d of ds) if (d.name === name && joined(d) !== "") return d;
  return null;
};
var header = (ds) => {
  const f = firstNonEmpty(ds, "FIDELITY") || firstNonEmpty(ds, "VARIANT");
  const a = firstNonEmpty(ds, "ANCHOR");
  return { fid: f ? joined(f) : null, ref: a ? fields(joined(a))[0] : void 0 };
};
function explain_diff(before, after, oracleChanged, langs) {
  const B = listItems(before), A = listItems(after);
  const groups = [], gb = /* @__PURE__ */ new Map(), ga = /* @__PURE__ */ new Map();
  const touch = (it, mp) => {
    const k = gkey(it);
    if (!mp.has(k)) {
      mp.set(k, []);
      if (!groups.includes(k)) groups.push(k);
    }
    mp.get(k).push(it);
  };
  B.items.forEach((it) => touch(it, gb));
  A.items.forEach((it) => touch(it, ga));
  const pairOf = /* @__PURE__ */ new Map(), pairedB = /* @__PURE__ */ new Set();
  const leftoverB = [];
  for (const k of groups) {
    const bs = gb.get(k) || [], as = ga.get(k) || [];
    const usedA = /* @__PURE__ */ new Set();
    const rest = [];
    for (const b of bs) {
      const a = as.find((x) => !usedA.has(x) && x.raw === b.raw && sameList(x.cites, b.cites));
      if (a) {
        usedA.add(a);
        pairOf.set(a, b);
        pairedB.add(b);
      } else rest.push(b);
    }
    const restA = as.filter((x) => !usedA.has(x));
    rest.forEach((b, i) => {
      if (i < restA.length) {
        pairOf.set(restA[i], b);
        pairedB.add(b);
      } else leftoverB.push(b);
    });
  }
  const changes = [];
  for (const a of A.items) {
    const label2 = a.label === null ? a.section : a.label;
    const b = pairOf.get(a);
    if (!b) {
      changes.push({ c: { checked: a.tested, id: a.id, kind: "added", label: label2, section: a.section, text: a.text }, after: a });
    } else if (!(a.raw === b.raw && sameList(a.cites, b.cites))) {
      let d = diff(b.text, a.text);
      if (!d.some((x) => x.op !== "=")) d = diff(b.raw, a.raw);
      const why = sameList(a.cites, b.cites) ? null : diff(b.cites.join("; "), a.cites.join("; "));
      changes.push({ c: { checked: a.tested, diff: d, id: a.id, kind: "changed", label: label2, section: a.section, whyDiff: why }, after: a });
    }
  }
  for (const b of leftoverB) {
    changes.push({ c: { checked: b.tested, id: b.id, kind: "removed", label: b.label === null ? b.section : b.label, section: b.section, text: b.text }, after: null });
  }
  const tested = changes.filter((x) => x.c.checked);
  const N = tested.length;
  const warnings = [];
  if (N > 0 && oracleChanged === false) {
    const kinds = new Set(tested.map((x) => x.c.kind));
    const verbs = ["changed", "added", "removed"].filter((v) => kinds.has(v)).join(" or ");
    const labels = [];
    for (const x of tested) if (!labels.includes(x.c.label)) labels.push(x.c.label);
    warnings.push({
      kind: "untested-change",
      level: "stop",
      text: N + (N === 1 ? " tested part was " : " tested parts were ") + verbs + " (" + labels.join(", ") + "), but the tests did not change. Nothing in this PR proves the new behavior: the hidden tests still expect the old one."
    });
  }
  const hb = header(B.ds), ha = header(A.ds);
  if (hb.fid === "package" || ha.fid === "package") {
    const refs = [hb.ref, ha.ref].filter((r) => r !== void 0 && r.includes("@"));
    const citing = [];
    for (const x of tested) {
      if (x.c.kind !== "changed") continue;
      const idx = x.after.cites.findIndex((e) => e.includes("FIDELITY package") || fields(e).some((t) => refs.includes(t.replace(/[.,;:)\]]+$/, ""))));
      if (idx >= 0) citing.push({ label: x.c.label, why: x.after.whys[idx] });
    }
    if (citing.length) {
      let q = citing[0].why;
      const pre = "FIDELITY package \u2014 ";
      if (q.startsWith(pre)) q = q.slice(pre.length);
      const cps = Array.from(q);
      if (cps.length > 110) q = cps.slice(0, 109).join("") + "\u2026";
      warnings.push({
        kind: "citation",
        level: "stop",
        text: "This contract promises to match the original package exactly, and " + citing.map((c) => c.label).join(" and ") + " still " + (citing.length === 1 ? "cites" : "cite") + ' that package as the reason for the old behavior ("' + q + '"). The edit contradicts its own citation.'
      });
    }
  }
  if (N === 0 && changes.length > 0) {
    warnings.push({ kind: "prose-only", level: "ok", text: "Only unchecked prose changed. The code is held to exactly what it was held to before." });
  }
  if (N > 0) {
    const stale = [];
    for (const l of langs) if (l !== "" && !stale.includes(l)) stale.push(l);
    if (stale.length) {
      const nm = /* @__PURE__ */ new Map([["js", "JavaScript"], ["ts", "TypeScript"], ["rust", "Rust"]]);
      const names = stale.map((l) => nm.has(l) ? nm.get(l) : l).join(", ");
      warnings.push({
        kind: "stale-langs",
        level: "note",
        text: "The " + names + (stale.length === 1 ? " file was written against the old version. It goes out of date until someone reviews it against this one and re-binds it." : " files were written against the old version. They go out of date until someone reviews them against this one and re-binds them.")
      });
    }
  }
  const uf = firstNonEmpty(A.ds, "UNIT") || firstNonEmpty(A.ds, "SIR");
  return { changes: changes.map((x) => x.c), unit: uf ? joined(uf) : "(unnamed)", warnings };
}
var explain_diff_default = explain_diff;

// vendor/review-core/src/oracle_diff.mjs
var oracle_diff_exports = {};
__export(oracle_diff_exports, {
  oracle_diff: () => oracle_diff
});
var IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
var ESCAPED = new RegExp("\\\\u([0-9a-f]{4})", "g");
var CONTROL = new RegExp("[\\u0000-\\u001f\\u007f-\\u009f]", "g");
var BITS = /^[0-9a-f]{16}$/;
var NAMES = { 0: "NUL", 7: "BEL", 9: "\\t", 10: "\\n", 13: "\\r", 27: "ESC", 155: "CSI" };
var FAIL = { fail: true };
var MARK = "!absent";
var has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
var isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
function keyOf(v, depth = 0) {
  if (depth > 2e3) return "!deep";
  if (v === null) return "z";
  if (v === void 0) return "u";
  if (typeof v === "number") return "n" + (Object.is(v, -0) ? "-0" : String(v));
  if (typeof v === "string") return "s" + JSON.stringify(v);
  if (typeof v === "boolean") return "b" + v;
  if (Array.isArray(v)) return "[" + v.map((x) => keyOf(x, depth + 1)).join(",") + "]";
  return "{" + Object.keys(v).map((k) => JSON.stringify(k) + ":" + keyOf(v[k], depth + 1)).join(",") + "}";
}
function label(c) {
  const n = NAMES[c] !== void 0 ? NAMES[c] : "U+" + c.toString(16).toUpperCase().padStart(4, "0");
  return "\u2039" + n + "\u203A";
}
var isCtl = (c) => c <= 31 || c >= 127 && c <= 159;
function naming(d) {
  d = d.replace(ESCAPED, (m, h) => {
    const c = parseInt(h, 16);
    return isCtl(c) ? label(c) : m;
  });
  return d.replace(CONTROL, (ch) => label(ch.charCodeAt(0)));
}
function textOf2(x) {
  if (typeof x === "string") return x;
  if (x === void 0) return "undefined";
  if (x === null) return "null";
  if (typeof x === "object") return JSON.stringify(x);
  return String(x);
}
function field(n) {
  if (typeof n === "string") return IDENT.test(n) ? n : JSON.stringify(n);
  if (n !== null && typeof n === "object") return JSON.stringify(n);
  return String(n);
}
function joinPart(p) {
  if (typeof p === "string") return p;
  if (p === void 0 || p === null) return "";
  return textOf2(p);
}
function disp(x) {
  if (x === void 0 || x === null) throw FAIL;
  if (!isMap(x)) return "?";
  const t = has(x, "t") ? x.t : void 0;
  const v = has(x, "v") ? x.v : void 0;
  if (typeof t !== "string") return "?";
  switch (t) {
    case "none":
      return "null";
    case "undefined":
      return "undefined";
    case "bool":
      return textOf2(v);
    case "bigint":
      return textOf2(v) + "n";
    case "text":
      return JSON.stringify(v);
    case "f64":
    case "i64":
    case "u64":
    case "bytes":
      return v;
    case "throw": {
      const m = has(x, "msg") ? x.msg : void 0;
      return "throw(" + JSON.stringify(m === void 0 || m === null ? "" : m) + ")";
    }
    case "list":
    case "tuple":
      if (!Array.isArray(v)) throw FAIL;
      return "[" + v.map((e) => joinPart(disp(e))).join(",") + "]";
    case "map":
    case "record": {
      if (!Array.isArray(v)) throw FAIL;
      const parts = v.map((e) => {
        if (e === null || typeof e === "boolean" || typeof e === "number" || isMap(e)) throw FAIL;
        if (t === "map") return textOf2(disp(e[0])) + ":" + textOf2(disp(e[1]));
        return field(e[0]) + ":" + textOf2(disp(e[1]));
      });
      return "{" + parts.join(t === "map" ? "," : ", ") + "}";
    }
    default:
      return "?";
  }
}
function shown(x) {
  try {
    let d;
    try {
      d = disp(x);
    } catch (e) {
      d = "?";
    }
    if (typeof d !== "string" || d === "?") d = JSON.stringify(x) ?? "undefined";
    return naming(d);
  } catch (e) {
    return "?";
  }
}
function canonical(x) {
  const st = [[x, 0]];
  while (st.length) {
    const [v, d] = st.pop();
    if (d > 416) return false;
    if (v === void 0 || v === null || typeof v === "number") return false;
    if (typeof v === "string" || typeof v === "boolean") continue;
    if (Array.isArray(v)) {
      for (const e of v) st.push([e, d + 1]);
      continue;
    }
    if (has(v, "t") && v.t === "f64") {
      if (d + 1 > 416) return false;
      if (!(typeof v.bits === "string" && BITS.test(v.bits))) return false;
      continue;
    }
    if (has(v, "t") && v.t === "throw") {
      if (d + 1 > 416) return false;
      continue;
    }
    for (const k of Object.keys(v)) st.push([v[k], d + 1]);
  }
  return true;
}
var nodeT = (v, t) => has(v, "t") && v.t === t;
function canonEq(a, b) {
  if (typeof a === "string" || typeof b === "string") return a === b;
  if (typeof a === "boolean" || typeof b === "boolean") return a === b;
  const aa = Array.isArray(a), ba = Array.isArray(b);
  if (aa || ba) {
    if (!(aa && ba) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!canonEq(a[i], b[i])) return false;
    return true;
  }
  if (!isMap(a) || !isMap(b)) return false;
  const af = nodeT(a, "f64"), bf = nodeT(b, "f64");
  if (af || bf) return af && bf && a.bits === b.bits;
  const at2 = nodeT(a, "throw"), bt = nodeT(b, "throw");
  if (at2 || bt) return at2 && bt;
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!has(b, k)) return false;
    if (!canonEq(a[k], b[k])) return false;
  }
  return true;
}
function equal(x, y) {
  if (canonical(x) && canonical(y)) return canonEq(x, y);
  return keyOf(x) === keyOf(y);
}
function changedKeys(X, Y) {
  const ks = /* @__PURE__ */ new Set([...X.keys(), ...Y.keys()]);
  const out = [];
  for (const k of [...ks].sort()) {
    const a = X.has(k) ? keyOf(X.get(k)) : MARK;
    const b = Y.has(k) ? keyOf(Y.get(k)) : MARK;
    if (a !== b) out.push(k);
  }
  return out;
}
function tooDeep(root) {
  const st = [[root, 0]];
  while (st.length) {
    const [v, d] = st.pop();
    if (d > 2e3) return true;
    if (v !== null && typeof v === "object") {
      if (Array.isArray(v)) {
        for (const e of v) st.push([e, d + 1]);
      } else for (const k of Object.keys(v)) st.push([v[k], d + 1]);
    }
  }
  return false;
}
function read(text) {
  const r = { shape: "unparseable", cases: [], file: /* @__PURE__ */ new Map() };
  let p;
  try {
    p = JSON.parse(text);
  } catch (e) {
    return r;
  }
  if (!isMap(p) || !has(p, "frozen") || !has(p, "heldout") || !Array.isArray(p.frozen) || !Array.isArray(p.heldout)) {
    r.shape = "unknown-shape";
    return r;
  }
  if (tooDeep(p)) {
    r.shape = "too-deep";
    return r;
  }
  let junk = false;
  const counts = /* @__PURE__ */ new Map();
  let k = 0;
  for (const [list, hidden] of [[p.frozen, false], [p.heldout, true]]) {
    for (const c of list) {
      if (!isMap(c)) {
        junk = true;
        continue;
      }
      const hn = has(c, "name");
      const id = JSON.stringify([hn ? keyOf(c.name) : null, hn]);
      const n = (counts.get(id) || 0) + 1;
      counts.set(id, n);
      let name = hn ? typeof c.name === "string" ? c.name : JSON.stringify(c.name) : "(no name)";
      if (n >= 2) name += " (#" + n + ")";
      const other = /* @__PURE__ */ new Map();
      for (const key of Object.keys(c)) if (key !== "name" && key !== "args" && key !== "expected") other.set(key, c[key]);
      k++;
      r.cases.push({
        key: JSON.stringify([id, n]),
        name,
        hidden,
        args: has(c, "args") ? c.args : void 0,
        expected: has(c, "expected") ? c.expected : void 0,
        other
      });
    }
  }
  r.shape = junk ? "malformed-cases" : "ok";
  for (const key of Object.keys(p)) if (key !== "frozen" && key !== "heldout" && key !== "canonicalSha256") r.file.set(key, p[key]);
  return r;
}
function input(c) {
  if (Array.isArray(c.args)) return c.args.map(shown).join(", ");
  return "(args: " + shown(c.args) + ")";
}
function oracle_diff(before, after) {
  const B = read(before), A = read(after);
  const bm = new Map(B.cases.map((c) => [c.key, c]));
  const am = new Map(A.cases.map((c) => [c.key, c]));
  const res = { before: B.shape, after: A.shape, added: [], removed: [], rewritten: [], inputsChanged: [], moved: [], otherChanged: [], fileChanged: [], reordered: false };
  for (const c of A.cases) {
    const o = bm.get(c.key);
    if (!o) {
      res.added.push({ name: c.name, hidden: c.hidden, input: input(c), to: shown(c.expected) });
      continue;
    }
    const argsDiff = !equal(o.args, c.args);
    if (argsDiff) res.inputsChanged.push({ name: c.name, hidden: c.hidden, from: input(o), to: input(c) });
    if (!equal(o.expected, c.expected)) {
      res.rewritten.push({ name: c.name, hidden: c.hidden, input: input(c), from: shown(o.expected), to: shown(c.expected), inputChanged: argsDiff });
    }
    if (o.hidden !== c.hidden) res.moved.push({ name: c.name, from: o.hidden ? "hidden" : "visible", to: c.hidden ? "hidden" : "visible" });
    const ck = changedKeys(o.other, c.other);
    if (ck.length) res.otherChanged.push({ name: c.name, keys: ck });
  }
  for (const c of B.cases) {
    if (!am.has(c.key)) res.removed.push({ name: c.name, hidden: c.hidden, input: input(c), to: shown(c.expected) });
  }
  res.fileChanged = changedKeys(B.file, A.file);
  const bs = B.cases.filter((c) => am.has(c.key)).map((c) => c.key);
  const as = A.cases.filter((c) => bm.has(c.key)).map((c) => c.key);
  res.reordered = bs.length !== as.length || bs.some((k, i) => k !== as[i]);
  return res;
}

// vendor/review-core/src/binding_of.mjs
var binding_of_exports = {};
__export(binding_of_exports, {
  bindingOf: () => bindingOf
});
var import_node_crypto = require("node:crypto");
var ARGUMENT = /^[0-9a-f]{64}$/;
var SPLIT_LINES = /\r\n|\r|\n/;
var TRAILING_COMMENT = /^(.*?)(?:^|\s)#(?=\s|$)(.*)$/;
var HEAD = /^(\S+)(?:\s+(.*))?$/;
var NAME_COLON = /^[A-Z][A-Z0-9-]*:$/;
var DIRECTIVE = /^(?:[A-Z][A-Z0-9-]*|R\d+)$/;
var ATTR = /\s+(CITED|EARNED|ANCHOR)\s+(.+)$/;
var LEAD_RUN = new RegExp("^[ \\t\\uFEFF]*");
var FEFF_ALL = new RegExp("\\uFEFF", "g");
var sha = (s) => (0, import_node_crypto.createHash)("sha256").update(s).digest("hex");
function wellFormed(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 55296 && c <= 56319) {
      const d = s.charCodeAt(i + 1);
      if (d >= 56320 && d <= 57343) i++;
      else return false;
    } else if (c >= 56320 && c <= 57343) return false;
  }
  return true;
}
function cleanLine(line) {
  const lead = LEAD_RUN.exec(line)[0];
  const rest = line.slice(lead.length);
  return (lead.replace(FEFF_ALL, "") + rest).replace(/[ \t]+$/, "");
}
function canonical2(text) {
  const kept = [];
  for (const raw of text.split(SPLIT_LINES)) {
    let l = cleanLine(raw);
    if (l === "") continue;
    const m = /^[ \t]+/.exec(l);
    if (m) l = "  " + l.slice(m[0].length);
    kept.push(l);
  }
  return kept.length ? kept.join("\n") + "\n" : "";
}
function directiveName(line) {
  const i = line.search(/[ \t]/);
  let name = i < 0 ? line : line.slice(0, i);
  if (NAME_COLON.test(name)) {
    const b = name.slice(0, -1);
    if (b !== "CITED") name = b;
  }
  return { name, end: i < 0 ? line.length : i };
}
function classify(line) {
  if (line === "") return { kind: "blank" };
  if (line.replace(/^[ \t]+/, "").startsWith("#")) return { kind: "comment" };
  if (line[0] === " " || line[0] === "	") return { kind: "cont" };
  const { name, end } = directiveName(line);
  if (name !== "CITED" && DIRECTIVE.test(name)) return { kind: "dir", name, end };
  return { kind: "cont" };
}
function readBound(langText) {
  const lines = langText.split(SPLIT_LINES).map(cleanLine);
  const cls = lines.map(classify);
  let d = -1;
  for (let i = 0; i < lines.length; i++) {
    if (cls[i].kind === "dir" && cls[i].name === "PRIMARY-SHA256") {
      d = i;
      break;
    }
  }
  if (d < 0) return null;
  let arg = lines[d].slice(cls[d].end);
  const cm = /[ \t]#(?=[ \t]|$)/.exec(arg);
  if (cm) arg = arg.slice(0, cm.index);
  arg = arg.replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
  if (!ARGUMENT.test(arg)) return null;
  for (let i = d + 1; i < lines.length; i++) {
    if (cls[i].kind === "dir") break;
    if (lines[i] === "") continue;
    if (cls[i].kind !== "comment") return null;
  }
  return arg;
}
function addAttr(map, k, v) {
  if (map.has(k)) {
    const old = map.get(k);
    map.set(k, old === "" ? v : old + " " + v);
  } else map.set(k, v);
}
function attributes(s) {
  const attrs = /* @__PURE__ */ new Map();
  for (; ; ) {
    const m = ATTR.exec(s);
    if (!m) break;
    addAttr(attrs, m[1], m[2].trim());
    s = s.slice(0, m.index);
  }
  return { body: s.trim(), attrs };
}
function legacyPrint(text) {
  const entries = [];
  let cur = null;
  for (let piece of text.split("\n")) {
    piece = piece.replace(/\r$/, "");
    if (/^\s*$/.test(piece)) continue;
    const indent = /^[ \t]*/.exec(piece)[0];
    const content = piece.slice(indent.length);
    if (content.startsWith("#")) continue;
    const tm = TRAILING_COMMENT.exec(content);
    const code = tm ? tm[1].replace(/\s+$/, "") : content;
    if (indent === "") {
      let head = null;
      if (code !== "" && !/^\s/.test(code)) {
        const hm = HEAD.exec(code);
        if (hm) {
          let name = hm[1];
          if (NAME_COLON.test(name)) name = name.slice(0, -1);
          if (DIRECTIVE.test(name)) head = { name, rest: hm[2] === void 0 ? "" : hm[2] };
        }
      }
      if (head) {
        const { body, attrs } = attributes(head.rest);
        cur = { name: head.name, args: body, attrs, conts: [] };
        entries.push(cur);
      } else if (cur) cur.conts.push(code);
    } else if (cur) {
      const { body, attrs } = attributes(code);
      for (const [k, v] of attrs) cur.attrs.set(k, v);
      cur.conts.push(body);
    }
  }
  const out = [];
  for (const e of entries) {
    let l = e.name;
    if (e.args !== "") l += " " + e.args;
    for (const [k, v] of e.attrs) l += " " + k + " " + v;
    out.push(l);
    for (const c of e.conts) out.push("  " + c);
  }
  return out.length ? out.join("\n") + "\n" : "\n";
}
function bindingOf(langText, primaryText) {
  const bound = readBound(langText);
  const isNone = primaryText === null || primaryText === void 0;
  let primarySha = null;
  if (!isNone && wellFormed(primaryText)) primarySha = sha(canonical2(primaryText));
  let status;
  if (isNone) status = "no-primary";
  else if (bound === null) status = "unbound";
  else if (bound === primarySha) status = "ok";
  else if (primarySha !== null && bound === sha(legacyPrint(primaryText))) status = "legacy";
  else status = "stale";
  return { status, bound, primarySha };
}

// vendor/review-core/src/vector_set_sha.mjs
var vector_set_sha_exports = {};
__export(vector_set_sha_exports, {
  default: () => vector_set_sha
});
var import_node_crypto2 = require("node:crypto");
var HEX16 = /^[0-9a-f]{16}$/;
var CAP = 416;
function isMap2(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function render(v, d) {
  if (d > CAP) throw new Error("nesting too deep");
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    const parts = [];
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) throw new Error("not canonical: hole");
      parts.push(render(v[i], d + 1));
    }
    return "[" + parts.join(",") + "]";
  }
  if (isMap2(v)) {
    if (v.t === "f64") {
      const bits = v.bits;
      if (typeof bits !== "string" || !HEX16.test(bits)) throw new Error("not canonical: an f64 tag without 16-hex bits");
      return '{"bits":' + render(bits, d + 1) + ',"t":' + render("f64", d + 1) + "}";
    }
    if (v.t === "throw") return '{"t":' + render("throw", d + 1) + "}";
    const keys = Object.keys(v).sort();
    const parts = [];
    for (const k of keys) parts.push(JSON.stringify(k) + ":" + render(v[k], d + 1));
    return "{" + parts.join(",") + "}";
  }
  throw new Error("not canonical: " + (v === null ? "none" : typeof v));
}
function project(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    if (!(i in list)) throw new Error("hole in case list");
    const c = list[i];
    if (!isMap2(c)) throw new Error("case is not a map");
    if (c.args === void 0 || c.expected === void 0) throw new Error("case missing args/expected");
    out.push({ args: c.args, expected: c.expected });
  }
  return out;
}
function vector_set_sha(oracle) {
  if (!isMap2(oracle)) throw new Error("oracle is not a map");
  const f = oracle.frozen;
  const h = oracle.heldout;
  if (!Array.isArray(f) || !Array.isArray(h)) throw new Error("frozen/heldout must be lists");
  const proj = { frozen: project(f), heldout: project(h) };
  const canon = render(proj, 0);
  return (0, import_node_crypto2.createHash)("sha256").update(canon, "utf8").digest("hex");
}

// vendor/review-core/src/hunk_lines.mjs
var hunk_lines_exports = {};
__export(hunk_lines_exports, {
  default: () => hunk_lines
});
var MAX_HUNK = 1e6;
var HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;
function hunk_lines(diff2) {
  const out = /* @__PURE__ */ new Set();
  for (const line of diff2.split("\n")) {
    const m = HEADER.exec(line);
    if (!m) continue;
    const C = Number(m[1]);
    const N = m[2] === void 0 ? 1 : Number(m[2]);
    if (N > MAX_HUNK || !Number.isSafeInteger(C + N - 1)) continue;
    for (let i = Math.max(C, 1); i < C + N; i++) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

// vendor/review-core/src/git_line.mjs
var git_line_exports = {};
__export(git_line_exports, {
  default: () => git_line
});
var BREAKS = /\r\n|\r|\n|$/g;
function git_line(text, lines) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!Array.isArray(lines)) throw new TypeError("lines must be an array");
  const table = [0];
  let lf = 1;
  for (const m of text.matchAll(BREAKS)) {
    table.push(lf);
    if (m[0] === "\n" || m[0] === "\r\n") lf += 1;
    if (m[0] === "") break;
  }
  return lines.map((x) => table[x] ?? lf);
}

// vendor/review-core/src/directive_spans.mjs
var directive_spans_exports = {};
__export(directive_spans_exports, {
  default: () => directive_spans
});
var LINE_BREAK = /\r\n|\r|\n/;
var LEAD3 = new RegExp("^[ \\t\\uFEFF]+");
var TRAIL = /[ \t]+$/;
var COLON_NAME = /^[A-Z][A-Z0-9-]*:$/;
var NAME_RE = /^[A-Z][A-Z0-9-]*$/;
function directive_spans(text) {
  const parts = text.split(LINE_BREAK);
  const breaks = [...text.matchAll(new RegExp(LINE_BREAK.source, "g"))];
  const starts = [];
  let git2 = 1;
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && breaks[i - 1][0] !== "\r") git2++;
    let line = parts[i].replace(LEAD3, (m) => m.replace(/﻿/g, ""));
    line = line.replace(TRAIL, "");
    if (line === "" || line[0] === " " || line[0] === "	" || line[0] === "#") continue;
    let sp = -1;
    for (let k = 0; k < line.length; k++) {
      if (line[k] === " " || line[k] === "	") {
        sp = k;
        break;
      }
    }
    let name = sp < 0 ? line : line.slice(0, sp);
    if (COLON_NAME.test(name) && name !== "CITED:") name = name.slice(0, -1);
    if (NAME_RE.test(name) && name !== "CITED") {
      if (starts.length === 0 || starts[starts.length - 1] !== git2) starts.push(git2);
    }
  }
  let last = text.split("\n").length;
  if (text.endsWith("\n")) last -= 1;
  last = Math.max(1, last);
  const out = [];
  for (let i = 0; i < starts.length; i++) {
    out.push([starts[i], i + 1 < starts.length ? starts[i + 1] - 1 : last]);
  }
  return out;
}

// vendor/review-core/src/escape_property.mjs
var escape_property_exports = {};
__export(escape_property_exports, {
  default: () => escape_property
});
function escape_property(v) {
  return String(v).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}

// vendor/review-core/src/escape_data.mjs
var escape_data_exports = {};
__export(escape_data_exports, {
  escapeData: () => escapeData
});
function escapeData(v) {
  return String(v).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

// vendor/review-core/src/annotations_text.mjs
var annotations_text_exports = {};
__export(annotations_text_exports, {
  annotations_text: () => annotations_text
});
var LEVELS = /* @__PURE__ */ new Set(["error", "warning", "notice"]);
function textOf3(v) {
  if (v === void 0 || v === null) return "";
  return String(v);
}
function prop(t) {
  return t.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
function data(t) {
  return t.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function annotations_text(findings) {
  const kept = findings.filter((f) => f !== null && typeof f === "object" && !Array.isArray(f));
  return kept.map((f) => {
    const level = LEVELS.has(f.level) ? f.level : "error";
    const L = f.line;
    const linePart = Number.isSafeInteger(L) && L > 0 ? ",line=" + String(L) : "";
    return "::" + level + " file=" + prop(textOf3(f.path)) + linePart + ",title=" + prop(textOf3(f.title)) + "::" + data(textOf3(f.message));
  }).join("\n");
}

// vendor/review-core/src/review_summary.mjs
var review_summary_exports = {};
__export(review_summary_exports, {
  default: () => review_summary
});
var LB = new RegExp("\\r\\n|\\r|\\n|\\u2028|\\u2029", "g");
var PASS_ICON = "\u2705";
var FAIL_ICON = "\u274C";
function cell(v) {
  let t = String(v === void 0 || v === null ? "" : v);
  t = t.replace(LB, " ").replace(/\|/g, "\\|");
  if (t === "") return "";
  let k = 0;
  const runs = t.match(/`+/g);
  if (runs) {
    for (const r of runs) if (r.length > k) k = r.length;
  }
  const fence = "`".repeat(k + 1);
  const pad = /^`|`$/.test(t) || /^ .* $/.test(t) && t.trim() !== "" ? " " : "";
  return fence + pad + t + pad + fence;
}
function stopsBlock(stops) {
  if (!(stops > 0)) return "";
  return `
${stops} ` + (stops === 1 ? "Stop" : "Stops") + ": each one is an annotation on its line, explained in full in the review.\n";
}
function review_summary(units, stops) {
  if (!units.length) return "## SIR review\nNo SIR contract changed.\n" + stopsBlock(stops);
  const n = units.length;
  const rows = [];
  let f = 0;
  for (let i = 0; i < n; i++) {
    const r = units[i];
    const pass = r.status === "pass";
    if (!pass) f++;
    rows.push("| " + (pass ? PASS_ICON : FAIL_ICON) + " | " + cell(r.unit) + " | " + cell(r.change) + " | " + cell(r.tests) + " | " + cell(r.bindings) + " | " + cell(r.citations) + " |");
  }
  const noun = n === 1 ? "contract" : "contracts";
  const verdict = f >= 1 ? `${FAIL_ICON} ${f} of ${n} ${noun} failing` : `${PASS_ICON} ${n} ${noun} passing`;
  return "## SIR review: " + verdict + "\n\n| | unit | change | tests | bindings | citations |\n|---|---|---|---|---|---|\n" + rows.join("\n") + "\n" + stopsBlock(stops);
}

// src/verified.mjs
var pick = (m, ...names) => {
  for (const n of names) if (typeof m[n] === "function") return m[n];
  if (typeof m.default === "function") return m.default;
  throw new Error(`review-core: no export ${names.join("/")}`);
};
var explain_contract2 = pick(explain_contract_exports, "explain_contract");
var explain_diff2 = pick(explain_diff_exports, "explain_diff");
var oracle_diff2 = pick(oracle_diff_exports, "oracle_diff");
var binding_of = pick(binding_of_exports, "bindingOf", "binding_of");
var vector_set_sha2 = pick(vector_set_sha_exports, "vector_set_sha", "vectorSetSha");
var hunk_lines2 = pick(hunk_lines_exports, "hunk_lines");
var git_line2 = pick(git_line_exports, "git_line");
var directive_spans2 = pick(directive_spans_exports, "directive_spans");
var escape_property2 = pick(escape_property_exports, "escape_property", "escapeProperty");
var escape_data = pick(escape_data_exports, "escapeData", "escape_data");
var annotations_text2 = pick(annotations_text_exports, "annotations_text");
var review_summary2 = pick(review_summary_exports, "review_summary");
var explain = (text) => explain_contract2(text);
var explainDiff = (before, after, { oracleChanged = null, langs = [] } = {}) => explain_diff2(before, after, oracleChanged, langs);
var oracleDiff = (before, after) => oracle_diff2(before, after);
var bindingOf2 = (langText, primaryText) => binding_of(langText, primaryText);
var vectorSetSha = (oracle) => vector_set_sha2(oracle);
var hunkLines = (diff2) => hunk_lines2(diff2);
var gitLine = (text) => (line) => git_line2(text, [line])[0];
var spans = (text) => new Map(directive_spans2(text));
var annotations = (findings) => annotations_text2(findings);
var summary = ({ units, stops }) => review_summary2(units, stops);

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
var at = (sha2, path) => git(["show", `${sha2}:${path}`]);
var esc = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
var chip = (checked) => checked ? "\u{1F9EA} tested" : "\u{1F4DD} note \xB7 not tested";
var words = (d) => d.map((p) => p.op === "=" ? esc(p.text) : p.op === "+" ? `<ins><b>${esc(p.text)}</b></ins>` : `<del>${esc(p.text)}</del>`).join("");
var changedLines = (base, head, path) => new Set(hunkLines(git(["diff", "-U0", base, head, "--", path]) ?? ""));
function review({ base, head, files = null }) {
  const changed = files ?? (git(["diff", "--name-only", "--diff-filter=AMDR", base, head, "--", "*.sir", "**/oracles/*.json"]) ?? "").split("\n").filter(Boolean);
  const sirChanged = changed.filter((f) => f.endsWith(".sir"));
  const primaries = /* @__PURE__ */ new Set(), langOnly = [];
  for (const f of changed.filter((x) => x.endsWith(".json"))) {
    const root = (0, import_node_path.dirname)((0, import_node_path.dirname)(f));
    const unit = (0, import_node_path.basename)(f).split(".")[0];
    const p = import_node_path.posix.join(root, "sir", `${unit}.sir`);
    if (at(head, p) !== null) primaries.add(p);
  }
  for (const f of sirChanged) {
    const m = (0, import_node_path.basename)(f).match(FAMILY_FILE);
    if (m) {
      const p = import_node_path.posix.join((0, import_node_path.dirname)(f), `${m[1]}.sir`);
      if (!sirChanged.includes(p)) langOnly.push(f);
    } else primaries.add(f);
  }
  const blocks = [], inline = [], oracleNotes = [], findings = [], units = [];
  let stops = 0;
  const plain = (s) => s.replace(/<[^>]+>/g, "");
  for (const path of primaries) {
    const before = at(base, path), after = at(head, path);
    const unit = (0, import_node_path.basename)(path, ".sir");
    const root = (0, import_node_path.basename)((0, import_node_path.dirname)(path)) === "sir" ? (0, import_node_path.dirname)((0, import_node_path.dirname)(path)) : (0, import_node_path.dirname)(path);
    if (after === null) {
      blocks.push(`### \`${path}\` \xB7 removed
The contract for \`${unit}\` is deleted in this PR.`);
      units.push({ unit, path, status: "pass", change: "contract removed", tests: "\u2013", bindings: "\u2013", citations: "\u2013" });
      continue;
    }
    const langs = (git(["ls-tree", "--name-only", head, (0, import_node_path.dirname)(path) + "/"]) ?? "").split("\n").map((f) => (0, import_node_path.basename)(f).match(FAMILY_FILE)).filter((m) => m && m[1] === unit).map((m) => ({ lang: m[2], path: import_node_path.posix.join((0, import_node_path.dirname)(path), m[0]) }));
    if (before === null) {
      const rel = after.match(/^ORACLE\b.*?->\s*(\S+)/m)?.[1];
      const declared = after.match(/^ORACLE\b.*?CANONICAL-SHA256\s+([0-9a-f]{64})/m)?.[1];
      let o = null;
      try {
        o = rel ? JSON.parse(at(head, import_node_path.posix.join(root, rel)) ?? "null") : null;
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
          const b = t2 === null ? "missing" : bindingOf2(t2, after).status;
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
          return `${l.lang} ${t2 !== null && bindingOf2(t2, after).status === "ok" ? "\u2713" : "\u2717"}`;
        }).join(" ") : "\u2013",
        citations: "\u2713"
      });
      blocks.push(`### \`${path}\` \xB7 new contract${anchor ? ` \xB7 anchored to ${esc(anchor)}` : ""}
${checks.map((c) => `> ${c}`).join("\n>\n")}

${readable(explain(after))}`);
      continue;
    }
    const oracleRel = after.match(/^ORACLE\b.*?->\s*(\S+)/m)?.[1];
    const op = oracleRel ? import_node_path.posix.join(root, oracleRel) : null;
    const oracleChanged = op ? at(base, op) !== at(head, op) : null;
    const stale = langs.filter((l) => {
      const t2 = at(head, l.path);
      return t2 !== null && bindingOf2(t2, after).status !== "ok";
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
    if (od && od.after !== "ok") {
      d.warnings.unshift({ level: "stop", kind: "oracle-unreadable", text: `After this PR the test file ${op} is ${od.after === "unparseable" ? "not valid JSON" : od.after === "malformed-cases" ? "not a valid oracle (some cases are not maps)" : od.after === "too-deep" ? "nested too deep to compare (over 2000 levels)" : "not an oracle (no frozen and heldout lists)"}: nothing can check this contract.` });
      findings.push({ level: "error", path: op, title: `${unit}: test file unreadable`, message: d.warnings[0].text });
    }
    if (!d.changes.length && !(od && (od.added.length || od.removed.length || od.rewritten.length || od.inputsChanged.length || od.moved.length || od.otherChanged.length || od.fileChanged.length || od.reordered || od.after !== "ok"))) {
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
      ...od.otherChanged.map((x) => `- Test \`${esc(x.name)}\`: its ${x.keys.map((k) => `\`${esc(k)}\``).join(", ")} changed`),
      ...od.fileChanged.map((k) => `- The test file's \`${esc(k)}\` changed${k === "encoding" ? ": this changes what every value means" : ""}`),
      ...od.reordered ? ["- The order of the tests changed."] : [],
      ...od.moved.map((x) => `- Test \`${x.name}\` moved from the ${x.from} set to the ${x.to} set${x.to === "visible" ? ": the builders can now see it" : ""}`),
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
    const gl = gitLine(after);
    const lineOf = new Map(e.sections.flatMap((s) => s.items.map((it) => [`${s.title}|${it.id}`, gl(it.line)])));
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
      tests: od ? od.after !== "ok" ? "\u2717 unreadable" : od.rewritten.length ? `\u2717 ${od.rewritten.length} answer${od.rewritten.length > 1 ? "s" : ""} rewritten` : `\u2713 ${[od.added.length && `${od.added.length} added`, od.removed.length && `${od.removed.length} removed`].filter(Boolean).join(", ") || "re-hashed"}` : tested.length ? "\u2717 unchanged" : "\u2713 unchanged",
      bindings: stale.length ? `\u2717 ${stale.join(", ")} stale` : "\u2713",
      citations: d.warnings.some((w) => w.kind === "citation") ? "\u2717 contradicted" : "\u2713"
    });
  }
  for (const [op, cases, src] of oracleNotes) {
    const lines = changedLines(base, head, op);
    const text = (at(head, op) ?? "").split("\n");
    for (const x of cases) {
      const at0 = text.findIndex((l) => l.includes(`"name": "${x.name}"`));
      if (at0 < 0) continue;
      let line = null;
      for (let i = at0 + 1; i <= Math.min(text.length, at0 + 60); i++) if (lines.has(i)) {
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
    const t = at(head, f), m = (0, import_node_path.basename)(f).match(FAMILY_FILE);
    const p = at(head, import_node_path.posix.join((0, import_node_path.dirname)(f), `${m[1]}.sir`));
    const b = t === null ? null : p === null ? { status: "no-primary" } : bindingOf2(t, p);
    blocks.push(`### \`${f}\` \xB7 ${m[2]} language file
${t === null ? "Removed." : b.status === "ok" ? "Changed. Still bound to the current primary." : `\u{1F6D1} Changed, and its binding is **${b.status}**: \`rdv check\` refuses it until it is re-bound.`}`);
    const bad = t !== null && b.status !== "ok";
    if (bad) {
      stops++;
      findings.push({ level: "error", path: f, title: `${m[1]}: ${m[2]} file ${b.status}`, message: `Changed, and its binding is ${b.status}: rdv check refuses it until it is re-bound.` });
    }
    units.push({ unit: m[1], path: f, status: bad ? "fail" : "pass", change: t === null ? `${m[2]} file removed` : `${m[2]} file only`, tests: "\u2013", bindings: t === null ? "\u2013" : `${m[2]} ${bad ? "\u2717 " + b.status : "\u2713"}`, citations: "\u2013" });
  }
  const head1 = stops ? `\u{1F6D1} **${stops} problem${stops > 1 ? "s" : ""} to read before approving.**` : changed.length ? "\u2705 **Nothing to stop on.** Plain-English review of the contract changes in this PR." : "No SIR contract changed in this PR.";
  const body = `${MARKER}
## SIR review
${head1}

${blocks.join("\n\n---\n\n")}

<sub>Generated from the .sir files by rederive (no AI): every line is the contract's own text or a fixed phrase. \u{1F9EA} tested = held by the hidden tests \xB7 \u{1F4DD} note = prose nobody grades.</sub>`;
  return { body, inline, findings, units, stops };
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
  const ev2 = JSON.parse((0, import_node_fs.readFileSync)(process.env.GITHUB_EVENT_PATH, "utf8"));
  const pr = ev2.pull_request;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!pr) {
    console.log("sir-review: not a pull_request event; nothing to review");
    return 0;
  }
  const r = review({ base: pr.base.sha, head: pr.head.sha });
  const { body, inline } = r;
  if (r.findings.length) console.log(annotations(r.findings));
  if (process.env.GITHUB_STEP_SUMMARY) (0, import_node_fs.writeFileSync)(process.env.GITHUB_STEP_SUMMARY, summary(r), { flag: "a" });
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
var input2 = (name, fallback) => {
  const v = process.env[`INPUT_${name.toUpperCase()}`];
  return v === void 0 || v === "" ? fallback : v.trim();
};
var failOn = input2("fail-on", "stop");
if (!["stop", "never"].includes(failOn)) {
  console.log(`::error title=sir-review::fail-on must be stop or never (got ${failOn})`);
  process.exit(1);
}
process.env.GITHUB_TOKEN = input2("github-token", process.env.GITHUB_TOKEN ?? "");
var ev = JSON.parse((0, import_node_fs2.readFileSync)(process.env.GITHUB_EVENT_PATH, "utf8"));
for (const sha2 of [ev.pull_request?.base?.sha, ev.pull_request?.head?.sha].filter(Boolean)) {
  try {
    (0, import_node_child_process2.execFileSync)("git", ["cat-file", "-e", `${sha2}^{commit}`], { stdio: "ignore" });
  } catch {
    (0, import_node_child_process2.execFileSync)("git", ["fetch", "--no-tags", "--quiet", "origin", sha2], { stdio: "inherit" });
  }
}
(async () => {
  try {
    process.exitCode = await run({ failOn, comment: input2("comment", "true") === "true", notes: input2("line-notes", "true") === "true" });
  } catch (e) {
    console.log(`::error title=sir-review::${String(e.message).replace(/\r?\n/g, " ")}`);
    process.exitCode = 1;
  }
})();
