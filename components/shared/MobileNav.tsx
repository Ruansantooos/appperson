
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Wallet, Zap, Dumbbell, Layers } from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/' },
    { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { label: 'Gym', icon: Dumbbell, path: '/gym' },
    { label: 'Habits', icon: Zap, path: '/habits' },
    { label: 'Finance', icon: Wallet, path: '/finance' },
    { label: 'Projects', icon: Layers, path: '/projects' },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-[var(--sidebar-bg)]/90 backdrop-blur-xl border border-[var(--card-border)] rounded-[24px] flex items-center justify-around px-2 z-50 shadow-2xl transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isActive ? 'text-[#c1ff72]' : 'text-[var(--foreground)] opacity-20'
              }`}
          >
            <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNav;
