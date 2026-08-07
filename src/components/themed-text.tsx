import React from 'react';

export interface ThemedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  children?: React.ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ type = 'default', children, className = '', ...props }) => {
  let styleClass = 'text-slate-800 dark:text-slate-100';
  if (type === 'title') styleClass = 'text-2xl font-bold text-slate-900 dark:text-white';
  else if (type === 'subtitle') styleClass = 'text-lg font-semibold text-slate-800 dark:text-slate-200';
  else if (type === 'defaultSemiBold') styleClass = 'font-semibold text-slate-800 dark:text-slate-200';
  else if (type === 'link') styleClass = 'text-emerald-600 dark:text-emerald-400 underline font-medium cursor-pointer';

  return <span className={`${styleClass} ${className}`} {...props}>{children}</span>;
};
