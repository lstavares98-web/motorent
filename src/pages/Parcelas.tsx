import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, Filter, CreditCard, DollarSign } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Parcela } from '../types';
import { enriquecerParcelas, formatCurrency, formatDate } from '../utils/parcela';

type FiltroStatus = 'Todos' | 'Em aberto' | 'Atrasada' | 'Bloqueio recomendado' | 'Vence hoje' | 'Vence amanhã' | 'Paga';

const FORMAS = ['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência', 'Outro'];

export function Parcelas() {
  const { parcelas: rawParcelas, clientes, vendas, pagarParcela } = useData();
  const parcelas = useMemo(() => enriquecerParcelas(rawParcelas), [rawParcelas]);

  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('Todos');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Parcela | null>(null);
  const [pagForm, setPagForm] = useState({ data_pagamento: new Date().toISOString().split('T')[0], pago_por: '', forma_pagamento: 'Pix' });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return parcelas.filter(p => {
      const cli = clientes.find(c => c.id === p.cliente_id);
      const matchSearch = !search || cli?.nome.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filtroStatus === 'Todos' || p.status === filtroStatus;
      return matchSearch && matchStatus;
    });
  }, [parcelas, clientes, search, filtroStatus]);

  const stats = useMemo(() => ({
    total: parcelas.filter(p => p.status !== 'Paga').reduce((s, p) => s + p.valor, 0),
    atrasadas: parcelas.filter(p => p.status === 'Atrasada' || p.status === 'Bloqueio recomendado').length,
    venceHoje: parcelas.filter(p => p.status === 'Vence hoje').length,
    pagas: parcelas.filter(p => p.status === 'Paga').length,
  }), [parcelas]);

  const openPagar = (p: Parcela) => {
    setSelected(p);
    setPagForm({ data_pagamento: new Date().toISOString().split('T')[0], pago_por: '', forma_pagamento: 'Pix' });
    setModal(true);
  };

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      await pagarParcela(selected.id, pagForm.data_pagamento, pagForm.pago_por, pagForm.forma_pagamento);
      setModal(false);
    } finally { setLoading(false); }
  };

  const FILTROS: FiltroStatus[] = ['Todos','Em aberto','Vence hoje','Vence amanhã','Atrasada','Bloqueio recomendado','Paga'];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parcelas</h1>
          <p className="page-subtitle">{parcelas.length} parcelas — {stats.atrasadas} atrasadas</p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'A Receber', value: formatCurrency(stats.total), color: 'text-slate-200', bg: 'bg-slate-800/50' },
          { label: 'Atrasadas', value: String(stats.atrasadas), color: 'text-red-400', bg: 'bg-red-500/5 border border-red-500/10' },
          { label: 'Vencem Hoje', value: String(stats.venceHoje), color: 'text-amber-400', bg: 'bg-amber-500/5 border border-amber-500/10' },
          { label: 'Pagas', value: String(stats.pagas), color: 'text-emerald-400', bg: 'bg-emerald-500/5 border border-emerald-500/10' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-3 ${k.bg}`}>
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-10" placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltroStatus(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                filtroStatus === f ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Vencimento</th>
              <th className="table-header">Valor</th>
              <th className="table-header">Status</th>
              <th className="table-header">Pagamento</th>
              <th className="table-header w-24">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-600">Nenhuma parcela encontrada</td></tr>
            ) : filtered.map((p, i) => {
              const cli = clientes.find(c => c.id === p.cliente_id);
              const venda = vendas.find(v => v.id === p.venda_id);
              return (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                  className="hover:bg-slate-800/30 transition-colors">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-slate-500">#{p.numero}</span>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-slate-200">{cli?.nome ?? '—'}</p>
                    <p className="text-xs text-slate-500">{venda?.numero_contrato || venda?.id.slice(0,8).toUpperCase()}</p>
                  </td>
                  <td className="table-cell text-sm">{formatDate(p.data_vencimento)}</td>
                  <td className="table-cell font-semibold text-slate-200">{formatCurrency(p.valor)}</td>
                  <td className="table-cell"><StatusBadge status={p.status} /></td>
                  <td className="table-cell text-xs text-slate-500">
                    {p.data_pagamento ? (
                      <span>{formatDate(p.data_pagamento)} · {p.forma_pagamento}</span>
                    ) : '—'}
                  </td>
                  <td className="table-cell">
                    {p.status !== 'Paga' ? (
                      <button onClick={() => openPagar(p)} className="btn-primary py-1.5 px-3 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Pagar
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Paga
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Pagamento */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Pagamento" size="sm">
        {selected && (
          <form onSubmit={handlePagar} className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-slate-500">Parcela #{selected.numero}</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(selected.valor)}</p>
              <p className="text-xs text-slate-500">Vencimento: {formatDate(selected.data_vencimento)}</p>
            </div>
            <div>
              <label className="label">Data do pagamento *</label>
              <input type="date" className="input" value={pagForm.data_pagamento}
                onChange={e => setPagForm(f => ({ ...f, data_pagamento: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Forma de pagamento *</label>
              <select className="select" value={pagForm.forma_pagamento}
                onChange={e => setPagForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                {FORMAS.map(fo => <option key={fo}>{fo}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Recebido por</label>
              <input className="input" value={pagForm.pago_por}
                onChange={e => setPagForm(f => ({ ...f, pago_por: e.target.value }))} placeholder="Nome de quem recebeu" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Pagamento'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
