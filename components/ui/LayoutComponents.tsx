
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; variant?: 'dark' | 'peach' | 'blue' | 'orange' }> = ({ children, className, variant = 'dark' }) => {
  const variants = {
    dark: "bg-[var(--card-bg)] border border-[var(--card-border)]",
    peach: "bg-[#d8b4a6] text-[#1a1a1a]",
    blue: "bg-[#8fb0bc] text-[#1a1a1a]",
    orange: "bg-[#e6a06e] text-[#1a1a1a]",
  };

  return (
    <div className={`${variants[variant]} rounded-[28px] overflow-hidden transition-all ${className}`}>
      {children}
    </div>
  );
};

export const ButtonCircle: React.FC<{ icon: React.ReactNode; className?: string; onClick?: () => void }> = ({ icon, className, onClick }) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 rounded-full bg-[#c1ff72] text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95 ${className}`}
  >
    {icon}
  </button>
);

// Added missing Button component used by multiple pages
export const Button: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, className, variant = 'primary', size = 'md', onClick, disabled }) => {
  const variants = {
    primary: "bg-[#c1ff72] text-black hover:bg-[#b0f061]",
    secondary: "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/20",
    outline: "bg-transparent border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--input-bg)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Added missing Input component used by Tasks and Settings pages
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    className={`w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 focus:ring-2 focus:ring-[#c1ff72] focus:outline-none transition-all ${className}`}
    {...props}
  />
);

// Extended Badge variants to support all usage cases (info, danger, warning)
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'status' | 'default' | 'info' | 'danger' | 'warning'; className?: string }> = ({ children, variant = 'default', className }) => {
  const variants = {
    success: "bg-[#c1ff72]/20 text-[#c1ff72]",
    status: "bg-[var(--input-bg)] text-[var(--foreground)] opacity-80",
    info: "bg-blue-500/20 text-blue-400",
    danger: "bg-red-500/20 text-red-400",
    warning: "bg-amber-500/20 text-amber-400",
    default: "bg-[var(--input-bg)] text-[var(--foreground)] opacity-50",
  };

  return (
    <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className || ''}`}>
      {children}
    </span>
  );
};
