import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'outline' | 'danger' | 'warning' | 'green';
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  active = false,
  className = '',
  ...props
}) => {
  let baseStyle = "rounded-3xl p-5 transition-all duration-200 border";
  
  let variantStyle = "bg-white border-slate-100 text-slate-900 shadow-sm";
  if (variant === 'glass') variantStyle = "bg-white/90 backdrop-blur-md border-slate-100 text-slate-900 shadow-sm";
  if (variant === 'interactive') variantStyle = "bg-white hover:bg-slate-50 border-slate-100 hover:border-emerald-300 cursor-pointer text-slate-900 shadow-sm";
  if (variant === 'outline') variantStyle = "bg-slate-50 border-slate-200 text-slate-800";
  if (variant === 'green') variantStyle = "bg-[#059669] border-[#047857] text-white shadow-md";
  if (variant === 'danger') variantStyle = "bg-red-50 border-red-200 text-red-900";
  if (variant === 'warning') variantStyle = "bg-amber-50 border-amber-200 text-amber-900";

  if (active) {
    variantStyle += " border-[#059669] shadow-md ring-2 ring-[#059669]/20";
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

