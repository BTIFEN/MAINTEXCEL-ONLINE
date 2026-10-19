import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../Header';
import MaintexHome from '../MaintexHome';
import Workspace from './Workspace';
import AdminPanel from '../admin/AdminPanel';
import type { ShellNavigationTarget } from '../../types/shell';
import type { EffectiveAccess, ShellSession } from '../../types/access';
import type { QuickAccessEntry } from '../Header';
import { DOMAINS_CONFIG } from '../../config/domainsConfig';
import { QUICK_MODULES, findModule } from '../../config/moduleRegistry';
import { canOpenNavigation } from '../../../shared/access.js';
import { api, ApiError } from '../../shell/api';
import { interpretMessage } from '../../shell/messageBridge';

type View = { kind: 'home' } | { kind: 'app'; target: ShellNavigationTarget } | { kind: 'admin' };

const resolveTarget = (moduleId: string, label?: string, domainId?: string, subtitle?: string): ShellNavigationTarget => {
  const domain = DOMAINS_CONFIG.find((item) => item.id === domainId);
  return { moduleId, label: label || moduleId, domainId, domainName: domain?.name, subtitle };
};

const canOpen = (access: EffectiveAccess | undefined, moduleId: string) =>
  canOpenNavigation(access as Parameters<typeof canOpenNavigation>[0], moduleId);

export default function MaintexShell() {
  const [session, setSession] = useState<ShellSession | null>(null);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');
  const [clientId, setClientId] = useState('');
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ShellSession | null>(null);
  sessionRef.current = session;

  /** Recharge le profil (droits à jour) ; null si la session a expiré. */
  const refreshSession = useCallback(async () => {
    try {
      const data = await api<ShellSession>('/api/auth/me');
      setSession(data);
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession(null);
        setView({ kind: 'home' });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setAuthLoading(false));
    api<{ enabled: boolean; clientId: string }>('/api/auth/config')
      .then((data) => {
        if (data.enabled) setClientId(data.clientId);
      })
      .catch(() => {});
  }, [refreshSession]);

  // Droits modifiés par un administrateur : pris en compte au retour sur l'onglet.
  useEffect(() => {
    const onFocus = () => {
      if (sessionRef.current) void refreshSession();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshSession]);

  // Bouton « Se connecter avec Google ».
  useEffect(() => {
    if (!clientId || session || authLoading || !googleLoginRef.current) return;
    let active = true;
    let script: HTMLScriptElement | undefined;
    const initialize = () => {
      const google = (window as any).google;
      if (!active || !google?.accounts?.id || !googleLoginRef.current) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            setAuthError('');
            const data = await api<ShellSession>('/api/auth/google', { method: 'POST', body: { credential: response.credential } });
            setSession(data);
            setView({ kind: 'home' });
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Connexion refusée.');
          }
        },
      });
      google.accounts.id.renderButton(googleLoginRef.current, { theme: 'outline', size: 'large', text: 'signin_with', width: 280 });
    };
    if ((window as any).google?.accounts?.id) initialize();
    else {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initialize;
      document.head.appendChild(script);
    }
    return () => {
      active = false;
      if (script?.parentNode) script.parentNode.removeChild(script);
    };
  }, [clientId, session, authLoading]);

  const requestToken = useCallback(async (appId: string) => {
    const data = await api<{ token: string }>(`/api/apps/${encodeURIComponent(appId)}/token`, { method: 'POST' });
    return data.token;
  }, []);

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // La session locale est fermée quoi qu'il arrive.
    }
    setSession(null);
    setView({ kind: 'home' });
  };

  const handleHome = useCallback(() => {
    setNotice('');
    setView({ kind: 'home' });
  }, []);

  // Accès rapide du bandeau : uniquement les applications réellement branchées,
  // et seulement celles que la personne a le droit d'ouvrir.
  const quickAccess: QuickAccessEntry[] = !session
    ? []
    : QUICK_MODULES.flatMap((module) => {
        if (!module.appId) return [];
        const app = session.apps.find((candidate) => candidate.id === module.appId);
        if (!app || app.status !== 'connected' || !app.allowed || !app.url) return [];
        return [{ moduleId: module.id, appId: app.id, label: app.label, subtitle: app.subtitle }];
      });

  const activeAppId = view.kind === 'app' ? findModule(view.target.moduleId)?.appId : undefined;

  const handleNavigate = (moduleId: string, label?: string, domainId?: string, subtitle?: string) => {
    if (!canOpen(session?.access, moduleId)) {
      setNotice('Accès refusé à ce module pour votre profil. Contactez l’administrateur MAINTeX si vous en avez besoin.');
      return;
    }
    setNotice('');
    setView({ kind: 'app', target: resolveTarget(moduleId, label, domainId, subtitle) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Messages des applications intégrées (retour accueil, renouvellement du jeton).
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const current = sessionRef.current;
      if (!current) return;
      const action = interpretMessage(event, current.apps.filter((app) => app.status === 'connected'));
      if (!action) return;
      if (action.kind === 'home') {
        handleHome();
        return;
      }
      const target = event.source as WindowProxy | null;
      if (!target || typeof target.postMessage !== 'function') return;
      requestToken(action.appId)
        .then((token) => target.postMessage({ type: 'MAINTeX_TOKEN', appId: action.appId, token }, action.origin))
        .catch((error: unknown) =>
          target.postMessage(
            { type: 'MAINTeX_TOKEN_ERROR', appId: action.appId, error: error instanceof ApiError ? error.code : 'ERROR' },
            action.origin,
          ),
        );
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleHome, requestToken]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 space-y-5 text-center">
          <h1 className="text-2xl font-bold">MAINTeX — Connexion sécurisée</h1>
          <p className="text-sm text-slate-300">Connectez-vous avec votre compte Google professionnel. Un seul login donne accès à toutes vos applications.</p>
          {authLoading ? (
            <p>Vérification de la session…</p>
          ) : clientId ? (
            <div className="flex justify-center" ref={googleLoginRef} />
          ) : (
            <p className="text-amber-300 text-sm">Le service d’authentification n’est pas encore configuré sur l’hébergement.</p>
          )}
          {authError && (
            <p role="alert" className="text-red-300 text-sm">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-900 flex flex-col justify-between">
      <div className="sticky top-0 z-50">
        <Header
          onHome={handleHome}
          userName={session.user.name}
          roleLabel={session.user.roleLabel}
          isAdmin={session.access.isAdmin}
          onAdmin={() => {
            setNotice('');
            setView({ kind: 'admin' });
          }}
          onLogout={logout}
          quickAccess={quickAccess}
          activeAppId={activeAppId}
          onQuickAccess={(entry) => handleNavigate(entry.moduleId, entry.label, undefined, entry.subtitle)}
        />
      </div>

      {notice && (
        <p role="alert" className="bg-rose-100 text-rose-800 px-6 py-2 text-sm font-semibold">
          {notice}
        </p>
      )}
      <div className="flex-1 flex flex-col justify-center">
        {(view.kind === 'home' || (view.kind === 'admin' && !session.access.isAdmin)) && (
          <MaintexHome onNavigate={handleNavigate} canOpen={(moduleId) => canOpen(session.access, moduleId)} embedded />
        )}
        {view.kind === 'app' && (
          <main className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <Workspace target={view.target} apps={session.apps} onHome={handleHome} requestToken={requestToken} />
          </main>
        )}
        {view.kind === 'admin' && session.access.isAdmin && (
          <main className="max-w-[1300px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 self-start">
            <AdminPanel currentEmail={session.user.email} onBack={handleHome} onChanged={() => void refreshSession()} />
          </main>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-[1500px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="font-extrabold text-[#0B3C8F]">MAINTeX — Maintenance Excellence Platform</div>
          <div>© 2026 Tuncay GURSOY — Tous droits réservés · Conçu et réalisé par Tuncay GURSOY</div>
        </div>
      </footer>
    </div>
  );
}
