import { useState, useEffect, useRef } from 'react';
import Header from '../Header';
import MaintexHome from '../MaintexHome';
import Workspace from './Workspace';
import type { ShellNavigationTarget } from '../../types/shell';
import { DOMAINS_CONFIG } from '../../config/domainsConfig';

const resolveTarget = (
  moduleId: string,
  label?: string,
  domainId?: string,
  subtitle?: string,
): ShellNavigationTarget => {
  const domain = DOMAINS_CONFIG.find((item) => item.id === domainId);

  return {
    moduleId,
    label: label || moduleId,
    domainId,
    domainName: domain?.name,
    subtitle,
  };
};

export default function MaintexShell() {
  const [activeTarget, setActiveTarget] = useState<ShellNavigationTarget | null>(null);
  const [identity, setIdentity] = useState<{email:string; name:string; role:string; modules: {id:string; permissions:string[]}[]} | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState('');
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null).then(data => { if (data?.user) setIdentity(data.user); })
      .catch(() => {}).finally(() => setAuthLoading(false));
    fetch('/api/auth/config').then(r => r.json()).then(data => { if (data.enabled) setClientId(data.clientId); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!clientId || identity || authLoading || !googleLoginRef.current) return;
    let active = true;
    let script: HTMLScriptElement | undefined;
    const initialize = () => {
      const google = (window as any).google;
      if (!active || !google?.accounts?.id || !googleLoginRef.current) return;
      google.accounts.id.initialize({ client_id: clientId, callback: async (response: {credential:string}) => {
        try {
          setAuthError('');
          const r = await fetch('/api/auth/google', { method: 'POST', credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'}, body: JSON.stringify({credential: response.credential}) });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Accès non autorisé');
          setIdentity(data.user);
        } catch(e:any) { setAuthError(e.message || 'Connexion refusée'); }
      }});
      google.accounts.id.renderButton(googleLoginRef.current, { theme:'outline', size:'large', text:'signin_with', width: 280 });
    };
    if ((window as any).google?.accounts?.id) initialize();
    else { script = document.createElement('script'); script.src='https://accounts.google.com/gsi/client'; script.async=true; script.onload=initialize; document.head.appendChild(script); }
    return () => { active=false; if(script?.parentNode)script.parentNode.removeChild(script); };
  }, [clientId, identity, authLoading]);
  const canOpen = (moduleId: string) => Boolean(identity?.modules.some(m => m.id === moduleId && m.permissions.includes('open')));
  const logout = async () => { await fetch('/api/auth/logout', { method:'POST' }); setIdentity(null); setActiveTarget(null); };


  const handleHome = () => setActiveTarget(null);

  const handleNavigate = (
    moduleId: string,
    label?: string,
    domainId?: string,
    subtitle?: string,
  ) => {
    if (!canOpen(moduleId)) { setAuthError('Accès refusé à ce module pour votre profil.'); return; }
    setAuthError('');
    setActiveTarget(resolveTarget(moduleId, label, domainId, subtitle));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const fiveSUrl = import.meta.env.VITE_5S_APP_URL;
      if (!fiveSUrl || fiveSUrl.trim() === '') {
        return; // Fail closed: missing URL
      }

      let allowedOrigin: string;
      try {
        allowedOrigin = new URL(fiveSUrl).origin;
      } catch {
        return; // Fail closed: invalid URL
      }

      if (event.origin !== allowedOrigin) {
        return; // Fail closed: origin mismatch
      }

      if (
        !event.data ||
        event.data.source !== '5s-digital-management' ||
        event.data.type !== 'MAINTeX_REQUEST_HOME'
      ) {
        return; // Fail closed: invalid source or type
      }

      handleHome();
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);

  if (!identity) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 text-slate-100">
    <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 space-y-5 text-center">
      <h1 className="text-2xl font-bold">MAINTeX — Connexion sécurisée</h1>
      <p className="text-sm text-slate-300">Connectez-vous avec un compte Google expressément autorisé par l'administrateur.</p>
      {authLoading ? <p>Vérification de la session…</p> : clientId ? <div className="flex justify-center" ref={googleLoginRef}/> :
        <p className="text-amber-300 text-sm">Le service d'authentification n'est pas encore configuré sur l'hébergement.</p>}
      {authError && <p role="alert" className="text-red-300 text-sm">{authError}</p>}
    </div>
  </div>;
  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-900 flex flex-col justify-between">
      <div className="sticky top-0 z-50">
        <Header />
        <div className="bg-white border-b px-4 py-2 text-right text-xs text-slate-600">{identity.name} · {identity.role} <button onClick={logout} className="ml-3 underline">Déconnexion</button></div>
      </div>

      {authError && <p role="alert" className="bg-rose-100 text-rose-800 px-6 py-2">{authError}</p>}
      <div className="flex-1 flex flex-col justify-center">
        {activeTarget === null ? (
          <MaintexHome onNavigate={handleNavigate} embedded />
        ) : (
          <main className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <Workspace
              target={activeTarget}
              onHome={handleHome}
            />
          </main>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-[1500px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="font-extrabold text-[#0B3C8F]">
            MAINTeX — Maintenance Excellence Platform
          </div>
          <div>
            © 2026 Tuncay GURSOY — Tous droits réservés · Conçu et réalisé par Tuncay GURSOY
          </div>
        </div>
      </footer>
    </div>
  );
}
