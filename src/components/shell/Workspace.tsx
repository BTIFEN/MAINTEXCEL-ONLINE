import type { ReactNode } from 'react';
import type { ShellNavigationTarget } from '../../types/shell';
import Breadcrumbs from './Breadcrumbs';
import ModulePlaceholder from './ModulePlaceholder';
import ExternalModuleFrame from './ExternalModuleFrame';
import { findModule } from '../../config/moduleRegistry';

interface WorkspaceProps {
  target: ShellNavigationTarget;
  onHome: () => void;
  connectedModule?: ReactNode;
}

export default function Workspace({
  target,
  onHome,
  connectedModule,
}: WorkspaceProps) {
  const moduleDefinition = findModule(target.moduleId);

  return (
    <div className="w-full">
      <div className="mb-4">
        <Breadcrumbs target={target} onHome={onHome} />
      </div>

      {connectedModule ?? (
        moduleDefinition?.status === 'connected' ? (
          <ExternalModuleFrame
            moduleName={moduleDefinition.label}
            baseUrl={moduleDefinition.externalUrl}
            onRequestHome={onHome}
          />
        ) : (
          <ModulePlaceholder target={target} onBack={onHome} />
        )
      )}
    </div>
  );
}
