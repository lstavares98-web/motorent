import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Bike, FileText, CreditCard,
  Wrench, BarChart3, ShieldOff, Settings, LogOut,
  Menu, X, Bell, ChevronRight,
} from 'lucide-react';
import { useData } from './hooks/useData';
import { isAfter, isBefore, parseISO, startOfDay, addDays } from 'date-fns';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface Props {
  currentPage: string;
  setCurrentPage: (p: string) => void;
  children: ReactNode;
}

export function Layout({ currentPage, setCurrentPage, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { parcelas, bloqueios } = useData();

  const today = startOfDay(new Date());
  const alertas = parcelas.filter(p => {
    if (p.status === 'Paga') return false;
    const venc = parseISO(p.data_vencimento);
    return isBefore(venc, today) || (isAfter(venc, today) && isBefore(venc, addDays(today, 2)));
  }).length;

  const bloqueiosAtivos = bloqueios.filter(b => b.status === 'Ativo').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { id: 'estoque', label: 'Estoque', icon: <Bike className="w-5 h-5" /> },
    { id: 'contratos', label: 'Contratos', icon: <FileText className="w-5 h-5" /> },
    { id: 'parcelas', label: 'Parcelas', icon: <CreditCard className="w-5 h-5" />, badge: alertas > 0 ? alertas : undefined },
    { id: 'manutencao', label: 'Manutenção', icon: <Wrench className="w-5 h-5" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'bloqueios', label: 'Bloqueios', icon: <ShieldOff className="w-5 h-5" />, badge: bloqueiosAtivos > 0 ? bloqueiosAtivos : undefined },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  const currentLabel = navItems.find(n => n.id === currentPage)?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Logo */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
                <Bike className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">MotoRent</span>
                <p className="text-xs text-slate-500">Gestão de Frotas</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                    currentPage === item.id
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className={currentPage === item.id ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  {currentPage === item.id && (
                    <ChevronRight className="w-3 h-3 text-orange-400/60" />
                  )}
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-slate-800">
              <button
                onClick={() => {
                  sessionStorage.removeItem('auth');
                  window.location.reload();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-200">{currentLabel}</h2>
          </div>

          {/* Alertas */}
          {(alertas > 0 || bloqueiosAtivos > 0) && (
            <div className="flex items-center gap-2">
              {alertas > 0 && (
                <button
                  onClick={() => setCurrentPage('parcelas')}
                  className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{alertas} parcela{alertas > 1 ? 's' : ''}</span>
                </button>
              )}
              {bloqueiosAtivos > 0 && (
                <button
                  onClick={() => setCurrentPage('bloqueios')}
                  className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg"
                >
                  <ShieldOff className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">{bloqueiosAtivos} bloqueio{bloqueiosAtivos > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
