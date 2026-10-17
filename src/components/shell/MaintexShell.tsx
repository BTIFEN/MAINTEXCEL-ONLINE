import { useState, useEffect } from 'react';
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

  const handleHome = () => setActiveTarget(null);

  const handleNavigate = (
    moduleId: string,
    label?: string,
    domainId?: string,
    subtitle?: string,
  ) => {
    setActiveTarget(resolveTarget(moduleId, label, domainId, subtitle));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const fiveSUrl = import.meta.env.VITE_5S_APP_URL || '/5s/';
      if (!fiveSUrl || fiveSUrl.trim() === '') {
        return; // Fail closed: missing URL
      }

      let allowedOrigin: string;
      try {
        allowedOrigin = new URL(fiveSUrl, window.location.origin).origin;
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

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-900 flex flex-col justify-between">
      <div className="sticky top-0 z-50">
        <Header />
      </div>

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
