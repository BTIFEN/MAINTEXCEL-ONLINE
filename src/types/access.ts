// Types du modèle d'accès (miroir de shared/access.js).

export type Decision = 'allow' | 'deny';
export type TriState = Decision | 'inherit';
export type DecisionSource = 'role' | 'user' | 'default' | 'app' | 'bootstrap';

export interface ModuleDef {
  id: string;
  label: string;
}

export interface AppDef {
  id: string;
  label: string;
  subtitle: string;
  status: 'connected' | 'planned' | 'internal';
  modules: ModuleDef[];
}

export interface AppRule {
  access?: Decision;
  modules?: Record<string, Decision>;
}

export type Rules = Record<string, AppRule>;

export interface Role {
  id: string;
  label: string;
  description?: string;
  apps: Rules;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  userCount?: number;
}

export interface UserRecord {
  email: string;
  name: string;
  roleId: string | null;
  active: boolean;
  overrides: Rules;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  lastLoginAt?: string;
}

export interface ResolvedDecision {
  allowed: boolean;
  source: DecisionSource;
}

export interface ResolvedApp extends ResolvedDecision {
  modules: Record<string, ResolvedDecision>;
}

export interface EffectiveAccess {
  isAdmin: boolean;
  apps: Record<string, ResolvedApp>;
}

export interface ShellApp {
  id: string;
  label: string;
  subtitle: string;
  status: 'connected' | 'planned';
  url: string | null;
  allowed: boolean;
}

export interface ShellUser {
  email: string;
  name: string;
  roleId: string | null;
  roleLabel: string;
  bootstrapAdmin: boolean;
}

export interface ShellSession {
  user: ShellUser;
  access: EffectiveAccess;
  apps: ShellApp[];
}

export interface AuditEntry {
  id?: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  before?: unknown;
  after?: unknown;
}
