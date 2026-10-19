import { describe, it, expect } from 'vitest';
import { findModule, QUICK_MODULES, MODULE_REGISTRY } from './moduleRegistry';
import { interpretMessage } from '../shell/messageBridge';
import { APP_CATALOG, canOpenNavigation, resolveAccess } from '../../shared/access.js';
import type { EffectiveAccess } from '../types/access';

const apps = [{ id: '5s', url: 'https://5s.maintex.example.com' }];
const home = { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' };

describe('MAINTeX Shell ↔ applications : relais de messages', () => {
  it('origine valide => accepté', () => {
    expect(interpretMessage({ origin: 'https://5s.maintex.example.com', data: home }, apps)).toEqual({ kind: 'home', appId: '5s' });
  });

  it('mauvaise origine => rejeté', () => {
    expect(interpretMessage({ origin: 'https://malicious.com', data: home }, apps)).toBeNull();
  });

  it('adresse 5S absente, vide ou invalide => rejeté (fail closed)', () => {
    for (const url of [null, '   ', 'not-a-valid-url']) {
      expect(interpretMessage({ origin: 'https://5s.maintex.example.com', data: home }, [{ id: '5s', url }])).toBeNull();
    }
  });

  it('mauvaise source ou mauvais type => rejeté', () => {
    const origin = 'https://5s.maintex.example.com';
    expect(interpretMessage({ origin, data: { ...home, source: 'wrong-source' } }, apps)).toBeNull();
    expect(interpretMessage({ origin, data: { ...home, type: 'WRONG_TYPE' } }, apps)).toBeNull();
  });
});

describe('Registre des modules', () => {
  it('les entrées 5S pointent vers l’application 5S', () => {
    expect(findModule('quick.5s')?.appId).toBe('5s');
    expect(findModule('excellence-terrain.5s')?.appId).toBe('5s');
  });

  it('chaque application de l’accès rapide existe dans le catalogue', () => {
    for (const mod of QUICK_MODULES) {
      expect(APP_CATALOG.some((app) => app.id === mod.appId)).toBe(true);
    }
  });

  it('les écrans d’attente restent ouverts, les applications branchées sont contrôlées', () => {
    const access = resolveAccess({ role: { id: 'r', label: 'R', apps: { '5s': { access: 'allow' } } } }) as EffectiveAccess;
    const placeholder = MODULE_REGISTRY.find((mod) => !mod.appId);
    expect(placeholder).toBeDefined();
    expect(canOpenNavigation(access, placeholder!.id)).toBe(true);
    expect(canOpenNavigation(access, 'quick.5s')).toBe(true);
    expect(canOpenNavigation(access, 'quick.alpab')).toBe(false);
  });
});
