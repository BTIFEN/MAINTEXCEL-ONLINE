// Agrandissement de l'affichage, piloté depuis le bandeau MAINTeX.
//
// Le réglage est posé sur la racine du document. Il s'applique donc à tout ce
// que le shell affiche — y compris le cadre des applications intégrées, dont
// le contenu est agrandi avec le reste sans qu'aucune d'elles ait à être
// modifiée.
//
// Le choix est retenu d'une visite à l'autre : une personne qui a besoin de
// caractères plus grands n'a pas à le redemander chaque matin.

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.6;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1;

const STORAGE_KEY = 'maintex.zoom';

/** Ramène une valeur dans les bornes, arrondie au pas le plus proche. */
export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT;
  const stepped = Math.round(value / ZOOM_STEP) * ZOOM_STEP;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(stepped.toFixed(2))));
}

export const canZoomIn = (value: number): boolean => clampZoom(value) < ZOOM_MAX;
export const canZoomOut = (value: number): boolean => clampZoom(value) > ZOOM_MIN;

export const zoomIn = (value: number): number => clampZoom(value + ZOOM_STEP);
export const zoomOut = (value: number): number => clampZoom(value - ZOOM_STEP);

/** Pourcentage affiché à côté des boutons : 1 → « 100 % ». */
export const zoomLabel = (value: number): string => `${Math.round(clampZoom(value) * 100)} %`;

/** Réglage retenu, sinon la taille normale. */
export function readZoom(): number {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return ZOOM_DEFAULT;
    return clampZoom(Number(stored));
  } catch {
    return ZOOM_DEFAULT;
  }
}

export function saveZoom(value: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(clampZoom(value)));
  } catch {
    // Stockage indisponible : le réglage vaudra pour cette visite seulement.
  }
}

/**
 * Applique le réglage au document. « zoom » plutôt qu'une mise à l'échelle :
 * la mise en page est recalculée, au lieu d'être simplement étirée, ce qui
 * garde les textes nets et les clics au bon endroit.
 */
export function applyZoom(value: number, root?: HTMLElement): void {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!target) return;
  const level = clampZoom(value);
  target.style.setProperty('zoom', level === ZOOM_DEFAULT ? '' : String(level));
}
