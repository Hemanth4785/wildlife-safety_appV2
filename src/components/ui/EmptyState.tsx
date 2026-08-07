import React from 'react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = <Compass size={36} className="text-slate-500" />
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
