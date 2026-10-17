import React from 'react';
import { DomainConfig, COLOR_PALETTES, getIconByString } from '../config/domainsConfig';
import { ChevronRight, Shield, Compass } from 'lucide-react';

interface ExpandedDomainPanelProps {
  domain: DomainConfig | null;
  onClose: () => void;
  onNavigate?: (
    moduleId: string,
    label?: string,
    domainId?: string,
    subtitle?: string,
  ) => void;
}

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function ExpandedDomainPanel({ domain, onClose, onNavigate }: ExpandedDomainPanelProps) {
  if (!domain) {
    return (
      <div className="h-full bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner mb-4">
          <Compass className="w-8 h-8 text-blue-500/40 animate-[spin_20s_linear_infinite]" />
        </div>
        <h3 className="text-base font-bold text-slate-800 tracking-tight">Explorez l'écosystème unifié</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
          Sélectionnez un domaine fonctionnel sur la roue radiale pour ouvrir ses sous-menus d'intégration.
        </p>
      </div>
    );
  }

  const palette = COLOR_PALETTES[domain.colorName] || COLOR_PALETTES.blue;
  const IconComponent = getIconByString(domain.iconName);

  const handleSubmenuClick = (
    domainItem: DomainConfig,
    subName: string,
    subtitle: string,
  ) => {
    if (!onNavigate) return;

    const moduleId = `${domainItem.id}.${slugify(subName)}`;
    onNavigate(moduleId, subName, domainItem.id, subtitle);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full animate-in slide-in-from-right-4 duration-300 relative overflow-hidden">
      
      {/* Decorative top colored strip mirroring the domain's aesthetic */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: domain.hexColor }} />

      <div className="space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-4.5 pb-4 border-b border-slate-100">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: domain.hexColor }}
          >
            <IconComponent className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none">
              {domain.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-1.5">
              {domain.subtitle}
            </p>
          </div>
        </div>

        {/* Dynamic list of custom submenu cards */}
        <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 scrollbar-thin">
          {domain.submenus.map((sub, idx) => {
            const SubIcon = getIconByString(sub.iconName);
            return (
              <div 
                key={idx}
                onClick={() => handleSubmenuClick(domain, sub.name, sub.subtitle)}
                className="group flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-blue-50/20 hover:border-blue-300 cursor-pointer transition-all duration-150 shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${sub.colorClass.split(' ')[1]} ${sub.colorClass.split(' ')[2]}`}>
                    <SubIcon className={`w-4 h-4 ${sub.colorClass.split(' ')[0]}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-none truncate group-hover:text-blue-600 transition-colors">
                      {sub.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium leading-none mt-1.5 truncate">
                      {sub.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Ouvrir
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Extensibility footer placeholder */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          Rôle : Tout utilisateur
        </span>
        <span className="font-mono uppercase tracking-wide">ID : {domain.id}</span>
      </div>

    </div>
  );
}
