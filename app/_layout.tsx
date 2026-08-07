import React from 'react';
import { useColorScheme } from '../src/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <div className={colorScheme === 'dark' ? 'dark bg-slate-900 text-white min-h-screen' : 'bg-slate-50 text-slate-900 min-h-screen'}>
      {children}
    </div>
  );
}
