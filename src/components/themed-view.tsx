import React from 'react';

export interface ThemedViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
};
