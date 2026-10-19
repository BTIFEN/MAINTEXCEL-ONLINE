import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MemoryStore, FileStore, FirestoreStore, toFirestoreValue, fromFirestoreValue } from '../../server/store.js';
import { createAccessService, parseLegacyUsers, AccessError } from '../../server/access-service.js';
import { loadSigningKey, signAppToken, verifyAppToken, signSession, verifySession, readCookie } from '../../server/tokens.js';

const ADMIN = 'admin@aperam.com';

async function setup({ bootstrapAdmins = [] } = {}) {
  const store = new MemoryStore();
  const service = createAccessService({ store, workspaceDomain: 'aperam.com', bootstrapAdmins, extraEmails: ['consultant@exemple.be'] });
  await service.seed();
  return { store, service };
}

test('premier démarrage : rôles par défaut créés une seule fois', async () => {
  const { store, service } = await setup();
  const roles = await store.listRoles();
  assert.deepEqual(roles.map((r) => r.id).sort(), ['administrateur', 'utilisateur']);
  await store.deleteRole('utilisateur');
  assert.deepEqual(await service.seed(), { seeded: false });
  assert.equal((await store.listRoles()).length, 1);
});

test('identités admissibles : domaine vérifié par Google, ou adresse listée', async () => {
  const { service } = await setup({ bootstrapAdmins: ['boss@gmail.com'] });
  assert.equal(service.isAdmissibleIdentity('a@aperam.com', 'aperam.com'), true);
  assert.equal(service.isAdmissibleIdentity('a@aperam.com', undefined), false, 'sans champ hd, refus');
  assert.equal(service.isAdmissibleIdentity('a@autre.com', 'aperam.com'), false);
  assert.equal(service.isAdmissibleIdentity('boss@gmail.com', undefined), true);
  assert.equal(service.isAdmissibleIdentity('consultant@exemple.be', undefined), true);
  assert.equal(service.isAdmissibleIdentity('autre@gmail.com', undefined), false);
});

test('une personne non enregistrée ou désactivée n’a pas de profil', async () => {
  const { store, service } = await setup();
  assert.equal(await service.getProfile('inconnu@aperam.com'), null);
  await store.putUser({ email: 'off@aperam.com', name: 'Off', roleId: 'administrateur', active: false, overrides: {} });
  assert.equal(await service.getProfile('off@aperam.com'), null);
});

test('l’administrateur d’amorçage administre sans être enregistré', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  const profile = await service.getProfile(ADMIN);
  assert.equal(profile.access.isAdmin, true);
  assert.equal(profile.bootstrapAdmin, true);
  assert.doesNotThrow(() => service.requireAdmin(profile));
});

test('un utilisateur sans droit d’administration est refusé', async () => {
  const { store, service } = await setup();
  await store.putUser({ email: 'tech@aperam.com', name: 'Tech', roleId: 'utilisateur', active: true, overrides: {} });
  const profile = await service.getProfile('tech@aperam.com');
  assert.throws(() => service.requireAdmin(profile), (e) => e instanceof AccessError && e.status === 403);
});

test('cycle complet : rôle, utilisateur, exception individuelle, journal', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await service.saveRole(ADMIN, {
    id: 'technicien',
    label: 'Technicien',
    apps: { '5s': { access: 'allow', modules: { admin: 'deny' } }, alphap: { access: 'allow' } },
  });
  await service.saveUser(ADMIN, {
    email: 'Jean@Aperam.com',
    name: 'Jean',
    roleId: 'technicien',
    overrides: { alphap: { access: 'deny' }, meetings: { access: 'allow' } },
  });
  const profile = await service.getProfile('jean@aperam.com');
  assert.equal(profile.roleLabel, 'Technicien');
  assert.equal(profile.access.apps['5s'].allowed, true);
  assert.equal(profile.access.apps['5s'].modules.admin.allowed, false);
  assert.equal(profile.access.apps.alphap.allowed, false);
  assert.equal(profile.access.apps.meetings.allowed, true);

  const grant = service.appGrant(profile, '5s');
  assert.ok(grant.modules.includes('cockpit'));
  assert.ok(!grant.modules.includes('admin'));
  assert.throws(() => service.appGrant(profile, 'alphap'), /refusé/);
  assert.throws(() => service.appGrant(profile, 'rca'), /non branchée/);

  const audit = await service.listAudit();
  assert.deepEqual(audit.slice(0, 2).map((e) => e.action), ['user.create', 'role.create']);
  assert.equal(audit[0].actor, ADMIN);
});

test('les adresses hors domaine ne peuvent pas être enregistrées', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await assert.rejects(service.saveUser(ADMIN, { email: 'x@gmail.com' }), /aperam\.com/);
  await assert.doesNotReject(service.saveUser(ADMIN, { email: 'consultant@exemple.be' }));
});

test('rôle inconnu, application inconnue : erreurs 400', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await assert.rejects(service.saveUser(ADMIN, { email: 'a@aperam.com', roleId: 'nope' }), (e) => e.status === 400);
  await assert.rejects(
    service.saveRole(ADMIN, { id: 'x1', label: 'X', apps: { nope: { access: 'allow' } } }),
    (e) => e.status === 400 && e.code === 'UNKNOWN_APP',
  );
});

test('modification concurrente détectée', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  const saved = await service.saveRole(ADMIN, { id: 'r1', label: 'R1' });
  assert.equal(saved.version, 1);
  const second = await service.saveRole(ADMIN, { id: 'r1', label: 'R1 bis' }, saved.version);
  assert.equal(second.version, 2);
  await assert.rejects(service.saveRole(ADMIN, { id: 'r1', label: 'R1 ter' }, saved.version), (e) => e.status === 409);
  await assert.rejects(service.saveRole(ADMIN, { id: 'r1', label: 'Doublon' }, 'new'), (e) => e.code === 'ALREADY_EXISTS');
  await assert.doesNotReject(service.saveRole(ADMIN, { id: 'r2', label: 'R2' }, 'new'));
});

test('un rôle attribué ne peut pas être supprimé', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await service.saveUser(ADMIN, { email: 'a@aperam.com', roleId: 'utilisateur' });
  await assert.rejects(service.deleteRole(ADMIN, 'utilisateur'), (e) => e.code === 'ROLE_IN_USE');
});

test('un administrateur ne peut pas se retirer lui-même l’administration', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await service.saveUser(ADMIN, { email: 'chef@aperam.com', roleId: 'administrateur' });
  const chef = 'chef@aperam.com';
  await assert.rejects(
    service.saveUser(chef, { email: chef, roleId: 'utilisateur' }),
    (e) => e.code === 'SELF_LOCKOUT',
  );
  await assert.rejects(
    service.saveUser(chef, { email: chef, roleId: 'administrateur', overrides: { 'maintex-admin': { access: 'deny' } } }),
    (e) => e.code === 'SELF_LOCKOUT',
  );
  await assert.rejects(
    service.saveRole(chef, { id: 'administrateur', label: 'Admin', apps: {} }),
    (e) => e.code === 'SELF_LOCKOUT',
  );
  await assert.rejects(service.deleteUser(chef, chef), (e) => e.code === 'SELF_LOCKOUT');
  // Un autre administrateur peut le faire.
  await assert.doesNotReject(service.saveUser(ADMIN, { email: chef, roleId: 'utilisateur' }));
});

test('reprise de l’ancienne variable MAINTEX_USERS_JSON', async () => {
  const json = JSON.stringify([
    { email: 'A@aperam.com', name: 'A', modules: [{ id: 'quick.alpab', permissions: ['open', 'view'] }, { id: 'quick.5s', permissions: ['view'] }] },
    { email: 'bad' },
    'nimporte',
  ]);
  assert.deepEqual(parseLegacyUsers(json), [
    { email: 'a@aperam.com', name: 'A', roleId: null, active: true, overrides: { alphap: { access: 'allow' } } },
  ]);
  assert.deepEqual(parseLegacyUsers('pas du json'), []);

  const store = new MemoryStore();
  const service = createAccessService({ store, workspaceDomain: 'aperam.com' });
  assert.deepEqual(await service.seed({ legacyUsersJson: json }), { seeded: true, imported: 1 });
  const profile = await service.getProfile('a@aperam.com');
  assert.equal(profile.access.apps.alphap.allowed, true);
});

test('la date de dernière connexion est conservée lors d’une modification', async () => {
  const { service } = await setup({ bootstrapAdmins: [ADMIN] });
  await service.saveUser(ADMIN, { email: 'a@aperam.com' });
  await service.recordLogin('a@aperam.com');
  const saved = await service.saveUser(ADMIN, { email: 'a@aperam.com', name: 'A' });
  assert.ok(saved.lastLoginAt);
});

test('FileStore : écriture atomique et relecture', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'maintex-'));
  const file = path.join(dir, 'sub', 'data.json');
  const store = await new FileStore(file).load();
  await store.putRole({ id: 'r', label: 'R', apps: {} });
  await store.appendAudit({ at: '2026-10-19T08:00:00.000Z', actor: 'x', action: 'a', target: 't' });
  const reloaded = await new FileStore(file).load();
  assert.deepEqual(await reloaded.getRole('r'), { id: 'r', label: 'R', apps: {} });
  assert.equal((await reloaded.listAudit(10)).length, 1);
  await fs.rm(dir, { recursive: true });
});

test('conversion Firestore aller-retour', () => {
  const value = { a: 'x', b: 2, c: 2.5, d: true, e: null, f: [1, 'y'], g: { h: { i: 'deny' } }, j: [], k: {} };
  assert.deepEqual(fromFirestoreValue(toFirestoreValue(value)), value);
});

test('FirestoreStore : requêtes REST attendues', async () => {
  const calls = [];
  const docs = new Map();
  const request = async ({ url, method, data }) => {
    calls.push({ url, method });
    const key = url.split('/documents/')[1];
    if (method === 'PATCH') {
      docs.set(key, data);
      return { status: 200, data };
    }
    if (method === 'GET' && docs.has(key)) return { status: 200, data: docs.get(key) };
    if (method === 'GET' && key && !key.includes('?')) throw Object.assign(new Error('not found'), { response: { status: 404 } });
    if (method === 'GET') {
      return { status: 200, data: { documents: [...docs].filter(([k]) => k.startsWith('maintex_roles/')).map(([, d]) => d) } };
    }
    return { status: 200, data: {} };
  };
  const store = new FirestoreStore({ projectId: 'mon-projet', request });
  assert.equal(await store.getUser('a@aperam.com'), null);
  await store.putRole({ id: 'r', label: 'R', apps: { '5s': { access: 'allow' } } });
  assert.deepEqual(await store.getRole('r'), { id: 'r', label: 'R', apps: { '5s': { access: 'allow' } } });
  assert.equal((await store.listRoles()).length, 1);
  assert.match(calls[1].url, /projects\/mon-projet\/databases\/\(default\)\/documents\/maintex_roles\/r$/);
  assert.match(calls[0].url, /maintex_users\/a%40aperam\.com$/);
});

test('session : signature, expiration, falsification', () => {
  const secret = 'x'.repeat(40);
  const token = signSession({ email: 'a@aperam.com', exp: Date.now() + 1000 }, secret);
  assert.equal(verifySession(token, secret)?.email, 'a@aperam.com');
  assert.equal(verifySession(token, 'y'.repeat(40)), null);
  assert.equal(verifySession(token + 'x', secret), null);
  assert.equal(verifySession(signSession({ email: 'a', exp: Date.now() - 1 }, secret), secret), null);
  assert.equal(readCookie('a=1; maintex_session=abc.def; b=2', 'maintex_session'), 'abc.def');
});

test('jeton d’application RS256 : vérifiable avec la clé publique, refusé sinon', () => {
  const signing = loadSigningKey({});
  assert.equal(signing.ephemeral, true);
  assert.equal(loadSigningKey({ production: true }), null);
  const jwks = { keys: [signing.jwk] };
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://maintex', aud: 'maintex:5s', sub: 'a@aperam.com', modules: ['cockpit'], iat: now, exp: now + 300 };
  const token = signAppToken(claims, signing);
  const ok = verifyAppToken(token, { jwks, issuer: 'https://maintex', audience: 'maintex:5s' });
  assert.deepEqual(ok.modules, ['cockpit']);
  assert.equal(verifyAppToken(token, { jwks, issuer: 'https://maintex', audience: 'maintex:alphap' }), null);
  assert.equal(verifyAppToken(token, { jwks: { keys: [loadSigningKey({}).jwk] }, issuer: 'https://maintex', audience: 'maintex:5s' }), null);
  const expired = signAppToken({ ...claims, exp: now - 10 }, signing);
  assert.equal(verifyAppToken(expired, { jwks, issuer: 'https://maintex', audience: 'maintex:5s' }), null);
  const [h, , s] = token.split('.');
  const forged = `${h}.${Buffer.from(JSON.stringify({ ...claims, modules: ['admin'] })).toString('base64url')}.${s}`;
  assert.equal(verifyAppToken(forged, { jwks, issuer: 'https://maintex', audience: 'maintex:5s' }), null);
  // Clé fournie au format PEM (Secret Manager), avec retours à la ligne échappés.
  const pem = signing.key.export({ type: 'pkcs8', format: 'pem' }).toString().replace(/\n/g, '\\n');
  assert.equal(loadSigningKey({ pem, production: true }).kid, signing.kid);
});
