// @ts-check
/**
 * Point d'entrée du serveur MAINTeX.
 * Toute la configuration passe par des variables d'environnement (voir .env.example).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStoreFromEnv } from './server/store.js';
import { createAccessService } from './server/access-service.js';
import { loadSigningKey } from './server/tokens.js';
import { createApp } from './server/app.js';

const env = process.env;
const production = env.NODE_ENV === 'production' || Boolean(env.K_SERVICE);
const list = (/** @type {string | undefined} */ value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** Adresses des applications : MAINTEX_APP_URLS (JSON) ou variables historiques. */
function readAppUrls() {
  /** @type {Record<string, string>} */
  let urls = {};
  try {
    urls = JSON.parse(env.MAINTEX_APP_URLS || '{}');
  } catch {
    console.warn('[maintex] MAINTEX_APP_URLS n’est pas un JSON valide : ignoré.');
  }
  if (!urls['5s'] && env.VITE_5S_APP_URL) urls['5s'] = env.VITE_5S_APP_URL;
  if (!urls.alphap && env.VITE_ALPHAP_APP_URL) urls.alphap = env.VITE_ALPHAP_APP_URL;
  if (!urls.meetings) urls.meetings = 'https://meeting-management-qbxmdrfhnq-ew.a.run.app';
  for (const [id, url] of Object.entries(urls)) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new Error('https requis');
      urls[id] = parsed.toString().replace(/\/$/, '');
    } catch {
      console.warn(`[maintex] Adresse ignorée pour ${id} : ${url}`);
      delete urls[id];
    }
  }
  return urls;
}

const store = await createStoreFromEnv(env);
const bootstrapAdmins = list(env.MAINTEX_BOOTSTRAP_ADMINS);
const service = createAccessService({
  store,
  workspaceDomain: env.MAINTEX_WORKSPACE_DOMAIN || 'aperam.com',
  bootstrapAdmins,
  // MAINTEX_EXTRA_EMAIL (au singulier) : ancienne variable, toujours reconnue.
  extraEmails: [...list(env.MAINTEX_EXTRA_EMAILS), ...list(env.MAINTEX_EXTRA_EMAIL)],
});
const seedResult = await service.seed({ legacyUsersJson: env.MAINTEX_USERS_JSON || '' });
if (seedResult.seeded) {
  console.info(`[maintex] Premier démarrage : rôles par défaut créés, ${seedResult.imported} utilisateur(s) repris.`);
}
if (!bootstrapAdmins.length) {
  console.warn('[maintex] MAINTEX_BOOTSTRAP_ADMINS est vide : seuls les administrateurs déjà enregistrés pourront administrer.');
}

const signing = loadSigningKey({ pem: env.MAINTEX_SIGNING_KEY, production });
if (!signing) console.warn('[maintex] MAINTEX_SIGNING_KEY absente : les applications ne recevront pas de jeton.');
else if (signing.ephemeral) console.warn('[maintex] Clé de signature temporaire (développement uniquement).');

const port = Number(env.PORT) || 3000;
const app = createApp({
  service,
  signing,
  config: {
    googleClientId: env.MAINTEX_GOOGLE_CLIENT_ID || '',
    sessionSecret: env.MAINTEX_SESSION_SECRET || '',
    publicUrl: (env.MAINTEX_PUBLIC_URL || env.APP_URL || `http://localhost:${port}`).replace(/\/$/, ''),
    appUrls: readAppUrls(),
    distDir: path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist'),
    secureCookies: env.MAINTEX_INSECURE_COOKIES !== 'true',
    storeKind: store.kind,
  },
});

app.listen(port, '0.0.0.0', () => {
  console.info(`[maintex] MAINTeX à l’écoute sur le port ${port} (stockage : ${store.kind})`);
});
