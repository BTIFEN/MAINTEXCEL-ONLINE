import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AppDef, EffectiveAccess, Rules, TriState } from '../../types/access';
import { getAppValue, getModuleValue, setAppValue, setModuleValue } from './matrix';

interface MatrixEditorProps {
  catalog: AppDef[];
  /** « role » : droits d'un rôle. « user » : exceptions d'une personne. */
  mode: 'role' | 'user';
  rules: Rules;
  onChange: (rules: Rules) => void;
  /** Mode « user » : droits effectifs calculés (rôle + exceptions), pour l'aperçu. */
  effective?: EffectiveAccess;
  /** Mode « user » : droits effectifs du rôle seul, pour afficher la valeur héritée. */
  inherited?: EffectiveAccess;
  disabled?: boolean;
}

interface Choice {
  value: TriState;
  label: string;
}

const tone: Record<TriState, string> = {
  allow: 'bg-emerald-600 text-white border-emerald-600',
  deny: 'bg-rose-600 text-white border-rose-600',
  inherit: 'bg-slate-700 text-white border-slate-700',
};

function Segmented({
  value,
  choices,
  onChange,
  disabled,
  label,
}: {
  value: TriState;
  choices: Choice[];
  onChange: (value: TriState) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shrink-0">
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors disabled:opacity-50 ${
              selected ? tone[choice.value] : 'border-transparent text-slate-500 hover:bg-slate-100'
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

function Result({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold w-24 shrink-0 ${allowed ? 'text-emerald-700' : 'text-rose-700'}`}
    >
      <span className={`w-2 h-2 rounded-full ${allowed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {allowed ? 'Autorisé' : 'Refusé'}
    </span>
  );
}

const inheritLabel = (allowed: boolean | undefined) =>
  allowed === undefined ? 'Hérité' : `Hérité (${allowed ? 'oui' : 'non'})`;

export default function MatrixEditor({ catalog, mode, rules, onChange, effective, inherited, disabled }: MatrixEditorProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const apps = catalog.filter((app) => app.status !== 'planned');
  const planned = catalog.filter((app) => app.status === 'planned');

  const appChoices = (appId: string): Choice[] =>
    mode === 'role'
      ? [
          { value: 'allow', label: 'Autorisé' },
          { value: 'deny', label: 'Refusé' },
        ]
      : [
          { value: 'inherit', label: inheritLabel(inherited?.apps[appId]?.allowed) },
          { value: 'allow', label: 'Autorisé' },
          { value: 'deny', label: 'Refusé' },
        ];

  const moduleChoices = (appId: string, moduleId: string): Choice[] => [
    {
      value: 'inherit',
      label: mode === 'role' ? 'Comme l’appli' : inheritLabel(inherited?.apps[appId]?.modules[moduleId]?.allowed),
    },
    { value: 'allow', label: 'Autorisé' },
    { value: 'deny', label: 'Refusé' },
  ];

  const appValue = (appId: string): TriState => {
    const value = getAppValue(rules, appId);
    return mode === 'role' && value === 'inherit' ? 'deny' : value;
  };

  const renderApp = (app: AppDef) => {
    const expanded = Boolean(open[app.id]);
    const moduleOverrides = Object.keys(rules[app.id]?.modules || {}).length;
    return (
      <div key={app.id} className="border-b border-slate-100 last:border-b-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => app.modules.length && setOpen((prev) => ({ ...prev, [app.id]: !expanded }))}
            className={`flex items-center gap-2 flex-1 min-w-[180px] text-left ${app.modules.length ? 'cursor-pointer' : 'cursor-default'}`}
            aria-expanded={app.modules.length ? expanded : undefined}
          >
            {app.modules.length ? (
              expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <span className="w-4" />
            )}
            <span>
              <span className="block text-sm font-bold text-slate-800">{app.label}</span>
              <span className="block text-[11px] text-slate-400">
                {app.modules.length ? `${app.modules.length} modules` : app.subtitle}
                {moduleOverrides ? ` · ${moduleOverrides} réglé(s)` : ''}
              </span>
            </span>
          </button>
          <Segmented
            label={`Accès à ${app.label}`}
            value={appValue(app.id)}
            choices={appChoices(app.id)}
            disabled={disabled}
            onChange={(value) => onChange(setAppValue(rules, app.id, value))}
          />
          {effective && <Result allowed={Boolean(effective.apps[app.id]?.allowed)} />}
        </div>

        {expanded && (
          <div className="bg-slate-50/70 border-t border-slate-100 py-1">
            {app.modules.map((mod) => (
              <div key={mod.id} className="flex flex-wrap items-center gap-3 pl-12 pr-4 py-1.5">
                <span className="flex-1 min-w-[160px] text-[13px] text-slate-600">{mod.label}</span>
                <Segmented
                  label={`${app.label} — ${mod.label}`}
                  value={getModuleValue(rules, app.id, mod.id)}
                  choices={moduleChoices(app.id, mod.id)}
                  disabled={disabled}
                  onChange={(value) => onChange(setModuleValue(rules, app.id, mod.id, value))}
                />
                {effective && <Result allowed={Boolean(effective.apps[app.id]?.modules[mod.id]?.allowed)} />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        <span className="flex-1">Application / module</span>
        <span>{mode === 'role' ? 'Droit du rôle' : 'Exception pour la personne'}</span>
        {effective && <span className="w-24">Résultat</span>}
      </div>
      {apps.map(renderApp)}
      {planned.length > 0 && (
        <>
          <div className="px-4 py-2 bg-slate-50 border-y border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Applications prévues (droits préparés à l’avance)
          </div>
          {planned.map(renderApp)}
        </>
      )}
    </div>
  );
}
