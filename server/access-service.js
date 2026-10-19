// @ts-check
/**
 * Règles métier de MAINTeX : qui peut se connecter, droits effectifs, gestion
 * des rôles et des utilisateurs, journal des modifications.
 * Indépendant d'Express pour être testable.
 */
import {
  APP_CATALOG,
  ADMIN_APP_ID,
  resolveAccess,
  allowedModules,
  sanitizeRole,
  sanitizeUser,
  normalizeEmail,
  defaultRoles,
  findApp,
  AccessValidationError,
} from '../shared/access.js';

/** @typedef {import('../shared/access.js').Role} Role */
/** @typedef {import('../shared/access.js').UserRecord} UserRecord */
/** @typedef {import('./store.js').AccessStore} AccessStore */

export class AccessError extends Error {
  /** @param {number} status @param {string} code @param {string} message */
  constructor(status, code, message) {
    super(message);
    this.name = 'AccessError';
    this.status = status;
    this.code = code;
  }
}

/**
 * @param {{
 *   store: AccessStore,
 *   workspaceDomain: string,
 *   bootstrapAdmins?: string[],
 *   extraEmails?: string[],
 *   catalog?: import('../shared/access.js').AppDef[],
 *   now?: () => Date,
 * }} options
 */
export function createAccessService({
  store,
  workspaceDomain,
  bootstrapAdmins = [],
  extraEmails = [],
  catalog = APP_CATALOG,
  now = () => new Date(),
}) {
  const domain = String(workspaceDomain || '').trim().toLowerCase();
  const admins = new Set(bootstrapAdmins.map(normalizeEmail).filter(Boolean));
  const extras = new Set(extraEmails.map(normalizeEmail).filter(Boolean));

  /** @param {string} email */
  const isBootstrapAdmin = (email) => admins.has(normalizeEmail(email));

  /**
   * Une identité est admissible si elle appartient au domaine de l'entreprise
   * (vérifié via le champ « hd » de Google) ou si elle est explicitement listée.
   * @param {string} email
   * @param {string | undefined} hostedDomain
   */
  function isAdmissibleIdentity(email, hostedDomain) {
    const normalized = normalizeEmail(email);
    if (domain && String(hostedDomain || '').toLowerCase() === domain && normalized.endsWith(`@${domain}`)) {
      return true;
    }
    return admins.has(normalized) || extras.has(normalized);
  }

  /** @param {string} email */
  function canBeRegistered(email) {
    const normalized = normalizeEmail(email);
    return (domain && normalized.endsWith(`@${domain}`)) || admins.has(normalized) || extras.has(normalized);
  }

  /** Crée les rôles par défaut et reprend les anciens utilisateurs, une seule fois. */
  async function seed({ legacyUsersJson = '' } = {}) {
    if (await store.getMeta('seeded')) return { seeded: false };
    const at = now().toISOString();
    if ((await store.listRoles()).length === 0) {
      for (const role of defaultRoles(catalog)) {
        await store.putRole({ ...role, updatedAt: at, updatedBy: 'system' });
      }
    }
    let imported = 0;
    if (legacyUsersJson && (await store.listUsers()).length === 0) {
      for (const legacy of parseLegacyUsers(legacyUsersJson)) {
        await store.putUser({ ...legacy, updatedAt: at, updatedBy: 'migration' });
        imported += 1;
      }
    }
    await store.putMeta('seeded', { at, imported });
    await store.appendAudit({ at, actor: 'system', action: 'seed', target: 'maintex', after: { imported } });
    return { seeded: true, imported };
  }

  /**
   * Profil complet d'une personne : identité, rôle, droits effectifs.
   * Retourne null si la personne n'a pas (ou plus) accès à MAINTeX.
   * @param {string} rawEmail
   */
  async function getProfile(rawEmail) {
    const email = normalizeEmail(rawEmail);
    const bootstrapAdmin = isBootstrapAdmin(email);
    const user = await store.getUser(email);
    if (!user && !bootstrapAdmin) return null;
    if (user && user.active === false && !bootstrapAdmin) return null;
    const role = user?.roleId ? await store.getRole(user.roleId) : null;
    const access = resolveAccess({ catalog, role, user: user?.active === false ? null : user, bootstrapAdmin });
    return {
      email,
      name: user?.name || email,
      roleId: role?.id || null,
      roleLabel: role?.label || (bootstrapAdmin ? 'Administrateur d’amorçage' : 'Sans rôle'),
      bootstrapAdmin,
      access,
    };
  }

  /** @param {string} email */
  async function recordLogin(email) {
    const user = await store.getUser(normalizeEmail(email));
    if (user) await store.putUser({ ...user, lastLoginAt: now().toISOString() });
  }

  /** @param {Awaited<ReturnType<typeof getProfile>>} profile */
  function requireAdmin(profile) {
    if (!profile?.access.isAdmin) throw new AccessError(403, 'ADMIN_REQUIRED', 'Accès réservé aux administrateurs MAINTeX.');
  }

  /**
   * @param {string} actor @param {string} action @param {string} target
   * @param {unknown} before @param {unknown} after
   */
  async function audit(actor, action, target, before, after) {
    await store.appendAudit({ at: now().toISOString(), actor, action, target, before: before ?? null, after: after ?? null });
  }

  /**
   * Verrou optimiste : la version envoyée doit être celle actuellement enregistrée.
   * @param {{ version?: number } | null} current
   * @param {unknown} expectedVersion
   */
  function checkVersion(current, expectedVersion) {
    if (expectedVersion === undefined || expectedVersion === null) return;
    if (expectedVersion === 'new') {
      if (current) throw new AccessError(409, 'ALREADY_EXISTS', 'Cette fiche existe déjà : ouvrez-la depuis la liste pour la modifier.');
      return;
    }
    if ((current?.version || 0) !== Number(expectedVersion)) {
      throw new AccessError(409, 'CONFLICT', 'Cette fiche a été modifiée entre-temps. Rechargez la page avant d’enregistrer.');
    }
  }

  /** Vérifie qu'une modification ne retire pas à l'administrateur ses propres droits d'administration. */
  async function assertNoSelfLockout(/** @type {string} */ actor, /** @type {() => Promise<boolean>} */ stillAdmin) {
    if (isBootstrapAdmin(actor)) return;
    if (!(await stillAdmin())) {
      throw new AccessError(
        409,
        'SELF_LOCKOUT',
        'Cette modification vous retirerait l’accès à l’administration. Demandez à un autre administrateur de la faire.',
      );
    }
  }

  return {
    catalog,
    isBootstrapAdmin,
    isAdmissibleIdentity,
    seed,
    getProfile,
    recordLogin,
    requireAdmin,

    /**
     * Droits transmis à une application dans son jeton.
     * @param {NonNullable<Awaited<ReturnType<typeof getProfile>>>} profile
     * @param {string} appId
     */
    appGrant(profile, appId) {
      const app = findApp(catalog, appId);
      if (!app || app.status !== 'connected') throw new AccessError(404, 'APP_NOT_CONNECTED', 'Application non branchée.');
      if (!profile.access.apps[appId]?.allowed) throw new AccessError(403, 'APP_FORBIDDEN', 'Accès refusé à cette application.');
      return { app, modules: allowedModules(profile.access, appId) };
    },

    async listRoles() {
      const [roles, users] = await Promise.all([store.listRoles(), store.listUsers()]);
      return roles.map((role) => ({ ...role, userCount: users.filter((u) => u.roleId === role.id).length }));
    },

    /** @param {string} actor @param {unknown} input @param {unknown} [expectedVersion] */
    async saveRole(actor, input, expectedVersion) {
      const role = wrapValidation(() => sanitizeRole(input, catalog));
      const before = await store.getRole(role.id);
      checkVersion(before, expectedVersion);
      const saved = { ...role, version: (before?.version || 0) + 1, updatedAt: now().toISOString(), updatedBy: actor };
      const actorUser = await store.getUser(actor);
      if (actorUser?.roleId === role.id && !actorUser.overrides?.[ADMIN_APP_ID]?.access) {
        await assertNoSelfLockout(actor, async () => resolveAccess({ catalog, role: saved, user: actorUser }).isAdmin);
      }
      await store.putRole(saved);
      await audit(actor, before ? 'role.update' : 'role.create', `role:${role.id}`, before, saved);
      return saved;
    },

    /** @param {string} actor @param {string} roleId */
    async deleteRole(actor, roleId) {
      const before = await store.getRole(roleId);
      if (!before) throw new AccessError(404, 'NOT_FOUND', 'Rôle introuvable.');
      const used = (await store.listUsers()).filter((u) => u.roleId === roleId).length;
      if (used) {
        throw new AccessError(409, 'ROLE_IN_USE', `Ce rôle est attribué à ${used} personne(s). Changez d’abord leur rôle.`);
      }
      await store.deleteRole(roleId);
      await audit(actor, 'role.delete', `role:${roleId}`, before, null);
    },

    async listUsers() {
      return store.listUsers();
    },

    /** @param {string} actor @param {unknown} input @param {unknown} [expectedVersion] */
    async saveUser(actor, input, expectedVersion) {
      const user = wrapValidation(() => sanitizeUser(input, catalog));
      if (!canBeRegistered(user.email)) {
        throw new AccessError(
          400,
          'EMAIL_NOT_ALLOWED',
          `Seules les adresses @${domain} peuvent être enregistrées.`,
        );
      }
      if (user.roleId && !(await store.getRole(user.roleId))) {
        throw new AccessError(400, 'UNKNOWN_ROLE', 'Le rôle choisi n’existe pas.');
      }
      const before = await store.getUser(user.email);
      checkVersion(before, expectedVersion);
      const saved = {
        ...user,
        ...(before?.lastLoginAt ? { lastLoginAt: before.lastLoginAt } : {}),
        version: (before?.version || 0) + 1,
        updatedAt: now().toISOString(),
        updatedBy: actor,
      };
      if (normalizeEmail(actor) === saved.email) {
        await assertNoSelfLockout(actor, async () => {
          if (!saved.active) return false;
          const role = saved.roleId ? await store.getRole(saved.roleId) : null;
          return resolveAccess({ catalog, role, user: saved }).isAdmin;
        });
      }
      await store.putUser(saved);
      await audit(actor, before ? 'user.update' : 'user.create', `user:${saved.email}`, before, saved);
      return saved;
    },

    /** @param {string} actor @param {string} rawEmail */
    async deleteUser(actor, rawEmail) {
      const email = normalizeEmail(rawEmail);
      const before = await store.getUser(email);
      if (!before) throw new AccessError(404, 'NOT_FOUND', 'Utilisateur introuvable.');
      if (email === normalizeEmail(actor)) {
        throw new AccessError(409, 'SELF_LOCKOUT', 'Vous ne pouvez pas supprimer votre propre compte.');
      }
      await store.deleteUser(email);
      await audit(actor, 'user.delete', `user:${email}`, before, null);
    },

    /** @param {number} [limit] */
    async listAudit(limit = 200) {
      return store.listAudit(Math.min(Math.max(1, Number(limit) || 200), 1000));
    },
  };
}

/**
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
function wrapValidation(fn) {
  try {
    return fn();
  } catch (error) {
    if (error instanceof AccessValidationError) throw new AccessError(400, error.code, error.message);
    throw error;
  }
}

const LEGACY_MODULE_TO_APP = {
  'quick.alpab': 'alphap',
  'quick.meeting-management': 'meetings',
  'quick.5s': '5s',
  'excellence-terrain.5s': '5s',
};

/**
 * Reprise de l'ancienne variable MAINTEX_USERS_JSON : chaque module ouvert
 * devient une exception individuelle « Autorisé ».
 * @param {string} json
 * @returns {UserRecord[]}
 */
export function parseLegacyUsers(json) {
  let entries;
  try {
    entries = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(entries)) return [];
  /** @type {UserRecord[]} */
  const users = [];
  for (const entry of entries) {
    if (!entry || typeof entry.email !== 'string') continue;
    /** @type {Record<string, { access: 'allow' }>} */
    const overrides = {};
    for (const mod of Array.isArray(entry.modules) ? entry.modules : []) {
      const appId = LEGACY_MODULE_TO_APP[/** @type {keyof typeof LEGACY_MODULE_TO_APP} */ (mod?.id)];
      if (appId && Array.isArray(mod.permissions) && mod.permissions.includes('open')) {
        overrides[appId] = { access: 'allow' };
      }
    }
    try {
      users.push(sanitizeUser({ email: entry.email, name: entry.name, active: entry.active !== false, overrides }));
    } catch {
      // Entrée invalide ignorée.
    }
  }
  return users;
}
