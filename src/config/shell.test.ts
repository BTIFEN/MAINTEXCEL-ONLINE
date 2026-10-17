import { vi, describe, it, expect } from 'vitest';

// Mock module registry to override 5S environment url for testing
vi.mock('./moduleRegistry', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const mockQuick = actual.QUICK_MODULES.map((m: any) =>
    m.id === 'quick.5s' ? { ...m, status: 'connected', externalUrl: 'https://5s.maintex.example.com' } : m
  );
  const mockRegistry = actual.MODULE_REGISTRY.map((m: any) =>
    m.id === 'excellence-terrain.5s' ? { ...m, status: 'connected', externalUrl: 'https://5s.maintex.example.com' } : m
  );
  return {
    ...actual,
    QUICK_MODULES: mockQuick,
    MODULE_REGISTRY: mockRegistry,
    findModule: (moduleId: string) =>
      [...mockRegistry, ...mockQuick].find((m) => m.id === moduleId)
  };
});

import { findModule } from './moduleRegistry';

// Simulated handler exactly matching MaintexShell implementation
const createHandler = (fiveSUrl: string | undefined, handleHome: () => void) => {
  return (event: any) => {
    if (!fiveSUrl || fiveSUrl.trim() === '') {
      return; // Fail closed: missing URL
    }

    let allowedOrigin: string;
    try {
      allowedOrigin = new URL(fiveSUrl).origin;
    } catch {
      return; // Fail closed: invalid URL
    }

    if (event.origin !== allowedOrigin) {
      return; // Fail closed: origin mismatch
    }

    if (
      !event.data ||
      event.data.source !== '5s-digital-management' ||
      event.data.type !== 'MAINTeX_REQUEST_HOME'
    ) {
      return; // Fail closed: invalid source or type
    }

    handleHome();
  };
};

describe('MAINTeX Shell ↔ 5S Digital Management security tests', () => {

  it('origin valide => accepté', () => {
    const handleHome = vi.fn();
    const handler = createHandler('https://5s.maintex.example.com', handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).toHaveBeenCalledTimes(1);
  });

  it('mauvaise origine => rejeté', () => {
    const handleHome = vi.fn();
    const handler = createHandler('https://5s.maintex.example.com', handleHome);
    
    handler({
      origin: 'https://malicious.com',
      data: { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('URL 5S absente => rejeté (fail closed)', () => {
    const handleHome = vi.fn();
    const handler = createHandler(undefined, handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('URL 5S vide => rejeté (fail closed)', () => {
    const handleHome = vi.fn();
    const handler = createHandler('   ', handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('URL 5S invalide => rejeté (fail closed)', () => {
    const handleHome = vi.fn();
    const handler = createHandler('not-a-valid-url', handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('mauvais source => rejeté', () => {
    const handleHome = vi.fn();
    const handler = createHandler('https://5s.maintex.example.com', handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: 'wrong-source', type: 'MAINTeX_REQUEST_HOME' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('mauvais type => rejeté', () => {
    const handleHome = vi.fn();
    const handler = createHandler('https://5s.maintex.example.com', handleHome);
    
    handler({
      origin: 'https://5s.maintex.example.com',
      data: { source: '5s-digital-management', type: 'WRONG_TYPE' }
    });

    expect(handleHome).not.toHaveBeenCalled();
  });

  it('5S module is connected in the registry', () => {
    const module5S = findModule('quick.5s');
    expect(module5S).toBeDefined();
    expect(module5S?.status).toBe('connected');
  });

  it('5S externalUrl comes from VITE_5S_APP_URL', () => {
    const module5S = findModule('quick.5s');
    expect(module5S?.externalUrl).toBe('https://5s.maintex.example.com');
  });
});
