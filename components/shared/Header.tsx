
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/tasks': return 'Tarefas';
      case '/projects': return 'Projetos';
      case '/finance': return 'Financeiro';
      case '/habits': return 'Hábitos';
      case '/calendar': return 'Calendário';
      case '/settings': return 'Configurações';
      case '/gym': return 'Academia';
      default: return 'Corelys';
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-40 border-b border-[var(--card-border)]">
      <div className="flex flex-col">
        <h2 className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.3em] mb-1 opacity-50">Corelys / {getPageTitle(location.pathname)}</h2>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Visão Geral</h1>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--foreground)] hover:scale-105 transition-all text-[#c1ff72]"
      >
        {theme === 'light' ? <Moon size={20} fill="currentColor" /> : <Sun size={20} fill="currentColor" />}
      </button>
    </header>
  );
};

export default Header;
