import React, { useState } from 'react';
import RadialNavigation from './RadialNavigation';
import ExpandedDomainPanel from './ExpandedDomainPanel';
import QuickApplicationsBar from './QuickApplicationsBar';
import { DOMAINS_CONFIG } from '../config/domainsConfig';

interface MaintexHomeProps {
  onNavigate?: (
    moduleId: string,
    label?: string,
    domainId?: string,
    subtitle?: string,
  ) => void;
  embedded?: boolean;
}

export default function MaintexHome({ onNavigate }: MaintexHomeProps) {
  const [activeDomainId, setActiveDomainId] = useState<string | null>('work-mgmt');

  const handleToggleDomain = (id: string) => {
    setActiveDomainId((prev) => (prev === id ? null : id));
  };

  const activeDomain =
    DOMAINS_CONFIG.find((d) => d.id === activeDomainId) || null;

  return (
    <div className="relative overflow-hidden">
      <main className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(420px,1fr)_420px] items-center gap-8 min-h-[590px]">
          <section className="space-y-4 text-left">
            <p className="text-xs font-black tracking-[0.22em] uppercase text-blue-600">
              Maintenance Excellence Platform
            </p>

            <h1 className="text-4xl xl:text-5xl font-black text-[#0B3C8F] tracking-tight leading-[0.95]">
              Bienvenue
              <br />
              sur MAINTeX
            </h1>

            <div className="w-12 h-1 bg-[#1C64F2] rounded-full" />

            <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-[250px]">
              Une vision unifiée pour une maintenance performante, fiable et durable.
            </p>
          </section>

          <section className="flex items-center justify-center min-w-0">
            <RadialNavigation
              activeDomainId={activeDomainId}
              onToggleDomain={handleToggleDomain}
            />
          </section>

          <section className="h-[560px]">
            <ExpandedDomainPanel
              domain={activeDomain}
              onClose={() => setActiveDomainId(null)}
              onNavigate={onNavigate}
            />
          </section>
        </div>

        <QuickApplicationsBar onNavigate={onNavigate} />
      </main>
    </div>
  );
}
