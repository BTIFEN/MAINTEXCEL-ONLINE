import React from 'react';
import { LayoutGrid, Lock } from 'lucide-react';

interface QuickApplicationsBarProps {
  onNavigate?: (
    moduleId: string,
    label?: string,
    domainId?: string,
    subtitle?: string,
  ) => void;
  /** Indique si la personne connectée peut ouvrir l'entrée (droits MAINTeX). */
  canOpen?: (moduleId: string) => boolean;
}

export default function QuickApplicationsBar({ onNavigate, canOpen }: QuickApplicationsBarProps) {
  const apps = [
    {
      id: 'alpab',
      name: 'ALPHAP',
      subtitle: 'Gestion des travaux de maintenance',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-blue-700/10">
          A
        </div>
      )
    },
    {
      id: 'meeting-management',
      name: 'MEETING',
      subtitle: 'Réunions & Performance Industrielle',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md border border-indigo-700/10 relative">
          MM
          <span className="absolute top-1 right-1 text-[8px] font-bold">↗</span>
        </div>
      )
    },
    {
      id: 'rca',
      name: 'RCA',
      subtitle: 'Root Cause Analysis',
      icon: (
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-500 shadow-sm">
          <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
      )
    },
    {
      id: '5s',
      name: '5S',
      subtitle: '5S Digital Management',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-[#22C55E] flex items-center justify-center text-white font-extrabold text-sm relative shadow-md border border-green-600/10">
          5S
          <span className="absolute top-1 right-1 text-[8px] font-bold">↗</span>
        </div>
      )
    },
    {
      id: 'ma',
      name: 'MA',
      subtitle: 'Maintenance Autonome',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 shadow-xs">
          <svg className="w-6 h-6 text-[#F97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      )
    },
    {
      id: 'asset-criticity',
      name: 'Asset Criticity',
      subtitle: 'Criticité des équipements',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 shadow-xs">
          <svg className="w-5.5 h-5.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      )
    },
    {
      id: 'fmea',
      name: 'FMEA/MTA',
      subtitle: 'Analyse des modes de défaillance',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-xs relative">
          <svg className="w-5 h-5 text-[#0B3C8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white">
            x
          </div>
        </div>
      )
    },
    {
      id: 'rcm',
      name: 'RCM',
      subtitle: 'Reliability Centered Maintenance',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-[#0B3C8F] flex items-center justify-center text-white shadow-md border border-[#0B3C8F]/10">
          <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
      )
    },
    {
      id: 'cbm',
      name: 'CBM',
      subtitle: 'Condition Based Maintenance',
      icon: (
        <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center border-2 border-teal-500 shadow-xs">
          <svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
      )
    }
  ];

  const handleAppClick = (app: {
    id: string;
    name: string;
    subtitle?: string;
  }) => {
    onNavigate?.(
      `quick.${app.id}`,
      app.name,
      undefined,
      app.subtitle || `Application ${app.name}`,
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-md mt-6">
      
      {/* Title block */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
          Accès rapide aux applications
        </h3>
      </div>

      {/* Applications connected and planned */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
        {apps.map((app) => {
          const locked = canOpen ? !canOpen(`quick.${app.id}`) : false;
          return (
            <div
              key={app.name}
              role="button"
              tabIndex={0}
              aria-disabled={locked}
              title={locked ? 'Accès non accordé à votre profil' : undefined}
              onClick={() => handleAppClick(app)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleAppClick(app);
                }
              }}
              className={`flex flex-col items-center justify-center p-3 bg-white border rounded-2xl transition-all duration-150 group shadow-2xs relative ${
                locked
                  ? 'border-slate-100 opacity-50 grayscale cursor-not-allowed'
                  : 'border-slate-100 hover:bg-blue-50/20 hover:border-blue-300 cursor-pointer'
              }`}
            >
              <div className="shrink-0 transition-transform group-hover:scale-105 duration-200">
                {app.icon}
              </div>

              <span className="text-xs font-bold text-slate-800 mt-2.5 tracking-tight truncate w-full text-center group-hover:text-blue-600 transition-colors">
                {app.name}
              </span>

              {locked ? (
                <span className="inline-flex items-center gap-1 text-[8px] font-extrabold mt-1.5 uppercase font-mono tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" /> Restreint
                </span>
              ) : (
                <span className="text-[8px] font-extrabold mt-1.5 uppercase font-mono tracking-wider text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                  Ouvrir
                </span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
