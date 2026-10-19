import { DOMAINS_CONFIG } from './domainsConfig';
import { NAVIGATION_TO_APP } from '../../shared/access.js';
import type { ModuleDefinition } from '../types/shell';

// Les adresses des applications et leur état (branchée ou prévue) ne sont plus
// figés à la compilation : le serveur les fournit à la connexion (/api/auth/me),
// ce qui permet de déplacer une application sans reconstruire MAINTeX.

const navigationToApp = NAVIGATION_TO_APP as Record<string, string>;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const MODULE_REGISTRY: ModuleDefinition[] = DOMAINS_CONFIG.flatMap((domain) =>
  domain.submenus.map((submenu) => {
    const id = `${domain.id}.${slugify(submenu.name)}`;
    return {
      id,
      label: submenu.name,
      subtitle: submenu.subtitle,
      domainId: domain.id,
      domainName: domain.name,
      appId: navigationToApp[id],
      route: `/app/${domain.id}/${slugify(submenu.name)}`,
    };
  }),
);

const quick = (id: string, label: string, subtitle: string, route: string): ModuleDefinition => ({
  id,
  label,
  subtitle,
  appId: navigationToApp[id],
  route,
});

export const QUICK_MODULES: ModuleDefinition[] = [
  quick('quick.alpab', 'ALPHAP', 'Gestion des travaux de maintenance', '/app/alphap'),
  quick('quick.meeting-management', 'MEETING MANAGEMENT', 'Réunions & Performance Industrielle', '/app/meeting-management'),
  quick('quick.rca', 'RCA', 'Root Cause Analysis', '/app/rca'),
  quick('quick.5s', '5S', '5S Digital Management', '/app/5s'),
  quick('quick.ma', 'MA', 'Maintenance Autonome', '/app/maintenance-autonome'),
  quick('quick.asset-criticity', 'Asset Criticity', 'Criticité des équipements', '/app/asset-criticity'),
  quick('quick.fmea', 'FMEA/MTA', 'Analyse des modes de défaillance', '/app/fmea-mta'),
  quick('quick.rcm', 'RCM', 'Reliability Centered Maintenance', '/app/rcm'),
  quick('quick.cbm', 'CBM', 'Condition Based Maintenance', '/app/cbm'),
];

export const findModule = (moduleId: string) =>
  [...MODULE_REGISTRY, ...QUICK_MODULES].find((module) => module.id === moduleId);
