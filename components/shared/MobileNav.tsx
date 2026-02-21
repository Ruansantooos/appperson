
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Wallet, Zap, Dumbbell, Layers, HeartPulse } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY = 'corelys_active_workout';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const [hidden, setHidden] = useState(() => !!localStorage.getItem(STORAGE_KEY));

  // Listen for localStorage changes (from same tab via storage event won't fire, so poll)
  useEffect(() => {
    const check = () => setHidden(!!localStorage.getItem(STORAGE_KEY));
    check();
    const interval = setInterval(check, 500);
    window.addEventListener('storage', check);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', check);
    };
  }, []);

  const navItems = useMemo(() => {
    const items = [
      { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
      { label: 'Gym', icon: Dumbbell, path: '/gym' },
      { label: 'Habits', icon: Zap, path: '/habits' },
      { label: 'Finance', icon: Wallet, path: '/finance' },
      { label: 'Projects', icon: Layers, path: '/projects' },
    ];
    if (profile?.gender === 'Female') {
      items.push({ label: 'Ciclo', icon: HeartPulse, path: '/cycle' });
    }
    return items;
  }, [profile?.gender]);

  if (hidden) return null;

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
