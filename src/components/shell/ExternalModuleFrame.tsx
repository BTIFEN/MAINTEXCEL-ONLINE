import React, { useMemo, useState } from 'react';
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';

interface ExternalModuleFrameProps {
  moduleName: string;
  baseUrl?: string;
  onRequestHome: () => void;
}

export default function ExternalModuleFrame({
  moduleName,
  baseUrl,
  onRequestHome,
}: ExternalModuleFrameProps) {
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    if (!baseUrl || baseUrl.trim() === '') return null;

    try {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set('maintexMode', 'embedded');
      return url.toString();
    } catch {
      return null;
    }
  }, [baseUrl]);

  if (!src) {
    return (
      <div className="min-h-[560px] rounded-3xl border border-rose-200 bg-white p-10 flex flex-col justify-between shadow-sm">
        <div className="space-y-6 max-w-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Configuration du module {moduleName} manquante
            </h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              L’URL du module {moduleName} n’est pas configurée dans l'environnement. 
              Veuillez définir la variable d'environnement <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-rose-600">VITE_5S_APP_URL</code> pour 5S, ou fournir l’URL du module dans le registre.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={onRequestHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B3C8F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l’accueil MAINTeX
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-170px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0B3C8F]" />
      
      <div className="relative z-20 px-5 pt-5 flex justify-end">
        <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#0B3C8F] hover:bg-blue-50">
          Ouvrir {moduleName} dans un nouvel onglet <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#0B3C8F] animate-spin" />
          <div className="text-sm font-bold text-[#0B3C8F] tracking-wide animate-pulse">
            Chargement de {moduleName}…
          </div>
        </div>
      )}

      <iframe
        title={moduleName}
        src={src}
        onLoad={() => setLoaded(true)}
        className="flex-1 w-full border-0 bg-white min-h-[560px]"
        sandbox="allow-scripts allow-forms allow-same-origin allow-downloads allow-popups"
      />
    </div>
  );
}
