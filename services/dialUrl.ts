/**
 * The dial targets to try for a `tel:` URL, most capable first.
 *
 * The message catalog authors the customer-service number with a post-dial suffix —
 * `tel:4440222,1` means "dial 444 0 222, then send DTMF 1 to pick the IVR branch". That
 * suffix is approved content: the widget passes it through byte-for-byte and the
 * backend's catalog-parity test pins it identical across all seven locales, so it cannot
 * be corrected upstream and should not be.
 *
 * iOS declines to open a `tel:` URL whose number carries pause characters (`,` and `;`
 * are a long-standing auto-dial abuse vector, so the system refuses rather than asks).
 * The open reports failure and the customer sees nothing at all. Android's dialler
 * accepts the same URL.
 *
 * Hence two candidates: the authored URL first, so that where the platform honours it the
 * customer skips a menu, then the bare number, which every platform dials. Losing the IVR
 * shortcut is a much smaller failure than losing the call.
 *
 * Anything that is not a `tel:` URL yields exactly one candidate, returned unchanged —
 * this must never rewrite an http(s) or mailto target.
 */
const POST_DIAL_SUFFIX = /[,;].*$/;

export function dialUrlCandidates(url: string): string[] {
  const trimmed = url.trim();
  if (!/^tel:/i.test(trimmed)) return [trimmed];

  // Sliced rather than lowercased so the URL is reproduced exactly as authored.
  const scheme = trimmed.slice(0, 'tel:'.length);
  const number = trimmed.slice('tel:'.length);
  const bare = number.replace(POST_DIAL_SUFFIX, '');

  // No suffix to drop, or nothing but a suffix: one candidate. `tel:` alone dials nothing,
  // and offering it as a fallback would only turn one silent failure into two.
  if (!bare || bare === number) return [trimmed];

  return [trimmed, `${scheme}${bare}`];
}
