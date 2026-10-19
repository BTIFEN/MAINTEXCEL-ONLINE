import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, History, KeyRound, Plus, RefreshCw, Search, Shield, Trash2, Users } from 'lucide-react';
import { resolveAccess } from '../../../shared/access.js';
import type { AppDef, AuditEntry, EffectiveAccess, Role, Rules, UserRecord } from '../../types/access';
import { api, ApiError, encodeId } from '../../shell/api';
import MatrixEditor from './MatrixEditor';
import { countDefined } from './matrix';

type Tab = 'users' | 'roles' | 'audit';

interface AdminPanelProps {
  currentEmail: string;
  onBack: () => void;
  /** Appelé après une modification, pour recharger les droits de la personne connectée. */
  onChanged: () => void;
}

const effectiveOf = (catalog: AppDef[], role: Role | null, overrides: Rules | null): EffectiveAccess =>
  resolveAccess({ catalog, role, user: overrides ? { overrides } : null }) as EffectiveAccess;

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const errorText = (error: unknown) => (error instanceof ApiError || error instanceof Error ? error.message : 'Erreur inattendue.');

function Notice({ kind, children }: { kind: 'error' | 'success'; children: string }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        kind === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      }`}
    >
      {children}
    </p>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:bg-slate-100';
const primaryButton =
  'inline-flex items-center gap-2 rounded-lg bg-[#0B3C8F] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a3172] disabled:opacity-50';
const secondaryButton =
  'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const dangerButton =
  'inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50';

// ---------------------------------------------------------------------------
// Utilisateurs
// ---------------------------------------------------------------------------

const emptyUser = (): UserRecord => ({ email: '', name: '', roleId: null, active: true, overrides: {} });

function UserEditor({
  catalog,
  roles,
  initial,
  isNew,
  currentEmail,
  onSaved,
  onDeleted,
  onCancel,
}: {
  catalog: AppDef[];
  roles: Role[];
  initial: UserRecord;
  isNew: boolean;
  currentEmail: string;
  onSaved: (user: UserRecord) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<UserRecord>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(initial);
    setError('');
  }, [initial]);

  const role = roles.find((r) => r.id === draft.roleId) || null;
  const inherited = useMemo(() => effectiveOf(catalog, role, null), [catalog, role]);
  const effective = useMemo(() => effectiveOf(catalog, role, draft.overrides), [catalog, role, draft.overrides]);
  const self = draft.email.toLowerCase() === currentEmail.toLowerCase();

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const email = draft.email.trim().toLowerCase();
      const { user } = await api<{ user: UserRecord }>(`/api/admin/users/${encodeId(email)}`, {
        method: 'PUT',
        body: { ...draft, email, expectedVersion: isNew ? 'new' : initial.version ?? 0 },
      });
      onSaved(user);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement ${draft.name || draft.email} ? Pour suspendre l’accès sans supprimer, décochez plutôt « Compte actif ».`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/users/${encodeId(draft.email)}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Adresse e-mail Google</span>
          <input
            className={inputClass}
            type="email"
            value={draft.email}
            disabled={!isNew}
            placeholder="prenom.nom@aperam.com"
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Nom affiché</span>
          <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Rôle</span>
          <select
            className={inputClass}
            value={draft.roleId || ''}
            onChange={(e) => setDraft({ ...draft, roleId: e.target.value || null })}
          >
            <option value="">— Aucun rôle —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2.5 pt-6">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#0B3C8F]"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          />
          <span className="text-sm font-semibold text-slate-700">Compte actif</span>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-800">Droits de la personne</h3>
          <p className="text-xs text-slate-500">
            « Hérité » reprend le rôle. Un choix « Autorisé » ou « Refusé » ici l’emporte sur le rôle.
          </p>
        </div>
        <MatrixEditor
          catalog={catalog}
          mode="user"
          rules={draft.overrides}
          inherited={inherited}
          effective={effective}
          onChange={(overrides) => setDraft({ ...draft, overrides })}
        />
      </div>

      {self && (
        <Notice kind="success">
          C’est votre propre compte : le serveur refusera toute modification qui vous retirerait l’accès à l’administration.
        </Notice>
      )}
      {error && <Notice kind="error">{error}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primaryButton} disabled={busy || !draft.email.trim()} onClick={save}>
          {isNew ? 'Créer l’utilisateur' : 'Enregistrer'}
        </button>
        <button type="button" className={secondaryButton} disabled={busy} onClick={onCancel}>
          Annuler
        </button>
        {!isNew && !self && (
          <button type="button" className={`${dangerButton} ml-auto`} disabled={busy} onClick={remove}>
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function UsersTab({
  catalog,
  roles,
  users,
  currentEmail,
  reload,
}: {
  catalog: AppDef[];
  roles: Role[];
  users: UserRecord[];
  currentEmail: string;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ user: UserRecord; isNew: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const roleLabel = (id: string | null) => roles.find((r) => r.id === id)?.label || 'Sans rôle';

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || u.email.includes(q) || u.name.toLowerCase().includes(q) || roleLabel(u.roleId).toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <div className="space-y-4">
        <button type="button" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B3C8F]" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-4 h-4" /> Liste des utilisateurs
        </button>
        <h2 className="text-lg font-black text-slate-900">{selected.isNew ? 'Nouvel utilisateur' : selected.user.name}</h2>
        <UserEditor
          catalog={catalog}
          roles={roles}
          initial={selected.user}
          isNew={selected.isNew}
          currentEmail={currentEmail}
          onCancel={() => setSelected(null)}
          onSaved={async (user) => {
            setMessage(`${user.name} enregistré.`);
            setSelected(null);
            await reload();
          }}
          onDeleted={async () => {
            setMessage('Utilisateur supprimé.');
            setSelected(null);
            await reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Rechercher un nom, une adresse, un rôle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className={primaryButton} onClick={() => setSelected({ user: emptyUser(), isNew: true })}>
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>
      {message && <Notice kind="success">{message}</Notice>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Personne</th>
              <th className="px-4 py-2.5">Rôle</th>
              <th className="px-4 py-2.5">Exceptions</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">Dernière connexion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr
                key={user.email}
                className="cursor-pointer hover:bg-blue-50/40"
                onClick={() => {
                  setMessage('');
                  setSelected({ user, isNew: false });
                }}
              >
                <td className="px-4 py-2.5">
                  <div className="font-bold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{roleLabel(user.roleId)}</td>
                <td className="px-4 py-2.5 text-slate-700">{countDefined(user.overrides) || '—'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.active ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(user.lastLoginAt)}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  {users.length ? 'Aucun résultat.' : 'Aucun utilisateur enregistré. Commencez par « Nouvel utilisateur ».'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------

function RoleEditor({
  catalog,
  initial,
  isNew,
  onSaved,
  onDeleted,
  onCancel,
}: {
  catalog: AppDef[];
  initial: Role;
  isNew: boolean;
  onSaved: (role: Role) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Role>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(initial);
    setError('');
  }, [initial]);

  const slug = (label: string) =>
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const id = isNew ? draft.id || slug(draft.label) : initial.id;
      const { role } = await api<{ role: Role }>(`/api/admin/roles/${encodeId(id)}`, {
        method: 'PUT',
        body: {
          id,
          label: draft.label,
          description: draft.description,
          apps: draft.apps,
          expectedVersion: isNew ? 'new' : initial.version ?? 0,
        },
      });
      onSaved(role);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer le rôle « ${draft.label} » ?`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/roles/${encodeId(initial.id)}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Nom du rôle</span>
          <input
            className={inputClass}
            value={draft.label}
            placeholder="Ex. : Technicien de maintenance"
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Identifiant</span>
          <input
            className={inputClass}
            value={isNew ? draft.id || slug(draft.label) : draft.id}
            disabled={!isNew}
            onChange={(e) => setDraft({ ...draft, id: slug(e.target.value) })}
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold text-slate-600">Description</span>
          <input
            className={inputClass}
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-800">Droits du rôle</h3>
          <p className="text-xs text-slate-500">Une application refusée bloque tous ses modules. Dépliez une application pour restreindre ses modules.</p>
        </div>
        <MatrixEditor catalog={catalog} mode="role" rules={draft.apps} onChange={(apps) => setDraft({ ...draft, apps })} />
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primaryButton} disabled={busy || !draft.label.trim()} onClick={save}>
          {isNew ? 'Créer le rôle' : 'Enregistrer'}
        </button>
        <button type="button" className={secondaryButton} disabled={busy} onClick={onCancel}>
          Annuler
        </button>
        {!isNew && (
          <button
            type="button"
            className={`${dangerButton} ml-auto`}
            disabled={busy || Boolean(initial.userCount)}
            title={initial.userCount ? 'Rôle attribué : changez d’abord le rôle des personnes concernées.' : undefined}
            onClick={remove}
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function RolesTab({ catalog, roles, reload }: { catalog: AppDef[]; roles: Role[]; reload: () => Promise<void> }) {
  const [selected, setSelected] = useState<{ role: Role; isNew: boolean } | null>(null);
  const [message, setMessage] = useState('');

  if (selected) {
    return (
      <div className="space-y-4">
        <button type="button" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B3C8F]" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-4 h-4" /> Liste des rôles
        </button>
        <h2 className="text-lg font-black text-slate-900">{selected.isNew ? 'Nouveau rôle' : selected.role.label}</h2>
        <RoleEditor
          catalog={catalog}
          initial={selected.role}
          isNew={selected.isNew}
          onCancel={() => setSelected(null)}
          onSaved={async (role) => {
            setMessage(`Rôle « ${role.label} » enregistré.`);
            setSelected(null);
            await reload();
          }}
          onDeleted={async () => {
            setMessage('Rôle supprimé.');
            setSelected(null);
            await reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className={primaryButton}
          onClick={() => setSelected({ role: { id: '', label: '', description: '', apps: {} }, isNew: true })}
        >
          <Plus className="w-4 h-4" /> Nouveau rôle
        </button>
      </div>
      {message && <Notice kind="success">{message}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const granted = catalog.filter((app) => role.apps[app.id]?.access === 'allow');
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                setMessage('');
                setSelected({ role, isNew: false });
              }}
              className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800">{role.label}</span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">
                  {role.userCount || 0} pers.
                </span>
              </div>
              {role.description && <p className="mt-1 text-xs text-slate-500">{role.description}</p>}
              <p className="mt-3 text-xs text-slate-600">
                {granted.length ? granted.map((app) => app.label).join(' · ') : 'Aucune application'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Utilisateur créé',
  'user.update': 'Utilisateur modifié',
  'user.delete': 'Utilisateur supprimé',
  'role.create': 'Rôle créé',
  'role.update': 'Rôle modifié',
  'role.delete': 'Rôle supprimé',
  seed: 'Initialisation',
};

function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api<{ entries: AuditEntry[] }>('/api/admin/audit?limit=300');
      setEntries(data.entries);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Chaque modification des droits est tracée : qui, quand, quoi.</p>
        <button type="button" className={secondaryButton} onClick={() => void load()}>
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Auteur</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(entries || []).map((entry, index) => (
              <tr key={entry.id || index}>
                <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(entry.at)}</td>
                <td className="px-4 py-2 text-slate-700">{entry.actor}</td>
                <td className="px-4 py-2 font-semibold text-slate-800">{ACTION_LABELS[entry.action] || entry.action}</td>
                <td className="px-4 py-2 text-slate-600">{entry.target.replace(/^(user|role):/, '')}</td>
              </tr>
            ))}
            {entries && !entries.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Aucune modification enregistrée.
                </td>
              </tr>
            )}
            {!entries && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Chargement…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau
// ---------------------------------------------------------------------------

export default function AdminPanel({ currentEmail, onBack, onChanged }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('users');
  const [catalog, setCatalog] = useState<AppDef[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [catalogData, rolesData, usersData] = await Promise.all([
        api<{ apps: AppDef[] }>('/api/admin/catalog'),
        api<{ roles: Role[] }>('/api/admin/roles'),
        api<{ users: UserRecord[] }>('/api/admin/users'),
      ]);
      setCatalog(catalogData.apps);
      setRoles(rolesData.roles);
      setUsers(usersData.users);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    await load();
    onChanged();
  }, [load, onChanged]);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: `Utilisateurs (${users.length})`, icon: Users },
    { id: 'roles', label: `Rôles (${roles.length})`, icon: KeyRound },
    { id: 'audit', label: 'Journal', icon: History },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0B3C8F] text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0B3C8F] tracking-tight">Administration MAINTeX</h1>
            <p className="text-sm text-slate-500">Utilisateurs, rôles et accès aux applications et à leurs modules.</p>
          </div>
        </div>
        <button type="button" className={secondaryButton} onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Accueil
        </button>
      </div>

      <div role="tablist" aria-label="Administration" className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-[#0B3C8F] text-[#0B3C8F]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          {tab === 'users' && <UsersTab catalog={catalog} roles={roles} users={users} currentEmail={currentEmail} reload={reload} />}
          {tab === 'roles' && <RolesTab catalog={catalog} roles={roles} reload={reload} />}
          {tab === 'audit' && <AuditTab />}
        </>
      )}
    </section>
  );
}
