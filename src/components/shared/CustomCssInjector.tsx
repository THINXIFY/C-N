import type { CustomCssScope } from "@/data/custom-css";
import { getActiveCustomCss } from "@/lib/custom-css-service";

/**
 * Renders the admin's saved CSS as a single <style> tag — only ever placed on user-facing pages, never on any
 * /admin route, so bad CSS can never block admin access (see EMERGENCY RECOVERY in the feature notes).
 *
 * dangerouslySetInnerHTML is used deliberately and is safe here: the CSS was already validated and sanitized
 * at save time (src/lib/custom-css-validation.ts rejects HTML tags, script tags and javascript: URLs), and
 * only an admin can ever write it. Plain `<style>{css}</style>` would be unsafe for a different reason —
 * React HTML-escapes text children, which would corrupt ordinary CSS containing `<`, `>` or `&` (e.g. a child
 * combinator `.a > .b`), since the browser treats <style> content as raw text and never un-escapes it.
 */
export async function CustomCssInjector({ scope }: { scope: CustomCssScope }) {
  const css = await getActiveCustomCss(scope);
  if (!css) return null;
  return <style id="admin-custom-css" dangerouslySetInnerHTML={{ __html: css }} />;
}
