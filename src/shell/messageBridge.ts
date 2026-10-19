// Messages échangés entre le shell MAINTeX et les applications intégrées.
//
// Une application intégrée peut envoyer au shell (window.parent.postMessage) :
//   { source: '<appId>', type: 'MAINTeX_REQUEST_HOME' }   → retour à l'accueil
//   { source: '<appId>', type: 'MAINTeX_REQUEST_TOKEN' }  → nouveau jeton d'accès
// Le shell répond à la seconde par { type: 'MAINTeX_TOKEN', token } (ou
// { type: 'MAINTeX_TOKEN_ERROR', error }), envoyé uniquement à l'origine de l'application.
//
// Tout message dont l'origine ne correspond pas exactement à une application
// branchée, ou dont la source / le type est inattendu, est ignoré.

export interface BridgeApp {
  id: string;
  url: string | null;
}

export type BridgeAction =
  | { kind: 'home'; appId: string }
  | { kind: 'token'; appId: string; origin: string }
  | null;

// Identifiant historique utilisé par l'application 5S.
const LEGACY_SOURCES: Record<string, string[]> = { '5s': ['5s-digital-management'] };

export function originOf(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function interpretMessage(event: { origin: string; data: unknown }, apps: BridgeApp[]): BridgeAction {
  const app = apps.find((candidate) => originOf(candidate.url) === event.origin);
  if (!app) return null;

  const data = event.data as { source?: unknown; type?: unknown } | null;
  if (!data || typeof data !== 'object') return null;

  const acceptedSources = [app.id, `maintex:${app.id}`, ...(LEGACY_SOURCES[app.id] || [])];
  if (typeof data.source !== 'string' || !acceptedSources.includes(data.source)) return null;

  if (data.type === 'MAINTeX_REQUEST_HOME') return { kind: 'home', appId: app.id };
  if (data.type === 'MAINTeX_REQUEST_TOKEN') return { kind: 'token', appId: app.id, origin: event.origin };
  return null;
}

/** Adresse chargée dans le cadre : le jeton passe dans le fragment (#), jamais envoyé aux serveurs ni journalisé. */
export function buildEmbeddedUrl(baseUrl: string, token: string | null): string | null {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('maintexMode', 'embedded');
    url.hash = token ? `maintex_token=${encodeURIComponent(token)}` : '';
    return url.toString();
  } catch {
    return null;
  }
}
