// Manipulation des matrices de droits dans l'éditeur (fonctions pures, testées).
import type { AppRule, Decision, Rules, TriState } from '../../types/access';

function cleanRule(rule: AppRule): AppRule | null {
  const result: AppRule = {};
  if (rule.access) result.access = rule.access;
  if (rule.modules && Object.keys(rule.modules).length) result.modules = { ...rule.modules };
  return result.access || result.modules ? result : null;
}

function withRule(rules: Rules, appId: string, rule: AppRule): Rules {
  const next: Rules = { ...rules };
  const cleaned = cleanRule(rule);
  if (cleaned) next[appId] = cleaned;
  else delete next[appId];
  return next;
}

export function getAppValue(rules: Rules, appId: string): TriState {
  return rules[appId]?.access || 'inherit';
}

export function getModuleValue(rules: Rules, appId: string, moduleId: string): TriState {
  return rules[appId]?.modules?.[moduleId] || 'inherit';
}

export function setAppValue(rules: Rules, appId: string, value: TriState): Rules {
  const current = rules[appId] || {};
  const rule: AppRule = { ...current };
  if (value === 'inherit') delete rule.access;
  else rule.access = value;
  return withRule(rules, appId, rule);
}

export function setModuleValue(rules: Rules, appId: string, moduleId: string, value: TriState): Rules {
  const current = rules[appId] || {};
  const modules: Record<string, Decision> = { ...(current.modules || {}) };
  if (value === 'inherit') delete modules[moduleId];
  else modules[moduleId] = value;
  return withRule(rules, appId, { ...current, modules });
}

/** Nombre de cases définies (exceptions individuelles ou restrictions d'un rôle). */
export function countDefined(rules: Rules): number {
  let count = 0;
  for (const rule of Object.values(rules)) {
    if (rule.access) count += 1;
    count += Object.keys(rule.modules || {}).length;
  }
  return count;
}
