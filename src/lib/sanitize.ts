/**
 * Input sanitization helpers to prevent XSS and malicious script injections
 * in free-text fields like citizen incident reports and operator notes.
 */

export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    // Strip HTML tags completely
    .replace(/<[^>]*>?/gm, "")
    // Strip javascript: or data: URIs
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    // Normalize consecutive whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escapes characters for safe HTML display if rendered in non-React contexts
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
