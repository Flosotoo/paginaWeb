const CODE39_PATTERNS: Record<string, string> = {
  '*': 'nwnnwnwnn',
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw',
  'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn',
  'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn',
  'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw',
  'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn',
  'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww',
  'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn',
  'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn',
  'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww',
  'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn',
  'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw',
  'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn',
  'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn',
  'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
};

export function generateBarcodeSvg(value: string): string {
  const clean = value.toUpperCase().replace(/[^0-9A-Z\-]/g, '');
  const str = `*${clean}*`;
  let x = 12;
  const rects: Array<{ x: number; w: number }> = [];

  for (const c of str) {
    const pattern = CODE39_PATTERNS[c];
    if (!pattern) continue;
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === 'w' ? 5 : 2;
      if (i % 2 === 0) {
        rects.push({ x, w });
      }
      x += w;
    }
    x += 2;
  }

  const rectsSvg = rects.map((r) => `<rect x="${r.x}" y="5" width="${r.w}" height="57"/>`).join('');
  return `<svg role="img" aria-label="Código de barras ${value}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 12} 86" preserveAspectRatio="xMidYMid meet"><g fill="#173b31">${rectsSvg}</g><text x="${x / 2 + 6}" y="80" text-anchor="middle" font-family="monospace" font-size="12" fill="#173b31">${value}</text></svg>`;
}
