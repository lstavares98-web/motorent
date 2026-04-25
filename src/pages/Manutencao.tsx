import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Wrench, DollarSign } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { Manutencao, MotoItem } from '../types';
import { formatCurrency, formatDate } from '../utils/parcela';

const empty: Omit<Manutencao, 'id' | 'created_at'> = {
  item_id: '', data: new Date().toISOString().split('T')[0],
  descricao: '', km: undefined, valor: 0, pago_por: 'MotoRent',
  desconta_lucro: true, notas: '',
};

export function ManutencaoPage() {
  const { manutencoes, itens, addManutencao, deleteManutencao } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const motos = itens.filter(i => i.tipo === 'Moto');

  const filtered = useMemo(() => {
    return manutencoes.filter(m => {
      const item = itens.find(i => i.id === m.item_id) as MotoItem | undefined;
      return !search || m.descricao.toLowerCase().includes(search.toLowerCase()) ||
        (item && `${item.marca} ${item.modelo}`.toLowerCase().includes(search.toLowerCase()));
    });
  }, [manutencoes, itens, search]);

  const stats = useMemo(() => ({
    totalMotoRent: manutencoes.filter(m => m.pago_por === 'MotoRent').reduce((s, m) => s + m.valor, 0),
    totalCliente: manutencoes.filter(m => m.pago_por === 'Cliente').reduce((s, m) => s + m.valor, 0),
    count: manutencoes.length,
  }), [manutencoes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addManutencao(form);
      setModal(false);
      setForm(empty);
    } finally { setLoading(false); }
  };

  const getItemName = (id: string) => {
    const i = itens.find(x => x.id === id) as MotoItem;
    if (!i) return '—';
    return i.tipo === 'Moto' ? `${i.marca} ${i.modelo} — ${i.placa}` : i.tipo;
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manutenção</h1>
          <p className="page-subtitle">{manutencoes.length} registros</p>
        </div>
        <button onClick={() => { setForm(empty); setModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Manutenção
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm">
          <p className="text-xs text-slate-500">Total Registros</p>
          <p className="text-xl font-bold text-slate-200 mt-0.5">{stats.count}</p>
        </div>
        <div className="card-sm border-red-500/10">
          <p className="text-xs text-slate-500">Custo MotoRent</p>
          <p className="text-xl font-bold text-red-400 mt-0.5">{formatCurrency(stats.totalMotoRent)}</p>
        </div>
        <div className="card-sm border-emerald-500/10">
          <p className="text-xs text-slate-500">Pago pelo Cliente</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatCurrency(stats.totalCliente)}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-10" placeholder="Buscar por moto ou descrição..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Item</th>
              <th className="table-header">Data</th>
              <th className="table-header">Descrição</th>
              <th className="table-header">KM</th>
              <th className="table-header">Valor</th>
              <th className="table-header">Pago por</th>
              <th className="table-header">Desconta Lucro</th>
              <th className="table-header w-16">Del.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-600">Nenhum registro encontrado</td></tr>
            ) : filtered.map((m, i) => (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="hover:bg-slate-800/30 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300">{getItemName(m.item_id)}</span>
                  </div>
                </td>
                <td className="table-cell text-xs">{formatDate(m.data)}</td>
                <td className="table-cell text-sm max-w-[200px]">
                  <p className="truncate">{m.descricao}</p>
                  {m.notas && <p className="text-xs text-slate-500 truncate">{m.notas}</p>}
                </td>
                <td className="table-cell text-xs">{m.km ? `${m.km.toLocaleString('pt-BR')} km` : '—'}</td>
                <td className="table-cell font-semibold text-slate-200">{formatCurrency(m.valor)}</td>
                <td className="table-cell">
                  <span className={`badge ${m.pago_por === 'MotoRent' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {m.pago_por}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${m.desconta_lucro ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {m.desconta_lucro ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="table-cell">
                  <button onClick={() => { if(confirm('Excluir registro?')) deleteManutencao(m.id); }}
                    className="btn-ghost p-1.5 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova Manutenção">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Item *</label>
            <select className="select" value={form.item_id} onChange={f('item_id')} required>
              <option value="">Selecione a moto...</option>
              {motos.map(m => <option key={m.id} value={m.id}>{getItemName(m.id)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" value={form.data} onChange={f('data')} required />
            </div>
            <div>
              <label className="label">KM</label>
              <input type="number" className="input" value={form.km ?? ''} onChange={f('km')} />
            </div>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input className="input" value={form.descricao} onChange={f('descricao')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" min="0" className="input" value={form.valor} onChange={f('valor')} required />
            </div>
            <div>
              <label className="label">Pago por *</label>
              <select className="select" value={form.pago_por} onChange={f('pago_por')}>
                <option value="MotoRent">MotoRent</option>
                <option value="Cliente">Cliente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input h-16 resize-none" value={form.notas} onChange={f('notas')} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.desconta_lucro} onChange={f('desconta_lucro')} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-slate-300">Descontar do lucro</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
