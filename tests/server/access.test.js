import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_CATALOG,
  ADMIN_APP_ID,
  NAVIGATION_TO_APP,
  resolveAccess,
  allowedModules,
  canOpenNavigation,
  sanitizeRole,
  sanitizeUser,
  defaultRoles,
  AccessValidationError,
} from '../../shared/access.js';

const role = {
  id: 'technicien',
  label: 'Technicien',
  apps: {
    '5s': { access: 'allow', modules: { admin: 'deny' } },
    alphap: { access: 'allow' },
    meetings: { access: 'deny' },
  },
};

test('sans rôle ni exception, tout est refusé', () => {
  const access = resolveAccess({});
  for (const app of Object.values(access.apps)) assert.equal(app.allowed, false);
  assert.equal(access.isAdmin, false);
});

test('le rôle donne les applications et les modules non restreints suivent', () => {
  const access = resolveAccess({ role });
  assert.equal(access.apps['5s'].allowed, true);
  assert.equal(access.apps['5s'].source, 'role');
  assert.deepEqual(access.apps['5s'].modules.cockpit, { allowed: true, source: 'app' });
  assert.deepEqual(access.apps['5s'].modules.admin, { allowed: false, source: 'role' });
  assert.equal(access.apps.meetings.allowed, false);
  assert.equal(access.apps.rca.allowed, false);
});

test('une application refusée refuse tous ses modules', () => {
  const access = resolveAccess({ role });
  for (const mod of Object.values(access.apps.meetings.modules)) {
    assert.deepEqual(mod, { allowed: false, source: 'app' });
  }
});

test('l’exception individuelle l’emporte case par case sur le rôle', () => {
  const user = {
    overrides: {
      meetings: { access: 'allow' },
      alphap: { access: 'deny' },
      '5s': { modules: { admin: 'allow', photos: 'deny' } },
    },
  };
  const access = resolveAccess({ role, user });
  assert.deepEqual(
    { allowed: access.apps.meetings.allowed, source: access.apps.meetings.source },
    { allowed: true, source: 'user' },
  );
  assert.equal(access.apps.alphap.allowed, false);
  assert.equal(access.apps.alphap.source, 'user');
  assert.deepEqual(access.apps['5s'].modules.admin, { allowed: true, source: 'user' });
  assert.deepEqual(access.apps['5s'].modules.photos, { allowed: false, source: 'user' });
  // Ce qui n'est pas surchargé reste hérité du rôle.
  assert.equal(access.apps['5s'].source, 'role');
  assert.deepEqual(access.apps['5s'].modules.cockpit, { allowed: true, source: 'app' });
});

test('un module autorisé pour la personne reste refusé si l’application est refusée', () => {
  const user = { overrides: { meetings: { modules: { kpi: 'allow' } } } };
  const access = resolveAccess({ role, user });
  assert.equal(access.apps.meetings.allowed, false);
  assert.deepEqual(access.apps.meetings.modules.kpi, { allowed: false, source: 'app' });
});

test('l’administrateur d’amorçage a toujours la zone Admin, et seulement elle', () => {
  const access = resolveAccess({ bootstrapAdmin: true, user: { overrides: { [ADMIN_APP_ID]: { access: 'deny' } } } });
  assert.equal(access.isAdmin, true);
  assert.equal(access.apps[ADMIN_APP_ID].source, 'bootstrap');
  assert.equal(access.apps['5s'].allowed, false);
});

test('allowedModules ne liste que les modules autorisés', () => {
  const access = resolveAccess({ role });
  const modules = allowedModules(access, '5s');
  assert.ok(modules.includes('cockpit'));
  assert.ok(!modules.includes('admin'));
  assert.deepEqual(allowedModules(access, 'meetings'), []);
});

test('navigation : écrans d’attente ouverts, applications branchées contrôlées', () => {
  const access = resolveAccess({ role });
  assert.equal(canOpenNavigation(access, 'pilotage.kpi-d-excellence'), true);
  assert.equal(canOpenNavigation(access, 'quick.rca'), true);
  assert.equal(canOpenNavigation(access, 'quick.5s'), true);
  assert.equal(canOpenNavigation(access, 'excellence-terrain.5s'), true);
  assert.equal(canOpenNavigation(access, 'quick.meeting-management'), false);
  assert.equal(canOpenNavigation(null, 'pilotage.kpi-d-excellence'), false);
});

test('chaque entrée de navigation pointe vers une application du catalogue', () => {
  for (const appId of Object.values(NAVIGATION_TO_APP)) {
    assert.ok(APP_CATALOG.some((app) => app.id === appId), appId);
  }
});

test('sanitizeRole : valeurs propres, accès refusé par défaut, « hérité » ignoré', () => {
  const clean = sanitizeRole({
    id: ' Chef-Equipe ',
    label: ' Chef d’équipe ',
    apps: { '5s': { modules: { cockpit: 'inherit', admin: 'deny' } }, alphap: { access: 'allow' } },
  });
  assert.equal(clean.id, 'chef-equipe');
  assert.equal(clean.label, 'Chef d’équipe');
  assert.deepEqual(clean.apps, {
    '5s': { access: 'deny', modules: { admin: 'deny' } },
    alphap: { access: 'allow' },
  });
});

test('sanitizeRole refuse les applications, modules et valeurs inconnus', () => {
  const base = { id: 'test', label: 'Test' };
  assert.throws(() => sanitizeRole({ ...base, apps: { inconnue: { access: 'allow' } } }), AccessValidationError);
  assert.throws(() => sanitizeRole({ ...base, apps: { '5s': { access: 'allow', modules: { x: 'allow' } } } }), /Module inconnu/);
  assert.throws(() => sanitizeRole({ ...base, apps: { '5s': { access: 'oui' } } }), /invalide/);
  assert.throws(() => sanitizeRole({ id: 'A B', label: 'x' }), /Identifiant/);
  assert.throws(() => sanitizeRole({ id: 'ok', label: '' }), /obligatoire/);
});

test('sanitizeUser : e-mail normalisé, exceptions sans accès forcé', () => {
  const clean = sanitizeUser({
    email: ' Jean.Dupont@APERAM.com ',
    roleId: 'Technicien',
    overrides: { '5s': { modules: { admin: 'allow' } }, alphap: { access: 'inherit' } },
  });
  assert.equal(clean.email, 'jean.dupont@aperam.com');
  assert.equal(clean.name, 'jean.dupont@aperam.com');
  assert.equal(clean.roleId, 'technicien');
  assert.equal(clean.active, true);
  assert.deepEqual(clean.overrides, { '5s': { modules: { admin: 'allow' } } });
  assert.throws(() => sanitizeUser({ email: 'pas-un-email' }), /e-mail/);
});

test('les rôles par défaut sont valides et l’administrateur a la zone Admin', () => {
  for (const r of defaultRoles()) assert.deepEqual(sanitizeRole(r), r);
  const admin = defaultRoles().find((r) => r.id === 'administrateur');
  assert.equal(resolveAccess({ role: admin }).isAdmin, true);
  assert.equal(resolveAccess({ role: admin }).apps.rca.allowed, false);
});
