import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, ShieldCheck, Plus, AlertTriangle } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Bloqueio, MotoItem } from '../types';
import { enriquecerParcelas, formatCurrency, formatDate } from '../utils/parcela';

export function Bloqueios() {
  const { bloqueios, itens, clientes, vendas, parcelas: rawParcelas, addBloqueio, resolverBloqueio } = useData();
  const parcelas = useMemo(() => enriquecerParcelas(rawParcelas), [rawParcelas]);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ item_id: '', cliente_id: '', venda_id: '', parcela_mais_antiga_id: '' });
  const [loading, setLoading] = useState(false);

  // Contratos com parcelas problemáticas
  const contratosProblema = useMemo(() => {
    const bloqParcelas = parcelas.filter(p => p.status === 'Bloqueio recomendado' || p.status === 'Atrasada');
    const vendaIds = [...new Set(bloqParcelas.map(p => p.venda_id))];
    return vendaIds.map(vid => {
      const venda = vendas.find(v => v.id === vid);
      if (!venda) return null;
      const pars = bloqParcelas.filter(p => p.venda_id === vid);
      const maisAntiga = pars.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))[0];
      return { venda, parcelaMaisAntiga: maisAntiga };
    }).filter(Boolean) as { venda: (typeof vendas)[0]; parcelaMaisAntiga: (typeof parcelas)[0] }[];
  }, [parcelas, vendas]);

  const getItemName = (id: string) => {
    const i = itens.find(x => x.id === id) as MotoItem;
    return i?.tipo === 'Moto' ? `${i.marca} ${i.modelo} — ${i.placa}` : '—';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addBloqueio({ ...form, data_bloqueio: new Date().toISOString().split('T')[0], status: 'Ativo' });
      setModal(false);
    } finally { setLoading(false); }
  };

  const ativos = bloqueios.filter(b => b.status === 'Ativo');
  const resolvidos = bloqueios.filter(b => b.status === 'Resolvido');

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bloqueios</h1>
          <p className="page-subtitle">{ativos.length} ativos · {resolvidos.length} resolvidos</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-danger">
          <ShieldOff className="w-4 h-4" /> Registrar Bloqueio
        </button>
      </div>

      {/* Alertas */}
      {contratosProblema.length > 0 && (
        <div className="card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Contratos com bloqueio recomendado</h3>
          </div>
          <div className="space-y-2">
            {contratosProblema.map(({ venda, parcelaMaisAntiga }) => {
              const cli = clientes.find(c => c.id === venda.cliente_id);
              const item = itens.find(i => i.id === venda.item_id) as MotoItem;
              const jaBloqueado = bloqueios.some(b => b.venda_id === venda.id && b.status === 'Ativo');
              return (
                <div key={venda.id} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{cli?.nome}</p>
                    <p className="text-xs text-slate-500">
                      {item?.tipo === 'Moto' ? `${item.marca} ${item.modelo}` : '—'} ·
                      Parcela #{parcelaMaisAntiga.numero} — {formatDate(parcelaMaisAntiga.data_vencimento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge bg-red-500/10 text-red-400">{formatCurrency(parcelaMaisAntiga.valor)}</span>
                    {!jaBloqueado && (
                      <button
                        onClick={() => {
                          setForm({
                            item_id: venda.item_id,
                            cliente_id: venda.cliente_id,
                            venda_id: venda.id,
                            parcela_mais_antiga_id: parcelaMaisAntiga.id,
                          });
                          setModal(true);
                        }}
                        className="btn-danger py-1.5 px-3 text-xs">
                        <ShieldOff className="w-3.5 h-3.5" /> Bloquear
                      </button>
                    )}
                    {jaBloqueado && <span className="badge bg-red-500/10 text-red-400">Já bloqueado</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bloqueios Ativos */}
      {ativos.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-red-400">Bloqueios Ativos</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Data Bloqueio</th>
                <th className="table-header">Status</th>
                <th className="table-header w-32">Ação</th>
              </tr>
            </thead>
            <tbody>
              {ativos.map((b, i) => {
                const cli = clientes.find(c => c.id === b.cliente_id);
                return (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-800/30 transition-colors">
                    <td className="table-cell text-sm">{getItemName(b.item_id)}</td>
                    <td className="table-cell font-medium text-slate-200">{cli?.nome ?? '—'}</td>
                    <td className="table-cell text-xs">{formatDate(b.data_bloqueio)}</td>
                    <td className="table-cell"><StatusBadge status={b.status} /></td>
                    <td className="table-cell">
                      <button
                        onClick={() => { if(confirm('Marcar como resolvido?')) resolverBloqueio(b.id); }}
                        className="btn-secondary py-1.5 px-3 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5" /> Resolver
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolvidos */}
      {resolvidos.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-emerald-400">Bloqueios Resolvidos</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Data</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {resolvidos.map((b, i) => {
                const cli = clientes.find(c => c.id === b.cliente_id);
                return (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="table-cell text-sm">{getItemName(b.item_id)}</td>
                    <td className="table-cell font-medium text-slate-200">{cli?.nome ?? '—'}</td>
                    <td className="table-cell text-xs">{formatDate(b.data_bloqueio)}</td>
                    <td className="table-cell"><StatusBadge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bloqueios.length === 0 && contratosProblema.length === 0 && (
        <div className="card text-center py-16">
          <ShieldCheck className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum bloqueio registrado</p>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Bloqueio" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Item (Moto) *</label>
            <select className="select" value={form.item_id} onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))} required>
              <option value="">Selecione...</option>
              {itens.filter(i => i.tipo === 'Moto').map(i => <option key={i.id} value={i.id}>{getItemName(i.id)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cliente *</label>
            <select className="select" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} required>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Contrato *</label>
            <select className="select" value={form.venda_id} onChange={e => setForm(f => ({ ...f, venda_id: e.target.value }))} required>
              <option value="">Selecione...</option>
              {vendas.filter(v => v.status === 'Ativa').map(v => (
                <option key={v.id} value={v.id}>{v.numero_contrato || v.id.slice(0,8).toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-danger">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar Bloqueio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
