// @ts-check
/**
 * Routes HTTP de MAINTeX (Express).
 */
import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { APP_CATALOG, normalizeEmail } from '../shared/access.js';
import { AccessError } from './access-service.js';
import { signSession, verifySession, readCookie, signAppToken } from './tokens.js';

const SESSION_COOKIE = 'maintex_session';
const SESSION_HOURS = 8;
const APP_TOKEN_SECONDS = 300;

/**
 * @param {{
 *   service: ReturnType<typeof import('./access-service.js').createAccessService>,
 *   config: {
 *     googleClientId: string,
 *     sessionSecret: string,
 *     publicUrl: string,
 *     appUrls: Record<string, string>,
 *     distDir: string,
 *     secureCookies: boolean,
 *     storeKind: string,
 *   },
 *   signing: ReturnType<typeof import('./tokens.js').loadSigningKey>,
 *   verifyGoogleToken?: (credential: string) => Promise<Record<string, any> | undefined>,
 *   log?: Pick<Console, 'info' | 'warn' | 'error'>,
 * }} options
 */
export function createApp({ service, config, signing, verifyGoogleToken, log = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '256kb' }));

  const oauthClient = new OAuth2Client();
  const verifyGoogle =
    verifyGoogleToken ||
    (async (/** @type {string} */ credential) => {
      const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
      return ticket.getPayload();
    });

  const authEnabled = Boolean(config.googleClientId && config.sessionSecret && config.sessionSecret.length >= 32);
  const cookieOptions = {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: /** @type {const} */ ('lax'),
    path: '/',
  };

  /** Applications branchées, avec leur adresse, pour l'interface. */
  function appsFor(/** @type {Awaited<ReturnType<typeof service.getProfile>>} */ profile) {
    return APP_CATALOG.filter((a) => a.status !== 'internal').map((a) => ({
      id: a.id,
      label: a.label,
      subtitle: a.subtitle,
      status: a.status === 'connected' && config.appUrls[a.id] ? 'connected' : 'planned',
      url: a.status === 'connected' ? config.appUrls[a.id] || null : null,
      allowed: Boolean(profile?.access.apps[a.id]?.allowed),
    }));
  }

  /** @param {Awaited<ReturnType<typeof service.getProfile>>} profile */
  // Mode démonstration : toute personne qui ouvre MAINTeX est admise sous une
  // identité unique, sans connexion. Destiné à faire visiter la plateforme
  // chargée de données fictives. Vide = mode éteint, comportement normal.
  const demoEmail = normalizeEmail(config.demoEmail || '');
  const demoName = String(config.demoName || '').trim();

  function publicProfile(profile, { demo = false } = {}) {
    if (!profile) return null;
    return {
      user: {
        email: profile.email,
        name: demo && demoName ? demoName : profile.name,
        roleId: profile.roleId,
        roleLabel: profile.roleLabel,
        bootstrapAdmin: profile.bootstrapAdmin,
      },
      access: profile.access,
      apps: appsFor(profile),
      demo,
    };
  }

  /** @param {express.Request} req */
  async function currentProfile(req) {
    const session = verifySession(readCookie(req.headers.cookie, SESSION_COOKIE), config.sessionSecret);
    if (session) {
      const profile = await service.getProfile(session.email);
      if (profile) return profile;
    }
    // Personne n'est connecté : en mode démonstration, on admet le visiteur.
    if (demoEmail) return service.getProfile(demoEmail);
    return null;
  }

  /** Vrai si la personne n'a pas de session à elle et entre par le mode démonstration. */
  function isDemoVisitor(req) {
    if (!demoEmail) return false;
    return !verifySession(readCookie(req.headers.cookie, SESSION_COOKIE), config.sessionSecret);
  }

  /** Protection CSRF : les requêtes qui modifient doivent venir du shell (en-tête personnalisé). */
  /** @type {express.RequestHandler} */
  const requireShellHeader = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('x-requested-with') !== 'maintex') {
      res.status(403).json({ error: 'CSRF_HEADER_MISSING' });
      return;
    }
    next();
  };

  /** @param {(req: express.Request, res: express.Response) => Promise<void>} handler */
  const route = (handler) => /** @type {express.RequestHandler} */ (async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof AccessError) {
        res.status(error.status).json({ error: error.code, message: error.message });
        return;
      }
      log.error('[maintex] erreur', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erreur interne. Réessayez plus tard.' });
    }
  });

  app.use('/api', requireShellHeader);

  app.get('/api/health', route(async (_req, res) => {
    res.json({ ok: true, store: config.storeKind, auth: authEnabled, appTokens: Boolean(signing), demo: Boolean(demoEmail) });
  }));

  // --- Authentification -----------------------------------------------------

  app.get('/api/auth/config', route(async (_req, res) => {
    res.json({ enabled: authEnabled && !demoEmail, clientId: authEnabled ? config.googleClientId : '', demo: Boolean(demoEmail) });
  }));

  app.post('/api/auth/google', route(async (req, res) => {
    if (!authEnabled) {
      res.status(503).json({ error: 'AUTH_NOT_CONFIGURED', message: 'Connexion non configurée sur ce serveur.' });
      return;
    }
    const credential = req.body?.credential;
    if (typeof credential !== 'string' || credential.length < 100 || credential.length > 12000) {
      res.status(400).json({ error: 'INVALID_CREDENTIAL' });
      return;
    }
    /** @type {Record<string, any> | undefined} */
    let info;
    try {
      info = await verifyGoogle(credential);
    } catch {
      res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN', message: 'Jeton Google invalide.' });
      return;
    }
    const email = normalizeEmail(info?.email);
    if (!info?.sub || !info?.email_verified || !email || !service.isAdmissibleIdentity(email, info?.hd)) {
      res.status(403).json({ error: 'IDENTITY_NOT_ALLOWED', message: 'Ce compte Google n’est pas autorisé sur MAINTeX.' });
      return;
    }
    const profile = await service.getProfile(email);
    if (!profile) {
      res.status(403).json({
        error: 'USER_NOT_AUTHORIZED',
        message: 'Votre compte n’est pas encore enregistré dans MAINTeX. Contactez l’administrateur.',
      });
      return;
    }
    await service.recordLogin(email);
    const maxAge = SESSION_HOURS * 60 * 60 * 1000;
    res.cookie(SESSION_COOKIE, signSession({ email, exp: Date.now() + maxAge }, config.sessionSecret), { ...cookieOptions, maxAge });
    res.json(publicProfile(profile));
  }));

  app.get('/api/auth/me', route(async (req, res) => {
    const profile = await currentProfile(req);
    if (!profile) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    res.json(publicProfile(profile, { demo: isDemoVisitor(req) }));
  }));

  app.post('/api/auth/logout', route(async (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.json({ ok: true });
  }));

  // --- Jetons pour les applications ----------------------------------------

  app.get('/.well-known/jwks.json', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ keys: signing ? [signing.jwk] : [] });
  });

  app.use('/api/admin', route(async (req, res, next) => {
    if (isDemoVisitor(req)) {
      res.status(403).json({ error: 'DEMO_READ_ONLY', message: 'Zone d’administration fermée en mode démonstration.' });
      return;
    }
    next();
  }));

  app.post('/api/apps/:appId/token', route(async (req, res) => {
    const profile = await currentProfile(req);
    if (!profile) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    const { app: target, modules } = service.appGrant(profile, req.params.appId);
    if (!signing) {
      res.status(503).json({ error: 'SIGNING_KEY_NOT_CONFIGURED', message: 'Clé de signature des jetons non configurée.' });
      return;
    }
    const iat = Math.floor(Date.now() / 1000);
    const token = signAppToken(
      {
        iss: config.publicUrl,
        aud: `maintex:${target.id}`,
        sub: profile.email,
        email: profile.email,
        name: profile.name,
        role: profile.roleId,
        roleLabel: profile.roleLabel,
        modules,
        iat,
        nbf: iat - 30,
        exp: iat + APP_TOKEN_SECONDS,
        jti: crypto.randomUUID(),
      },
      signing,
    );
    res.json({ token, expiresIn: APP_TOKEN_SECONDS, modules });
  }));

  // --- Administration -------------------------------------------------------

  /** @param {(req: express.Request, res: express.Response, actor: string) => Promise<void>} handler */
  const adminRoute = (handler) =>
    route(async (req, res) => {
      const profile = await currentProfile(req);
      if (!profile) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }
      service.requireAdmin(profile);
      await handler(req, res, profile.email);
    });

  app.get('/api/admin/catalog', adminRoute(async (_req, res) => {
    res.json({ apps: service.catalog });
  }));

  app.get('/api/admin/roles', adminRoute(async (_req, res) => {
    res.json({ roles: await service.listRoles() });
  }));

  app.put('/api/admin/roles/:id', adminRoute(async (req, res, actor) => {
    const { expectedVersion, ...role } = req.body || {};
    if (role.id && role.id !== req.params.id) throw new AccessError(400, 'ID_MISMATCH', 'Identifiant incohérent.');
    res.json({ role: await service.saveRole(actor, { ...role, id: req.params.id }, expectedVersion) });
  }));

  app.delete('/api/admin/roles/:id', adminRoute(async (req, res, actor) => {
    await service.deleteRole(actor, req.params.id);
    res.json({ ok: true });
  }));

  app.get('/api/admin/users', adminRoute(async (_req, res) => {
    res.json({ users: await service.listUsers() });
  }));

  app.put('/api/admin/users/:email', adminRoute(async (req, res, actor) => {
    const { expectedVersion, ...user } = req.body || {};
    const email = normalizeEmail(req.params.email);
    if (user.email && normalizeEmail(user.email) !== email) {
      throw new AccessError(400, 'ID_MISMATCH', 'Adresse incohérente.');
    }
    res.json({ user: await service.saveUser(actor, { ...user, email }, expectedVersion) });
  }));

  app.delete('/api/admin/users/:email', adminRoute(async (req, res, actor) => {
    await service.deleteUser(actor, req.params.email);
    res.json({ ok: true });
  }));

  app.get('/api/admin/audit', adminRoute(async (req, res) => {
    res.json({ entries: await service.listAudit(Number(req.query.limit) || 200) });
  }));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND' });
  });

  // --- Interface ------------------------------------------------------------

  app.use(express.static(config.distDir, { index: 'index.html' }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.distDir, 'index.html'));
  });

  return app;
}
