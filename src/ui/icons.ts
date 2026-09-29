// Evidence pictograms drawn in code (SVG). Simple icons are more exact as vectors
// than as generated images.
const S = (body: string) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS: Record<string, string> = {
  panel: S('<rect x="12" y="8" width="40" height="48" rx="3"/><rect x="18" y="14" width="28" height="12"/><circle cx="24" cy="38" r="4" fill="currentColor"/><path d="M34 36h12M34 44h12"/>'),
  keypad: S('<rect x="14" y="6" width="36" height="52" rx="4"/><rect x="20" y="12" width="24" height="9"/><circle cx="24" cy="30" r="2.5"/><circle cx="32" cy="30" r="2.5"/><circle cx="40" cy="30" r="2.5"/><circle cx="24" cy="39" r="2.5"/><circle cx="32" cy="39" r="2.5"/><circle cx="40" cy="39" r="2.5"/><circle cx="32" cy="48" r="2.5"/>'),
  headphones: S('<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect x="8" y="36" width="10" height="18" rx="3"/><rect x="46" y="36" width="10" height="18" rx="3"/>'),
  note: S('<path d="M14 10h28l8 8v36H14z"/><path d="M42 10v8h8M20 28h24M20 36h24M20 44h14"/>'),
  lever: S('<rect x="14" y="10" width="36" height="44" rx="3"/><path d="M28 44L38 20"/><circle cx="39" cy="18" r="4" fill="currentColor"/><circle cx="22" cy="20" r="3"/>'),
  fuse: S('<rect x="10" y="22" width="44" height="20" rx="4"/><path d="M10 32H4M60 32h-6"/><path d="M20 28l24 8" stroke-dasharray="4 4"/>'),
  pen: S('<path d="M44 8l12 12L24 52l-14 4 4-14z"/><path d="M38 14l12 12"/>'),
  order: S('<path d="M14 8h36v48H14z"/><path d="M20 18h24M20 26h24M20 34h16"/><circle cx="40" cy="46" r="6"/>'),
  reel: S('<circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="5"/><circle cx="32" cy="16" r="5"/><circle cx="46" cy="40" r="5"/><circle cx="18" cy="40" r="5"/>'),
  badge: S('<rect x="14" y="14" width="36" height="42" rx="4"/><path d="M26 8h12v10H26z"/><circle cx="32" cy="32" r="6"/><path d="M22 48h20"/>'),
  generator: S('<rect x="8" y="18" width="48" height="32" rx="3"/><path d="M34 22l-8 12h8l-6 12"/><path d="M14 50v6M50 50v6"/>'),
  printout: S('<rect x="12" y="8" width="40" height="14" rx="2"/><path d="M18 22v34h28V22"/><path d="M24 30h16M24 38l4-3 4 3 4-3 4 3M24 46h16"/>'),
  tag: S('<path d="M10 20l20-12h24v24L34 52z"/><circle cx="44" cy="18" r="4"/><path d="M22 30l10 10"/>'),
  recorder: S('<rect x="16" y="6" width="32" height="52" rx="5"/><rect x="22" y="12" width="20" height="14"/><circle cx="32" cy="42" r="7"/><path d="M26 18h4M26 22h10"/>'),
  headset: S('<path d="M16 34a16 16 0 0 1 32 0"/><rect x="10" y="32" width="10" height="14" rx="3"/><path d="M15 46c0 8 8 10 18 10"/><circle cx="15" cy="39" r="2" fill="currentColor"/>'),
  kettle: S('<path d="M16 24h28l4 30H12z"/><path d="M44 30h6a6 6 0 0 1 0 12h-4"/><path d="M22 24c0-8 16-8 16 0"/>'),
};

export function icon(name: string) {
  return ICONS[name] ?? ICONS.note;
}
