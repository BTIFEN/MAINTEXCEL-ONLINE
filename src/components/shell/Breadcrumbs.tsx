import { ChevronRight, Home } from 'lucide-react';
import type { ShellNavigationTarget } from '../../types/shell';

interface BreadcrumbsProps {
  target: ShellNavigationTarget | null;
  onHome: () => void;
}

export default function Breadcrumbs({ target, onHome }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <button
        onClick={onHome}
        className="inline-flex items-center gap-1.5 font-bold text-[#0B3C8F] hover:text-blue-600 transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5" />
        MAINTeX
      </button>

      {target?.domainName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold">{target.domainName}</span>
        </>
      )}

      {target && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-700">{target.label}</span>
        </>
      )}
    </div>
  );
}
