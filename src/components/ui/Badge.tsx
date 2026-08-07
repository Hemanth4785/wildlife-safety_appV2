import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  icon,
  className = '',
}) => {
  let sizeStyle = "px-2.5 py-0.5 text-[11px]";
  if (size === 'md') sizeStyle = "px-3 py-1 text-xs";

  let variantStyle = "bg-[#e6f7f0] text-[#059669] border-[#a7f3d0]";
  if (variant === 'amber') variantStyle = "bg-amber-50 text-amber-700 border-amber-200";
  if (variant === 'red') variantStyle = "bg-red-50 text-red-700 border-red-200";
  if (variant === 'blue') variantStyle = "bg-blue-50 text-blue-700 border-blue-200";
  if (variant === 'slate') variantStyle = "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border tracking-tight ${sizeStyle} ${variantStyle} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
