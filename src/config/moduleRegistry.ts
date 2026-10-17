import { DOMAINS_CONFIG } from './domainsConfig';
import type { ModuleDefinition } from '../types/shell';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const MODULE_REGISTRY: ModuleDefinition[] = DOMAINS_CONFIG.flatMap((domain) =>
  domain.submenus.map((submenu) => {
    const is5S = domain.id === 'excellence-terrain' && submenu.name === '5S';
    return {
      id: `${domain.id}.${slugify(submenu.name)}`,
      label: submenu.name,
      subtitle: submenu.subtitle,
      domainId: domain.id,
      domainName: domain.name,
      status: is5S ? ('connected' as const) : ('planned' as const),
      externalUrl: is5S ? import.meta.env.VITE_5S_APP_URL : undefined,
      route: `/app/${domain.id}/${slugify(submenu.name)}`,
    };
  })
);

export const QUICK_MODULES: ModuleDefinition[] = [
  {
    id: 'quick.alpab',
    label: 'ALPHAP',
    subtitle: 'Pilotage ARMP — Maintenance industrielle',
    status: 'connected',
    route: '/app/alphap',
    externalUrl: 'https://alphap-500610893724.europe-west1.run.app',
  },
  {
    id: 'quick.rca',
    label: 'RCA',
    subtitle: 'Root Cause Analysis',
    status: 'planned',
    route: '/app/rca',
  },
  {
    id: 'quick.5s',
    label: '5S',
    subtitle: '5S Digital Management',
    status: 'connected',
    route: '/app/5s',
    externalUrl: import.meta.env.VITE_5S_APP_URL,
  },
  {
    id: 'quick.ma',
    label: 'MA',
    subtitle: 'Maintenance Autonome',
    status: 'planned',
    route: '/app/maintenance-autonome',
  },
  {
    id: 'quick.asset-criticity',
    label: 'Asset Criticity',
    subtitle: 'Criticité des équipements',
    status: 'planned',
    route: '/app/asset-criticity',
  },
  {
    id: 'quick.fmea',
    label: 'FMEA/MTA',
    subtitle: 'Analyse des modes de défaillance',
    status: 'planned',
    route: '/app/fmea-mta',
  },
  {
    id: 'quick.rcm',
    label: 'RCM',
    subtitle: 'Reliability Centered Maintenance',
    status: 'planned',
    route: '/app/rcm',
  },
  {
    id: 'quick.cbm',
    label: 'CBM',
    subtitle: 'Condition Based Maintenance',
    status: 'planned',
    route: '/app/cbm',
  },
];

export const findModule = (moduleId: string) =>
  [...MODULE_REGISTRY, ...QUICK_MODULES].find((module) => module.id === moduleId);
