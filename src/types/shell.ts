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
  /** Application MAINTeX correspondante (voir shared/access.js). Absent : écran d'attente. */
  appId?: string;
  route?: string;
}
