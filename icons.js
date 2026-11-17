const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".6"/><circle cx="3.5" cy="12" r=".6"/><circle cx="3.5" cy="18" r=".6"/>',
  plug: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a10 10 0 1 1 17.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.3 2.6 2 4.4 5 4.6"/>',
  threads: '<path d="M17.5 8.5C16.800 5.800 14.600 4.500 12 4.500c-4 0-6 3-6 7.500s2.200 7.500 6.200 7.500c3 0 5-1.500 5-3.800 0-2.700-2.500-3.700-5-3.700-1.800 0-3 .8-3 2 0 1.100 1 1.800 2.300 1.800 2 0 3.200-1.400 3.200-4.300"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.500" cy="6.500" r=".6"/>',
  youtube: '<rect x="2.500" y="5.500" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.500 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  link: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16" rx="4"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 16v-5M13 16V7M18 16v-3"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
};
export const icon = (n, s = 20) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
export const platIcon = (p) => icon(/facebook/i.test(p) ? 'facebook' : p.toLowerCase(), 22);
