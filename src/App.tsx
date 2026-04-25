import { useState, useEffect } from 'react';
import { DataProvider } from './hooks/useData';
import { Layout } from './Layout';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Estoque } from './pages/Estoque';
import { Contratos } from './pages/Contratos';
import { Parcelas } from './pages/Parcelas';
import { ManutencaoPage } from './pages/Manutencao';
import { Relatorios } from './pages/Relatorios';
import { Bloqueios } from './pages/Bloqueios';
import { Configuracoes } from './pages/Configuracoes';

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'clientes': return <Clientes />;
      case 'estoque': return <Estoque />;
      case 'contratos': return <Contratos />;
      case 'parcelas': return <Parcelas />;
      case 'manutencao': return <ManutencaoPage />;
      case 'relatorios': return <Relatorios />;
      case 'bloqueios': return <Bloqueios />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setIsAuth(sessionStorage.getItem('auth') === 'true');
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <Login
        onLogin={() => {
          sessionStorage.setItem('auth', 'true');
          setIsAuth(true);
        }}
      />
    );
  }

  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
