// Validation for admin-authored custom CSS. Deliberately NOT reusing settings-validation.ts's generic text()
// helper — that rejects any `<`/`>`, which would also reject completely ordinary CSS like `.a > .b { }`. CSS
// needs its own, narrower checks: real HTML tags and script-ish patterns are rejected outright; a short list
// of heuristic "this looks destructive" patterns only warns, since this is deliberately not a full CSS parser.
import { CUSTOM_CSS_MAX_BYTES, CUSTOM_CSS_SCOPES, type CustomCssScope } from "@/data/custom-css";

export type CustomCssValidation = { ok: true; value: { css: string; scopes: CustomCssScope[] }; warnings: string[] } | { ok: false; error: string };

const REJECT_PATTERNS: Array<{ re: RegExp; message: string }> = [
  { re: /<\s*script/i, message: "Custom CSS can’t contain <script> tags." },
  { re: /<\s*style/i, message: "Custom CSS can’t contain <style> tags." },
  { re: /<\s*iframe/i, message: "Custom CSS can’t contain <iframe> tags." },
  { re: /<[a-z!][^>]*>/i, message: "Custom CSS can’t contain HTML tags — enter CSS rules only." },
  { re: /javascript\s*:/i, message: "Custom CSS can’t contain javascript: URLs." },
  { re: /expression\s*\(/i, message: "Custom CSS can’t use the CSS expression() function." },
  { re: /on[a-z]+\s*=/i, message: "Custom CSS can’t contain inline event handlers." },
];

const WARN_PATTERNS: Array<{ re: RegExp; message: string }> = [
  { re: /(?:html|body)\s*{[^}]*display\s*:\s*none/i, message: "A rule hides the entire page (html/body { display: none }) — double-check before relying on this." },
  { re: /\*\s*{[^}]*pointer-events\s*:\s*none/i, message: "A rule disables clicking everywhere (* { pointer-events: none }) — double-check before relying on this." },
  {
    re: /position\s*:\s*fixed[\s\S]{0,120}?(?:(?:top\s*:\s*0[\s\S]{0,80}?left\s*:\s*0)|(?:width\s*:\s*100v(?:w|min|max))[\s\S]{0,80}?(?:height\s*:\s*100v(?:h|min|max)))/i,
    message: "A rule may cover the whole screen with a fixed overlay — double-check before relying on this.",
  },
];

export function validateCustomCss(rawCss: unknown, rawScopes: unknown): CustomCssValidation {
  const css = typeof rawCss === "string" ? rawCss.trim() : "";

  for (const { re, message } of REJECT_PATTERNS) {
    if (re.test(css)) return { ok: false, error: message };
  }

  const byteLength = new TextEncoder().encode(css).length;
  if (byteLength > CUSTOM_CSS_MAX_BYTES) {
    return { ok: false, error: `Custom CSS is too large (${Math.ceil(byteLength / 1024)} KB). The limit is ${CUSTOM_CSS_MAX_BYTES / 1024} KB.` };
  }

  const scopesIn = Array.isArray(rawScopes) ? rawScopes : [];
  const scopes = scopesIn.filter((s): s is CustomCssScope => (CUSTOM_CSS_SCOPES as readonly string[]).includes(s));
  if (scopes.length === 0) return { ok: false, error: "Choose at least one scope." };

  const warnings = WARN_PATTERNS.filter(({ re }) => re.test(css)).map((w) => w.message);
  return { ok: true, value: { css, scopes }, warnings };
}
