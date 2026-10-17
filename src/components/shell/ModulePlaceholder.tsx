import { ArrowLeft, Boxes, PlugZap } from 'lucide-react';
import type { ShellNavigationTarget } from '../../types/shell';

interface ModulePlaceholderProps {
  target: ShellNavigationTarget;
  onBack: () => void;
}

export default function ModulePlaceholder({ target, onBack }: ModulePlaceholderProps) {
  return (
    <section className="min-h-[560px] bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#0B3C8F] via-[#1C64F2] to-cyan-500" />

      <div className="p-8 md:p-12">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B3C8F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l’accueil MAINTeX
        </button>

        <div className="mt-14 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto shadow-inner">
            <Boxes className="w-10 h-10 text-[#1C64F2]" />
          </div>

          <p className="mt-6 text-xs font-black tracking-[0.22em] uppercase text-blue-600">
            MAINTeX Workspace
          </p>

          <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {target.label}
          </h1>

          {target.domainName && (
            <p className="mt-2 text-sm font-bold text-[#0B3C8F]">
              {target.domainName}
            </p>
          )}

          <p className="mt-5 text-sm md:text-base text-slate-500 leading-relaxed">
            {target.subtitle || 'Ce module fait partie de l’écosystème MAINTeX.'}
          </p>

          <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
            <PlugZap className="w-4 h-4" />
            Module à connecter
          </div>

          <p className="mt-4 text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Aucun module de démonstration n’est chargé. La véritable application sera intégrée ici via le contrat d’intégration MAINTeX.
          </p>
        </div>
      </div>
    </section>
  );
}
