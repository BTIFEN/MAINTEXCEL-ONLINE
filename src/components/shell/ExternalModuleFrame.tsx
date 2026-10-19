import { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { buildEmbeddedUrl } from '../../shell/messageBridge';
import { ApiError } from '../../shell/api';
import { useI18n } from '../../i18n/LanguageContext';

interface ExternalModuleFrameProps {
  appId: string;
  moduleName: string;
  baseUrl: string | null;
  onRequestHome: () => void;
  /** Demande au serveur MAINTeX un jeton d'accès pour cette application. */
  requestToken: (appId: string) => Promise<string>;
}

type FrameState =
  | { phase: 'loading' }
  | { phase: 'ready'; src: string; singleSignOn: boolean }
  | { phase: 'error'; title: string; message: string };

export default function ExternalModuleFrame({ appId, moduleName, baseUrl, onRequestHome, requestToken }: ExternalModuleFrameProps) {
  const [state, setState] = useState<FrameState>({ phase: 'loading' });
  const [loaded, setLoaded] = useState(false);
  const { language, t } = useI18n();

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setState({ phase: 'loading' });

    if (!baseUrl) {
      setState({
        phase: 'error',
        title: t('workspace.addressMissing', { app: moduleName }),
        message: t('workspace.addressMissingHelp'),
      });
      return;
    }

    requestToken(appId)
      .then((token) => ({ token, singleSignOn: true }))
      .catch((error: unknown) => {
        // Accès refusé : on n'ouvre pas l'application.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw error;
        // Jetons pas encore configurés : l'application s'ouvre avec son propre login (transition).
        return { token: null, singleSignOn: false };
      })
      .then(({ token, singleSignOn }) => {
        if (!active) return;
        const src = buildEmbeddedUrl(baseUrl, token, language);
        if (!src) {
          setState({ phase: 'error', title: t('workspace.addressInvalid', { app: moduleName }), message: baseUrl });
          return;
        }
        setState({ phase: 'ready', src, singleSignOn });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          phase: 'error',
          title: t('workspace.accessDenied', { app: moduleName }),
          message: error instanceof Error ? error.message : t('workspace.accessDeniedHelp'),
        });
      });

    return () => {
      active = false;
    };
    // « language » en dépendance : changer de langue recharge l'application
    // dans la nouvelle langue, sans que la personne ait à revenir à l'accueil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, baseUrl, moduleName, requestToken, language]);

  if (state.phase === 'error') {
    return (
      <div className="min-h-[560px] rounded-3xl border border-rose-200 bg-white p-10 flex flex-col justify-between shadow-sm">
        <div className="space-y-6 max-w-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{state.title}</h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">{state.message}</p>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={onRequestHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B3C8F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('workspace.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-170px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0B3C8F]" />

      <div className="relative z-20 px-5 pt-5 flex flex-wrap items-center justify-end gap-3">
        {state.phase === 'ready' && !state.singleSignOn && (
          <span className="mr-auto inline-flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <Info className="w-3.5 h-3.5" />
            {t('workspace.ownLogin')}
          </span>
        )}
        {baseUrl && (
          <a
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#0B3C8F] hover:bg-blue-50"
          >
            {t('workspace.openInNewTab', { app: moduleName })} <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {(state.phase === 'loading' || !loaded) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#0B3C8F] animate-spin" />
          <div className="text-sm font-bold text-[#0B3C8F] tracking-wide animate-pulse">{t('workspace.loading', { app: moduleName })}</div>
        </div>
      )}

      {state.phase === 'ready' && (
        <iframe
          key={state.src}
          title={moduleName}
          src={state.src}
          onLoad={() => setLoaded(true)}
          referrerPolicy="no-referrer"
          className="flex-1 w-full border-0 bg-white min-h-[560px]"
          sandbox="allow-scripts allow-forms allow-same-origin allow-downloads allow-popups"
        />
      )}
    </div>
  );
}
