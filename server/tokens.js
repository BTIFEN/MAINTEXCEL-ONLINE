// @ts-check
/**
 * Jetons MAINTeX.
 *
 * - Session du shell : cookie HttpOnly signé HMAC (secret MAINTEX_SESSION_SECRET).
 * - Jeton d'application : JWT RS256 de courte durée, remis à une application
 *   (5S, ALPHAP, Meeting Management…) pour qu'elle reconnaisse la personne sans
 *   second login. Les applications vérifient la signature avec la clé publique
 *   exposée sur /.well-known/jwks.json.
 *
 * Aucune dépendance externe : uniquement node:crypto.
 */
import crypto from 'node:crypto';

const b64url = (/** @type {Buffer | string} */ value) => Buffer.from(value).toString('base64url');

/**
 * @param {Record<string, unknown>} payload
 * @param {string} secret
 */
export function signSession(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/**
 * @param {string | undefined} token
 * @param {string} secret
 * @param {number} [now]
 * @returns {{ email: string, exp: number } | null}
 */
export function verifySession(token, secret, now = Date.now()) {
  if (!token || !secret) return null;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof session?.email !== 'string' || typeof session?.exp !== 'number' || session.exp < now) return null;
    return { email: session.email, exp: session.exp };
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} header
 * @param {string} name
 */
export function readCookie(header, name) {
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

/**
 * Charge la clé de signature des jetons d'application.
 * En production, la clé doit être fournie (Secret Manager → variable
 * MAINTEX_SIGNING_KEY, clé privée RSA au format PEM). En développement, une
 * clé temporaire est générée : les jetons ne survivent pas à un redémarrage.
 * @param {{ pem?: string, production?: boolean }} options
 * @returns {{ key: crypto.KeyObject, kid: string, jwk: Record<string, string>, ephemeral: boolean } | null}
 */
export function loadSigningKey({ pem, production = false }) {
  /** @type {crypto.KeyObject} */
  let key;
  let ephemeral = false;
  if (pem && pem.trim()) {
    key = crypto.createPrivateKey(pem.replace(/\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'rsa') throw new Error('MAINTEX_SIGNING_KEY doit être une clé privée RSA.');
  } else if (production) {
    return null;
  } else {
    key = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    ephemeral = true;
  }
  const publicKey = crypto.createPublicKey(key);
  const jwk = /** @type {Record<string, string>} */ (publicKey.export({ format: 'jwk' }));
  const kid = crypto
    .createHash('sha256')
    .update(publicKey.export({ type: 'spki', format: 'der' }))
    .digest('base64url')
    .slice(0, 16);
  return { key, kid, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' }, ephemeral };
}

/**
 * @param {Record<string, unknown>} claims
 * @param {{ key: crypto.KeyObject, kid: string }} signing
 */
export function signAppToken(claims, signing) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: signing.kid }));
  const body = b64url(JSON.stringify(claims));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${body}`), signing.key).toString('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Vérification de référence d'un jeton d'application (utilisée par les tests
 * et reproductible telle quelle dans chaque application).
 * @param {string} token
 * @param {{ jwks: { keys: Record<string, string>[] }, issuer: string, audience: string, now?: number }} options
 * @returns {Record<string, any> | null}
 */
export function verifyAppToken(token, { jwks, issuer, audience, now = Date.now() }) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (header.alg !== 'RS256') return null;
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const publicKey = crypto.createPublicKey({ key: /** @type {any} */ (jwk), format: 'jwk' });
    const valid = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      publicKey,
      Buffer.from(parts[2], 'base64url'),
    );
    if (!valid) return null;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const seconds = Math.floor(now / 1000);
    if (claims.iss !== issuer || claims.aud !== audience) return null;
    if (typeof claims.exp !== 'number' || claims.exp < seconds) return null;
    if (typeof claims.nbf === 'number' && claims.nbf > seconds + 30) return null;
    return claims;
  } catch {
    return null;
  }
}
