/**
 * Mode démonstration.
 *
 * Il ouvre la plateforme sans connexion, le temps d'une présentation sur des
 * données fictives. Trois choses doivent être vraies : le visiteur entre, il
 * est signalé comme visiteur, et il ne peut pas toucher aux droits — la zone
 * d'administration lui reste fermée, même si le compte emprunté est
 * administrateur. Et sans la variable, rien ne change.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../../server/store.js';
import { createAccessService } from '../../server/access-service.js';
import { createApp } from '../../server/app.js';

const VITRINE = 'vitrine@exemple.be';

const CONFIG = {
  googleClientId: '',
  sessionSecret: 'x'.repeat(40),
  publicUrl: 'https://maintex.exemple',
  storeKind: 'memory',
  secureCookies: false,
};

async function plateforme(extra = {}) {
  const store = new MemoryStore();
  const service = createAccessService({
    store,
    workspaceDomain: 'exemple.be',
    bootstrapAdmins: [VITRINE],
    extraEmails: [VITRINE],
  });
  await service.seed();
  await service.recordLogin(VITRINE);
  const app = createApp({
    service,
    config: { ...CONFIG, ...extra },
    signing: null,
    log: { error() {}, warn() {}, info() {} },
  });
  return app;
}

/**
 * Appel d'une route sur un vrai serveur éphémère : plus fidèle, et sans
 * dépendance de test supplémentaire (fetch est fourni par Node).
 */
async function appeler(app, methode, chemin) {
  const serveur = app.listen(0);
  await new Promise((resolve) => serveur.once('listening', resolve));
  try {
    const { port } = serveur.address();
    const reponse = await fetch(`http://127.0.0.1:${port}${chemin}`, { method: methode });
    const texte = await reponse.text();
    let corps;
    try {
      corps = JSON.parse(texte);
    } catch {
      corps = texte;
    }
    return { status: reponse.status, body: corps };
  } finally {
    await new Promise((resolve) => serveur.close(resolve));
  }
}

test('mode démonstration : le visiteur entre sans s’être connecté', async () => {
  const app = await plateforme({ demoEmail: VITRINE, demoName: 'Visiteur démonstration' });

  const moi = await appeler(app, 'GET', '/api/auth/me');
  assert.equal(moi.status, 200, 'le visiteur doit être admis');
  assert.equal(moi.body.demo, true, 'la session doit être signalée comme démonstration');
  assert.equal(moi.body.user.name, 'Visiteur démonstration', 'le nom affiché doit être neutre');

  const config = await appeler(app, 'GET', '/api/auth/config');
  assert.equal(config.body.demo, true);
  assert.equal(config.body.enabled, false, 'l’écran de connexion ne doit plus s’afficher');
});

test('mode démonstration : l’administration reste fermée au visiteur', async () => {
  const app = await plateforme({ demoEmail: VITRINE });
  const admin = await appeler(app, 'GET', '/api/admin/roles');
  assert.equal(admin.status, 403, 'la zone d’administration doit être refusée');
  assert.equal(admin.body.error, 'DEMO_READ_ONLY');
});

test('sans la variable, rien ne change : la connexion reste exigée', async () => {
  const app = await plateforme();
  const moi = await appeler(app, 'GET', '/api/auth/me');
  assert.equal(moi.status, 401);
  const config = await appeler(app, 'GET', '/api/auth/config');
  assert.equal(config.body.demo, false);
});

test('une adresse de démonstration inconnue n’ouvre aucune porte', async () => {
  const app = await plateforme({ demoEmail: 'personne@exemple.be' });
  const moi = await appeler(app, 'GET', '/api/auth/me');
  assert.equal(moi.status, 401, 'sans fiche, le visiteur reste dehors');
});
