import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  let baseStyle = "inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";
  
  let sizeStyle = "px-5 py-3 text-sm gap-2";
  if (size === 'sm') sizeStyle = "px-3.5 py-1.5 text-xs gap-1.5";
  if (size === 'lg') sizeStyle = "px-7 py-3.5 text-base gap-2.5";

  let variantStyle = "bg-[#059669] hover:bg-[#047857] text-white shadow-sm";
  if (variant === 'secondary') variantStyle = "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200";
  if (variant === 'outline') variantStyle = "bg-white border border-[#059669] text-[#059669] hover:bg-[#e6f7f0]";
  if (variant === 'danger') variantStyle = "bg-[#fee2e2] text-[#dc2626] hover:bg-[#fca5a5]";
  if (variant === 'ghost') variantStyle = "bg-transparent hover:bg-slate-100 text-slate-700";

  return (
    <button 
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
