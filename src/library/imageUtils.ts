export const isValidDataUrl = (url: string): boolean => {
  if (!url.startsWith('data:image')) return false;
  try {
    const parts = url.split(',');
    if (parts.length !== 2) return false;
    const header = parts[0];
    if (!header.includes('data:image/') || !header.includes(';base64')) return false;
    const data = parts[1];
    if (!data || data.trim().length === 0) return false;
    return true;
  } catch {
    return false;
  }
};
