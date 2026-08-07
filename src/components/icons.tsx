import React from 'react';

export const AvatarTigerIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 10h.01M16 10h.01" />
    <path d="M12 14c-1.5 0-2.5 1-2.5 1.5S10.5 17 12 17s2.5-.5 2.5-1.5S13.5 14 12 14z" />
    <path d="M7 6l2 3M17 6l-2 3M12 4v3" />
  </svg>
);

export const AvatarElephantIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a9 9 0 00-9 9c0 3.5 2 6.5 5 8v3l3-2h2l3 2v-3c3-1.5 5-4.5 5-8a9 9 0 00-9-9z" />
    <path d="M8 10h.01M16 10h.01" />
    <path d="M12 14v4" />
  </svg>
);

export const AvatarBisonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#1e293b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a8 8 0 00-8 8c0 4 3 7 8 11 5-4 8-7 8-11a8 8 0 00-8-8z" />
    <path d="M8 8l-2-3M16 8l2-3" />
    <path d="M9 12h6" />
  </svg>
);

export const AvatarLeopardIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="9" r="1" fill={color} />
    <circle cx="16" cy="9" r="1" fill={color} />
    <circle cx="12" cy="14" r="1" fill={color} />
    <circle cx="9" cy="16" r="1" fill={color} />
    <circle cx="15" cy="16" r="1" fill={color} />
  </svg>
);

export const AvatarBearIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = '#78350f' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="7" />
    <circle cx="6" cy="7" r="3" />
    <circle cx="18" cy="7" r="3" />
    <circle cx="10" cy="12" r="1" fill={color} />
    <circle cx="14" cy="12" r="1" fill={color} />
    <path d="M10 16c1 1 3 1 4 0" />
  </svg>
);
