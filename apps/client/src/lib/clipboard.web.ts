/**
 * Copy to clipboard — web.
 *
 * `navigator.clipboard` is only available in a secure context, which a plain
 * `http://` LAN address in development is not. Rather than let the button do
 * nothing there, it falls back to the old selection trick, which still works
 * everywhere. Both paths report whether they actually succeeded, so the caller
 * can tell the user the truth instead of always claiming "Copiado".
 */

async function viaClipboardApi(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Permission denied, or a non-secure context that still exposes the API.
    return false;
  }
}

function viaSelection(text: string): boolean {
  if (typeof document === "undefined") return false;
  const field = document.createElement("textarea");
  field.value = text;
  // Off-screen rather than hidden: `display:none` can't be selected, and a
  // visible flash of a textarea is worse than a scroll jump we prevent anyway.
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "-9999px";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (await viaClipboardApi(text)) return true;
  return viaSelection(text);
}
