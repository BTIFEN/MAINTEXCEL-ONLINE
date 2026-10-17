export type ModuleStatus = 'connected' | 'planned' | 'disabled';

export interface ShellNavigationTarget {
  moduleId: string;
  label: string;
  domainId?: string;
  domainName?: string;
  subtitle?: string;
}

export interface ModuleDefinition {
  id: string;
  label: string;
  domainId?: string;
  domainName?: string;
  subtitle?: string;
  status: ModuleStatus;
  externalUrl?: string;
  route?: string;
}
