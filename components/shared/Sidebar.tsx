
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Heart,
  Wallet,
  CalendarDays,
  Zap,
  Dumbbell,
  Settings,
  Layers
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, path: '/' },
    { icon: BarChart2, path: '/tasks' },
    { icon: Layers, path: '/projects' }, // Novo ícone de Projetos
    { icon: Heart, path: '/habits' },
    { icon: Dumbbell, path: '/gym' },
    { icon: Wallet, path: '/finance' },
    { icon: CalendarDays, path: '/calendar' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-20 bg-black h-screen sticky top-0 py-8 items-center justify-between border-r border-white/5">
      <div className="flex flex-col items-center gap-10">
        <div className="w-12 h-12 bg-[#c1ff72]/10 rounded-xl flex items-center justify-center text-[#c1ff72] mb-4">
          <Zap size={22} fill="currentColor" />
        </div>

        <nav className="flex flex-col gap-6 bg-[#161616] p-3 rounded-[32px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#c1ff72] text-black shadow-[0_0_20px_rgba(193,255,114,0.3)]' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-6">
        <Link 
          to="/settings" 
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${location.pathname === '/settings' ? 'text-[#c1ff72]' : 'text-white/20 hover:text-white'}`}
        >
          <Settings size={22} />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
