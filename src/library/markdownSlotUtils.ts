/** Decode helpers for tutorial/course markdown `imageurl` data URLs. */

export const isExportableTextDataUrl = (url: string): boolean => {
  if (!url.startsWith('data:text/') || !url.includes(';base64,')) return false;
  const parts = url.split(',');
  if (parts.length !== 2) return false;
  return Boolean(parts[1]?.trim().length);
};

export const textDataUrlToBlob = (dataUrl: string): Blob | null => {
  if (!isExportableTextDataUrl(dataUrl)) return null;
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(text\/[^;]+);/);
  const mime = mimeMatch?.[1] ?? 'text/plain';
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
};

/** Decode a markdown data-URL slot to UTF-8 source text. */
export async function decodeMarkdownSlotText(imageurl: string): Promise<string | null> {
  const blob = textDataUrlToBlob(imageurl);
  if (!blob) return null;
  try {
    return await blob.text();
  } catch {
    return null;
  }
}
