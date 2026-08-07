import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-2xl w-full" />
      ))}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = "Processing telemetry..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-mono text-emerald-400">{label}</p>
    </div>
  );
};
