// @ts-check
/**
 * MAINTeX — modèle d'accès partagé (serveur + interface).
 *
 * Deux niveaux de droits : l'application, puis les modules de l'application.
 *
 * Règle de résolution (case par case) :
 *  1. Un rôle donne « Autorisé » ou « Refusé » pour chaque application.
 *     Une application absente du rôle est refusée.
 *  2. Un module absent du rôle suit l'accès à son application.
 *  3. Une personne peut avoir des exceptions : pour chaque case (application
 *     ou module), « Autorisé », « Refusé » ou rien (= hérité du rôle).
 *     L'exception individuelle l'emporte toujours sur le rôle.
 *  4. Si l'application est refusée, tous ses modules le sont.
 *
 * Ce fichier ne dépend d'aucune bibliothèque : il est importé tel quel par
 * le serveur Node et par l'interface (Vite).
 */

export const ADMIN_APP_ID = 'maintex-admin';

/** @typedef {'allow' | 'deny'} Decision */
/** @typedef {{ id: string, label: string }} ModuleDef */
/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   subtitle: string,
 *   status: 'connected' | 'planned' | 'internal',
 *   modules: ModuleDef[],
 * }} AppDef
 */
/** @typedef {{ access?: Decision, modules?: Record<string, Decision> }} AppRule */
/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   description?: string,
 *   apps: Record<string, AppRule>,
 *   version?: number,
 *   updatedAt?: string,
 *   updatedBy?: string,
 * }} Role
 */
/**
 * @typedef {{
 *   email: string,
 *   name: string,
 *   roleId: string | null,
 *   active: boolean,
 *   overrides: Record<string, AppRule>,
 *   version?: number,
 *   updatedAt?: string,
 *   updatedBy?: string,
 *   lastLoginAt?: string,
 * }} UserRecord
 */
/** @typedef {'role' | 'user' | 'default' | 'app' | 'bootstrap'} DecisionSource */
/** @typedef {{ allowed: boolean, source: DecisionSource }} ResolvedDecision */
/**
 * @typedef {{
 *   allowed: boolean,
 *   source: DecisionSource,
 *   modules: Record<string, ResolvedDecision>,
 * }} ResolvedApp
 */
/** @typedef {{ isAdmin: boolean, apps: Record<string, ResolvedApp> }} EffectiveAccess */

/**
 * Catalogue des applications et de leurs modules.
 * Les identifiants de modules sont ceux utilisés dans chaque application,
 * pour qu'elles puissent appliquer les droits sans table de correspondance.
 * @type {AppDef[]}
 */
export const APP_CATALOG = [
  {
    id: ADMIN_APP_ID,
    label: 'Administration MAINTeX',
    subtitle: 'Utilisateurs, rôles et droits d’accès',
    status: 'internal',
    modules: [],
  },
  {
    id: '5s',
    label: '5S Digital Management',
    subtitle: 'Gestion 5S et Maintenance Autonome',
    status: 'connected',
    modules: [
      { id: 'cockpit', label: 'Cockpit 5S' },
      { id: 'lot9', label: 'Fiches zones 5S' },
      { id: 'ma', label: 'Maintenance Autonome' },
      { id: 'factories', label: 'Usines' },
      { id: 'zones', label: 'Zones' },
      { id: 'audits', label: 'Audits' },
      { id: 'actions', label: "Plan d'actions" },
      { id: 'documents', label: 'Documents' },
      { id: 'photos', label: 'Photos' },
      { id: 'reports', label: 'Rapports' },
      { id: 'ai_assistant', label: 'Assistant IA' },
      { id: 'admin', label: 'Administration' },
    ],
  },
  {
    id: 'alphap',
    label: 'ALPHAP',
    subtitle: 'Gestion des travaux de maintenance',
    status: 'connected',
    modules: [
      { id: 'COCKPIT', label: 'Cockpit' },
      { id: 'IMPORTS_SAP', label: 'Imports SAP' },
      { id: 'GATEKEEPING', label: 'Gatekeeping' },
      { id: 'PREPARATION', label: 'Préparation' },
      { id: 'SCHEDULING', label: 'Ordonnancement' },
      { id: 'GANTT', label: 'Chronogramme Gantt' },
      { id: 'EXECUTION', label: 'Exécution' },
      { id: 'ARRETS', label: 'Arrêts de maintenance' },
      { id: 'CONSIGNATION', label: 'Consignation' },
      { id: 'IMA', label: 'IMA' },
      { id: 'KPI', label: 'KPI' },
      { id: 'MEETINGS', label: 'Réunions' },
      { id: 'RAPPORTS', label: 'Rapports' },
      { id: 'TASKS', label: 'Tâches' },
      { id: 'ADMIN', label: 'Admin' },
    ],
  },
  {
    id: 'meetings',
    label: 'Meeting Management',
    subtitle: 'Réunions et performance industrielle',
    status: 'connected',
    modules: [
      { id: 'cockpit', label: 'Cockpit' },
      { id: 'journal', label: 'Journal quotidien' },
      { id: 'arrets', label: 'Arrêts' },
      { id: 'reunions', label: 'Réunions' },
      { id: 'plan_actions', label: "Plan d'actions" },
      { id: 'kpi', label: 'KPI et graphiques' },
      { id: 'rapports', label: 'Rapports' },
      { id: 'admin', label: 'Administration' },
    ],
  },
  { id: 'rca', label: 'RCA', subtitle: 'Root Cause Analysis', status: 'planned', modules: [] },
  { id: 'ma', label: 'Maintenance Autonome', subtitle: 'Application dédiée', status: 'planned', modules: [] },
  { id: 'asset-criticity', label: 'Asset Criticity', subtitle: 'Criticité des équipements', status: 'planned', modules: [] },
  { id: 'fmea-mta', label: 'FMEA/MTA', subtitle: 'Analyse des modes de défaillance', status: 'planned', modules: [] },
  { id: 'rcm', label: 'RCM', subtitle: 'Reliability Centered Maintenance', status: 'planned', modules: [] },
  { id: 'cbm', label: 'CBM', subtitle: 'Condition Based Maintenance', status: 'planned', modules: [] },
];

/**
 * Correspondance entre les entrées de navigation du shell et les applications.
 * Une entrée absente de cette table est un écran d'attente (« module à
 * connecter ») ouvert à toute personne connectée.
 * @type {Record<string, string>}
 */
export const NAVIGATION_TO_APP = {
  'quick.alpab': 'alphap',
  'quick.meeting-management': 'meetings',
  'quick.rca': 'rca',
  'quick.5s': '5s',
  'quick.ma': 'ma',
  'quick.asset-criticity': 'asset-criticity',
  'quick.fmea': 'fmea-mta',
  'quick.rcm': 'rcm',
  'quick.cbm': 'cbm',
  'excellence-terrain.5s': '5s',
};

const ROLE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,47}$/;
const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

/** @param {AppDef[]} catalog @param {string} appId */
export function findApp(catalog, appId) {
  return catalog.find((app) => app.id === appId);
}

/** @param {unknown} value @returns {value is Decision} */
function isDecision(value) {
  return value === 'allow' || value === 'deny';
}

/**
 * @param {Decision | undefined} value
 * @param {DecisionSource} source
 * @returns {ResolvedDecision | null}
 */
function fromDecision(value, source) {
  return isDecision(value) ? { allowed: value === 'allow', source } : null;
}

/**
 * Calcule les droits effectifs d'une personne.
 * @param {{
 *   catalog?: AppDef[],
 *   role?: Role | null,
 *   user?: Pick<UserRecord, 'overrides'> | null,
 *   bootstrapAdmin?: boolean,
 * }} input
 * @returns {EffectiveAccess}
 */
export function resolveAccess({ catalog = APP_CATALOG, role = null, user = null, bootstrapAdmin = false }) {
  /** @type {Record<string, ResolvedApp>} */
  const apps = {};
  for (const app of catalog) {
    const roleRule = role?.apps?.[app.id] || {};
    const userRule = user?.overrides?.[app.id] || {};

    /** @type {ResolvedDecision} */
    let appDecision =
      fromDecision(userRule.access, 'user') ||
      fromDecision(roleRule.access, 'role') ||
      { allowed: false, source: 'default' };

    if (app.id === ADMIN_APP_ID && bootstrapAdmin) {
      appDecision = { allowed: true, source: 'bootstrap' };
    }

    /** @type {Record<string, ResolvedDecision>} */
    const modules = {};
    for (const mod of app.modules) {
      if (!appDecision.allowed) {
        modules[mod.id] = { allowed: false, source: 'app' };
        continue;
      }
      modules[mod.id] =
        fromDecision(userRule.modules?.[mod.id], 'user') ||
        fromDecision(roleRule.modules?.[mod.id], 'role') ||
        { allowed: true, source: 'app' };
    }
    apps[app.id] = { ...appDecision, modules };
  }
  return { isAdmin: Boolean(apps[ADMIN_APP_ID]?.allowed), apps };
}

/**
 * Liste des modules autorisés d'une application (pour le jeton transmis à l'application).
 * @param {EffectiveAccess} access @param {string} appId @returns {string[]}
 */
export function allowedModules(access, appId) {
  const app = access.apps[appId];
  if (!app?.allowed) return [];
  return Object.entries(app.modules)
    .filter(([, decision]) => decision.allowed)
    .map(([id]) => id);
}

/**
 * Indique si une entrée de navigation du shell peut être ouverte.
 * @param {EffectiveAccess | null | undefined} access
 * @param {string} navigationId
 * @param {AppDef[]} [catalog]
 */
export function canOpenNavigation(access, navigationId, catalog = APP_CATALOG) {
  if (!access) return false;
  const appId = NAVIGATION_TO_APP[navigationId];
  if (!appId) return true;
  const app = findApp(catalog, appId);
  if (!app || app.status === 'planned') return true;
  return Boolean(access.apps[appId]?.allowed);
}

/** @param {string} value */
export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/** @param {string} email */
export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email) && email.length <= 254;
}

export class AccessValidationError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'AccessValidationError';
    this.code = code;
  }
}

/**
 * Nettoie et valide un ensemble de règles (rôle ou exceptions individuelles).
 * @param {unknown} input
 * @param {AppDef[]} catalog
 * @param {{ requireAccess: boolean }} options
 * @returns {Record<string, AppRule>}
 */
function sanitizeRules(input, catalog, { requireAccess }) {
  if (input === undefined || input === null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new AccessValidationError('INVALID_RULES', 'Les droits doivent être un objet par application.');
  }
  /** @type {Record<string, AppRule>} */
  const result = {};
  for (const [appId, rawRule] of Object.entries(input)) {
    const app = findApp(catalog, appId);
    if (!app) throw new AccessValidationError('UNKNOWN_APP', `Application inconnue : ${appId}`);
    if (!rawRule || typeof rawRule !== 'object' || Array.isArray(rawRule)) {
      throw new AccessValidationError('INVALID_RULES', `Droits invalides pour ${appId}.`);
    }
    const rule = /** @type {Record<string, unknown>} */ (rawRule);
    /** @type {AppRule} */
    const clean = {};
    if (rule.access !== undefined && rule.access !== null && rule.access !== 'inherit') {
      if (!isDecision(rule.access)) {
        throw new AccessValidationError('INVALID_DECISION', `Valeur d’accès invalide pour ${appId}.`);
      }
      clean.access = rule.access;
    }
    if (requireAccess && !clean.access) clean.access = 'deny';

    if (rule.modules !== undefined && rule.modules !== null) {
      if (typeof rule.modules !== 'object' || Array.isArray(rule.modules)) {
        throw new AccessValidationError('INVALID_RULES', `Modules invalides pour ${appId}.`);
      }
      /** @type {Record<string, Decision>} */
      const modules = {};
      for (const [moduleId, decision] of Object.entries(rule.modules)) {
        if (!app.modules.some((mod) => mod.id === moduleId)) {
          throw new AccessValidationError('UNKNOWN_MODULE', `Module inconnu : ${appId}/${moduleId}`);
        }
        if (decision === undefined || decision === null || decision === 'inherit') continue;
        if (!isDecision(decision)) {
          throw new AccessValidationError('INVALID_DECISION', `Valeur invalide pour ${appId}/${moduleId}.`);
        }
        modules[moduleId] = decision;
      }
      if (Object.keys(modules).length) clean.modules = modules;
    }
    if (clean.access || clean.modules) result[appId] = clean;
  }
  return result;
}

/**
 * @param {unknown} input
 * @param {AppDef[]} [catalog]
 * @returns {Role}
 */
export function sanitizeRole(input, catalog = APP_CATALOG) {
  const raw = /** @type {Record<string, unknown>} */ (input && typeof input === 'object' ? input : {});
  const id = String(raw.id || '').trim().toLowerCase();
  if (!ROLE_ID_PATTERN.test(id)) {
    throw new AccessValidationError(
      'INVALID_ROLE_ID',
      'Identifiant de rôle invalide : 2 à 48 caractères, minuscules, chiffres et tirets.',
    );
  }
  const label = String(raw.label || '').trim();
  if (!label || label.length > 80) {
    throw new AccessValidationError('INVALID_LABEL', 'Le nom du rôle est obligatoire (80 caractères au plus).');
  }
  const description = String(raw.description || '').trim().slice(0, 300);
  return { id, label, description, apps: sanitizeRules(raw.apps, catalog, { requireAccess: true }) };
}

/**
 * @param {unknown} input
 * @param {AppDef[]} [catalog]
 * @returns {UserRecord}
 */
export function sanitizeUser(input, catalog = APP_CATALOG) {
  const raw = /** @type {Record<string, unknown>} */ (input && typeof input === 'object' ? input : {});
  const email = normalizeEmail(String(raw.email || ''));
  if (!isValidEmail(email)) throw new AccessValidationError('INVALID_EMAIL', 'Adresse e-mail invalide.');
  const name = String(raw.name || '').trim().slice(0, 120) || email;
  const roleId = raw.roleId ? String(raw.roleId).trim().toLowerCase() : null;
  return {
    email,
    name,
    roleId,
    active: raw.active !== false,
    overrides: sanitizeRules(raw.overrides, catalog, { requireAccess: false }),
  };
}

/**
 * Rôles créés au premier démarrage.
 * @param {AppDef[]} [catalog]
 * @returns {Role[]}
 */
export function defaultRoles(catalog = APP_CATALOG) {
  /** @type {Record<string, AppRule>} */
  const everything = {};
  for (const app of catalog) {
    if (app.status !== 'planned') everything[app.id] = { access: 'allow' };
  }
  return [
    {
      id: 'administrateur',
      label: 'Administrateur MAINTeX',
      description: 'Accès complet, y compris la gestion des utilisateurs et des rôles.',
      apps: everything,
    },
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      description: 'Aucun accès par défaut : à compléter par l’administrateur.',
      apps: {},
    },
  ];
}
