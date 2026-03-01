const BREAK_TAG_PATTERN = /<br\s*\/?>/gi;

export function htmlToPlainText(htmlText = '') {
  const normalizedHtml = String(htmlText ?? '').replace(BREAK_TAG_PATTERN, '\n');

  if (typeof document === 'undefined') {
    return normalizedHtml
      .replace(/<[^>]*>/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = normalizedHtml;

  return (tempDiv.textContent || tempDiv.innerText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
