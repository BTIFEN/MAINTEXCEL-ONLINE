import type { ShellNavigationTarget } from '../../types/shell';
import type { ShellApp } from '../../types/access';
import Breadcrumbs from './Breadcrumbs';
import ModulePlaceholder from './ModulePlaceholder';
import ExternalModuleFrame from './ExternalModuleFrame';
import { findModule } from '../../config/moduleRegistry';

interface WorkspaceProps {
  target: ShellNavigationTarget;
  apps: ShellApp[];
  onHome: () => void;
  requestToken: (appId: string) => Promise<string>;
}

export default function Workspace({ target, apps, onHome, requestToken }: WorkspaceProps) {
  const appId = findModule(target.moduleId)?.appId;
  const app = appId ? apps.find((candidate) => candidate.id === appId) : undefined;

  return (
    <div className="w-full">
      <div className="mb-4">
        <Breadcrumbs target={target} onHome={onHome} />
      </div>

      {app && app.status === 'connected' ? (
        <ExternalModuleFrame
          appId={app.id}
          moduleName={app.label}
          baseUrl={app.url}
          onRequestHome={onHome}
          requestToken={requestToken}
        />
      ) : (
        <ModulePlaceholder target={target} onBack={onHome} />
      )}
    </div>
  );
}
