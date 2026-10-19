// @ts-check
/**
 * Stockage des rôles, utilisateurs et du journal des modifications.
 *
 * Trois implémentations, même interface :
 *  - FirestoreStore : production sur Google Cloud (Cloud Run). Utilise l'API
 *    REST de Firestore avec le compte de service du service Cloud Run
 *    (google-auth-library, déjà présent) : aucune clé à gérer.
 *  - FileStore : un fichier JSON local (développement, hébergement classique).
 *  - MemoryStore : tests.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/** @typedef {import('../shared/access.js').Role} Role */
/** @typedef {import('../shared/access.js').UserRecord} UserRecord */
/**
 * @typedef {{
 *   id?: string,
 *   at: string,
 *   actor: string,
 *   action: string,
 *   target: string,
 *   before?: unknown,
 *   after?: unknown,
 * }} AuditEntry
 */
/**
 * @typedef {{
 *   kind: string,
 *   listRoles(): Promise<Role[]>,
 *   getRole(id: string): Promise<Role | null>,
 *   putRole(role: Role): Promise<void>,
 *   deleteRole(id: string): Promise<void>,
 *   listUsers(): Promise<UserRecord[]>,
 *   getUser(email: string): Promise<UserRecord | null>,
 *   putUser(user: UserRecord): Promise<void>,
 *   deleteUser(email: string): Promise<void>,
 *   appendAudit(entry: AuditEntry): Promise<void>,
 *   listAudit(limit: number): Promise<AuditEntry[]>,
 *   getMeta(key: string): Promise<any>,
 *   putMeta(key: string, value: any): Promise<void>,
 * }} AccessStore
 */

const clone = (/** @type {any} */ value) => (value === undefined ? undefined : structuredClone(value));
const newAuditId = (/** @type {string} */ at) => `${at.replace(/[^0-9]/g, '')}-${crypto.randomBytes(4).toString('hex')}`;

/** @returns {{ roles: Record<string, Role>, users: Record<string, UserRecord>, audit: AuditEntry[], meta: Record<string, any> }} */
const emptyData = () => ({ roles: {}, users: {}, audit: [], meta: {} });

/** @implements {AccessStore} */
export class MemoryStore {
  kind = 'memory';
  constructor() {
    this.data = emptyData();
  }
  /** Hook appelé après chaque écriture (utilisé par FileStore). */
  async persist() {}
  async listRoles() {
    return Object.values(this.data.roles).map(clone).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }
  /** @param {string} id */
  async getRole(id) {
    return clone(this.data.roles[id]) || null;
  }
  /** @param {Role} role */
  async putRole(role) {
    this.data.roles[role.id] = clone(role);
    await this.persist();
  }
  /** @param {string} id */
  async deleteRole(id) {
    delete this.data.roles[id];
    await this.persist();
  }
  async listUsers() {
    return Object.values(this.data.users).map(clone).sort((a, b) => a.email.localeCompare(b.email));
  }
  /** @param {string} email */
  async getUser(email) {
    return clone(this.data.users[email]) || null;
  }
  /** @param {UserRecord} user */
  async putUser(user) {
    this.data.users[user.email] = clone(user);
    await this.persist();
  }
  /** @param {string} email */
  async deleteUser(email) {
    delete this.data.users[email];
    await this.persist();
  }
  /** @param {AuditEntry} entry */
  async appendAudit(entry) {
    this.data.audit.push({ id: newAuditId(entry.at), ...clone(entry) });
    if (this.data.audit.length > 5000) this.data.audit.splice(0, this.data.audit.length - 5000);
    await this.persist();
  }
  /** @param {number} limit */
  async listAudit(limit) {
    return this.data.audit.slice(-limit).reverse().map(clone);
  }
  /** @param {string} key */
  async getMeta(key) {
    return clone(this.data.meta[key]) ?? null;
  }
  /** @param {string} key @param {any} value */
  async putMeta(key, value) {
    this.data.meta[key] = clone(value);
    await this.persist();
  }
}

/** Stockage dans un fichier JSON local, écrit de façon atomique. */
export class FileStore extends MemoryStore {
  kind = 'file';
  /** @param {string} file */
  constructor(file) {
    super();
    this.file = file;
    /** @type {Promise<void>} */
    this.queue = Promise.resolve();
  }
  async load() {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8'));
      this.data = { ...emptyData(), ...parsed };
    } catch (error) {
      if (/** @type {any} */ (error).code !== 'ENOENT') throw error;
      this.data = emptyData();
    }
    return this;
  }
  async persist() {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.queue = this.queue.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, this.file);
    });
    await this.queue;
  }
}

// ---------------------------------------------------------------------------
// Firestore (API REST)
// ---------------------------------------------------------------------------

/**
 * Convertit une valeur JavaScript en valeur Firestore.
 * @param {any} value
 * @returns {Record<string, any>}
 */
export function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: value.length ? { values: value.map(toFirestoreValue) } : {} };
  }
  if (typeof value === 'object') return { mapValue: { fields: toFirestoreFields(value) } };
  throw new TypeError(`Type non pris en charge : ${typeof value}`);
}

/** @param {Record<string, any>} object */
export function toFirestoreFields(object) {
  /** @type {Record<string, any>} */
  const fields = {};
  for (const [key, value] of Object.entries(object)) {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  }
  return fields;
}

/**
 * @param {Record<string, any>} value
 * @returns {any}
 */
export function fromFirestoreValue(value) {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}

/** @param {Record<string, any>} fields */
export function fromFirestoreFields(fields) {
  /** @type {Record<string, any>} */
  const object = {};
  for (const [key, value] of Object.entries(fields || {})) object[key] = fromFirestoreValue(value);
  return object;
}

/**
 * @typedef {(options: { url: string, method?: string, data?: unknown }) => Promise<{ status: number, data: any }>} HttpRequest
 */

/** @implements {AccessStore} */
export class FirestoreStore {
  kind = 'firestore';
  /**
   * @param {{ projectId: string, database?: string, prefix?: string, request: HttpRequest }} options
   */
  constructor({ projectId, database = '(default)', prefix = 'maintex_', request }) {
    if (!projectId) throw new Error('Projet Google Cloud introuvable pour Firestore (GOOGLE_CLOUD_PROJECT).');
    this.root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(database)}/documents`;
    this.prefix = prefix;
    this.request = request;
  }

  /** @param {string} collection */
  col(collection) {
    return `${this.prefix}${collection}`;
  }

  /** @param {string} collection @param {string} id */
  docUrl(collection, id) {
    return `${this.root}/${this.col(collection)}/${encodeURIComponent(id)}`;
  }

  /**
   * @param {string} collection @param {string} id
   * @returns {Promise<any>}
   */
  async getDoc(collection, id) {
    try {
      const response = await this.request({ url: this.docUrl(collection, id), method: 'GET' });
      return fromFirestoreFields(response.data.fields || {});
    } catch (error) {
      if (statusOf(error) === 404) return null;
      throw error;
    }
  }

  /** @param {string} collection @param {string} id @param {Record<string, any>} data */
  async setDoc(collection, id, data) {
    await this.request({ url: this.docUrl(collection, id), method: 'PATCH', data: { fields: toFirestoreFields(data) } });
  }

  /** @param {string} collection @param {string} id */
  async deleteDoc(collection, id) {
    try {
      await this.request({ url: this.docUrl(collection, id), method: 'DELETE' });
    } catch (error) {
      if (statusOf(error) !== 404) throw error;
    }
  }

  /** @param {string} collection */
  async listDocs(collection) {
    /** @type {any[]} */
    const items = [];
    let pageToken = '';
    do {
      const url = `${this.root}/${this.col(collection)}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const response = await this.request({ url, method: 'GET' });
      for (const doc of response.data.documents || []) items.push(fromFirestoreFields(doc.fields || {}));
      pageToken = response.data.nextPageToken || '';
    } while (pageToken);
    return items;
  }

  async listRoles() {
    return (await this.listDocs('roles')).sort((a, b) => String(a.label).localeCompare(String(b.label), 'fr'));
  }
  /** @param {string} id */
  async getRole(id) {
    return this.getDoc('roles', id);
  }
  /** @param {Role} role */
  async putRole(role) {
    await this.setDoc('roles', role.id, role);
  }
  /** @param {string} id */
  async deleteRole(id) {
    await this.deleteDoc('roles', id);
  }
  async listUsers() {
    return (await this.listDocs('users')).sort((a, b) => String(a.email).localeCompare(String(b.email)));
  }
  /** @param {string} email */
  async getUser(email) {
    return this.getDoc('users', email);
  }
  /** @param {UserRecord} user */
  async putUser(user) {
    await this.setDoc('users', user.email, user);
  }
  /** @param {string} email */
  async deleteUser(email) {
    await this.deleteDoc('users', email);
  }
  /** @param {AuditEntry} entry */
  async appendAudit(entry) {
    const id = newAuditId(entry.at);
    await this.setDoc('audit', id, { id, ...entry });
  }
  /** @param {number} limit */
  async listAudit(limit) {
    const response = await this.request({
      url: `${this.root}:runQuery`,
      method: 'POST',
      data: {
        structuredQuery: {
          from: [{ collectionId: this.col('audit') }],
          orderBy: [{ field: { fieldPath: 'at' }, direction: 'DESCENDING' }],
          limit,
        },
      },
    });
    return (response.data || []).filter((/** @type {any} */ row) => row.document).map((/** @type {any} */ row) => fromFirestoreFields(row.document.fields));
  }
  /** @param {string} key */
  async getMeta(key) {
    const doc = await this.getDoc('meta', key);
    return doc ? doc.value : null;
  }
  /** @param {string} key @param {any} value */
  async putMeta(key, value) {
    await this.setDoc('meta', key, { value });
  }
}

/** @param {any} error */
function statusOf(error) {
  return error?.response?.status ?? error?.status ?? error?.code;
}

/**
 * Choisit le stockage selon l'environnement.
 * MAINTEX_STORE = firestore | file | memory. Par défaut : firestore sur
 * Cloud Run (variable K_SERVICE présente), fichier local ailleurs.
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<AccessStore>}
 */
export async function createStoreFromEnv(env) {
  const kind = (env.MAINTEX_STORE || (env.K_SERVICE ? 'firestore' : 'file')).toLowerCase();
  if (kind === 'memory') return new MemoryStore();
  if (kind === 'file') {
    const file = env.MAINTEX_DATA_FILE || path.join(process.cwd(), 'data', 'maintex-access.json');
    return new FileStore(file).load();
  }
  if (kind === 'firestore') {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/datastore'] });
    const projectId = env.MAINTEX_FIRESTORE_PROJECT || env.GOOGLE_CLOUD_PROJECT || (await auth.getProjectId());
    const client = await auth.getClient();
    return new FirestoreStore({
      projectId,
      database: env.MAINTEX_FIRESTORE_DATABASE || '(default)',
      // Préfixe des collections : sépare les données de préproduction de celles de production.
      prefix: env.MAINTEX_FIRESTORE_PREFIX || 'maintex_',
      request: (options) => /** @type {any} */ (client.request(/** @type {any} */ ({ ...options, retry: true }))),
    });
  }
  throw new Error(`MAINTEX_STORE inconnu : ${kind}`);
}
