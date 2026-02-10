
import React from 'react';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

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
      default: return 'Nexus';
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10">
      <div className="flex flex-col">
        <h2 className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.3em] mb-1 opacity-50">Nexus / {getPageTitle(location.pathname)}</h2>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Visão Geral</h1>
      </div>
    </header>
  );
};

export default Header;
