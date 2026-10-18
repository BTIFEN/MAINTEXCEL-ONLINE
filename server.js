import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
const oauthClient = new OAuth2Client();
const authClientId = process.env.MAINTEX_GOOGLE_CLIENT_ID || '';
const sessionSecret = process.env.MAINTEX_SESSION_SECRET || '';
const workspaceDomain = (process.env.MAINTEX_WORKSPACE_DOMAIN || 'aperam.com').toLowerCase();
const extraEmail = (process.env.MAINTEX_EXTRA_EMAIL || 'batifen.sprl@gmail.com').toLowerCase();
const cookieName = 'maintex_session';
function getRegistry() {
  try {
    const entries = JSON.parse(process.env.MAINTEX_USERS_JSON || '[]');
    if (!Array.isArray(entries)) return [];
    return entries.filter(item => item && typeof item.email === 'string' && Array.isArray(item.modules));
  } catch { return []; }
}
function signed(payload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(b64).digest('base64url');
  return b64 + '.' + sig;
}
function resolveSession(req) {
  if (!sessionSecret) return null;
  const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!session.email || !session.exp || session.exp < Date.now()) return null;
    const record = getRegistry().find(u => u.email.toLowerCase() === session.email && u.active !== false);
    if (!record) return null;
    return { email: session.email, name: record.name || session.email, modules: record.modules, role: record.role || 'Utilisateur' };
  } catch { return null; }
}
app.get('/api/auth/config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ enabled: Boolean(authClientId && sessionSecret), clientId: authClientId });
});
app.post('/api/auth/google', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!authClientId || !sessionSecret || sessionSecret.length < 32) return res.status(503).json({ error: 'AUTH_NOT_CONFIGURED' });
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || credential.length > 12000 || credential.length < 100) return res.status(400).json({ error: 'INVALID_CREDENTIAL' });
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: authClientId });
    const info = ticket.getPayload();
    const email = info?.email?.toLowerCase();
    const domainMember = info?.hd?.toLowerCase() === workspaceDomain && email?.endsWith('@' + workspaceDomain);
    if (!info?.sub || !info?.email_verified || !email || (!domainMember && email !== extraEmail)) return res.status(403).json({ error: 'IDENTITY_NOT_ALLOWED' });
    const record = getRegistry().find(u => u.email.toLowerCase() === email && u.active !== false);
    if (!record) return res.status(403).json({ error: 'USER_NOT_AUTHORIZED' });
    const expires = Date.now() + 8 * 60 * 60 * 1000;
    res.cookie(cookieName, signed({ email, exp: expires }), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    res.json({ user: { email, name: record.name || email, role: record.role || 'Utilisateur', modules: record.modules } });
  } catch { res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN' }); }
});
app.get('/api/auth/me', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const user = resolveSession(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  res.json({ user });
});
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(cookieName, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  res.json({ ok: true });
});
app.get('/api/auth/permissions/:moduleId', (req, res) => {
  const user = resolveSession(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const permissions = user.modules.find(m => m.id === req.params.moduleId)?.permissions || [];
  if (!permissions.includes('open')) return res.status(403).json({ error: 'MODULE_FORBIDDEN' });
  res.json({ moduleId: req.params.moduleId, permissions });
});

app.use(express.static(dist, { index: 'index.html' }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`MAINTEXCEL listening on port ${port}`);
});
