import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Venda, MotoItem } from '../types';
import { formatCurrency, formatDate } from '../utils/parcela';

const emptyVenda = {
  numero_contrato: '',
  cliente_id: '',
  item_id: '',
  valor_venda: 0,
  valor_entrada: 0,
  entrada_paga: false,
  taxa_juros: 0,
  numero_parcelas: 12,
  frequencia: 'Mensal' as const,
  data_primeiro_vencimento: '',
  data_venda: new Date().toISOString().split('T')[0],
  parceiro: '',
  investimento_parceiro: 0,
  avalista_nome: '',
  avalista_cpf: '',
  avalista_telefone: '',
};

export function Contratos() {
  const { vendas, clientes, itens, parcelas, addVenda, updateVenda } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'view' | null>(null);
  const [selected, setSelected] = useState<Venda | null>(null);
  const [form, setForm] = useState(emptyVenda);
  const [loading, setLoading] = useState(false);
  const [showAvalista, setShowAvalista] = useState(false);

  const itensDisponiveis = itens.filter(i => i.status === 'Em estoque' || i.status === 'Reservado');

  const filtered = useMemo(() => vendas.filter(v => {
    const cli = clientes.find(c => c.id === v.cliente_id);
    const item = itens.find(i => i.id === v.item_id);
    const q = search.toLowerCase();
    return !q || cli?.nome.toLowerCase().includes(q) || v.numero_contrato?.toLowerCase().includes(q) ||
      (item?.tipo === 'Moto' && `${(item as MotoItem).marca} ${(item as MotoItem).modelo}`.toLowerCase().includes(q));
  }), [vendas, clientes, itens, search]);

  const getItemName = (id: string) => {
    const i = itens.find(x => x.id === id);
    if (!i) return '—';
    if (i.tipo === 'Moto') { const m = i as MotoItem; return `${m.marca} ${m.modelo} (${m.placa})`; }
    return i.tipo;
  };

  const getClienteName = (id: string) => clientes.find(c => c.id === id)?.nome ?? '—';

  const calcSummary = () => {
    const fin = form.valor_venda - form.valor_entrada;
    const total = fin * (1 + form.taxa_juros / 100);
    const parc = form.numero_parcelas > 0 ? total / form.numero_parcelas : 0;
    return { fin, total, parc };
  };
  const summary = calcSummary();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.item_id) return;
    setLoading(true);
    try {
      await addVenda({ ...form, status: 'Ativa' });
      setModal(null);
      setForm(emptyVenda);
    } finally { setLoading(false); }
  };

  const getParcelas = (vendaId: string) => parcelas.filter(p => p.venda_id === vendaId);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">{vendas.length} contratos — {vendas.filter(v => v.status === 'Ativa').length} ativos</p>
        </div>
        <button onClick={() => { setForm(emptyVenda); setModal('add'); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Contrato
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input className="input pl-10" placeholder="Buscar por cliente, contrato ou moto..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Contrato</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Item</th>
              <th className="table-header">Valor</th>
              <th className="table-header">Parcelas</th>
              <th className="table-header">Data</th>
              <th className="table-header">Status</th>
              <th className="table-header w-16">Ver</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-600">Nenhum contrato encontrado</td></tr>
            ) : filtered.map((v, i) => {
              const pars = getParcelas(v.id);
              const pagas = pars.filter(p => p.status === 'Paga').length;
              return (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-800/30 transition-colors">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-slate-400">
                      {v.numero_contrato || v.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-slate-200">{getClienteName(v.cliente_id)}</td>
                  <td className="table-cell text-sm">{getItemName(v.item_id)}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-semibold text-slate-200">{formatCurrency(v.valor_venda)}</p>
                      <p className="text-xs text-slate-500">Entrada: {formatCurrency(v.valor_entrada)}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 min-w-[60px]">
                        <div className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${pars.length ? (pagas / pars.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{pagas}/{pars.length}</span>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{formatDate(v.data_venda)}</td>
                  <td className="table-cell"><StatusBadge status={v.status} /></td>
                  <td className="table-cell">
                    <button onClick={() => { setSelected(v); setModal('view'); }}
                      className="btn-ghost p-1.5 hover:text-orange-400">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Contrato */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Novo Contrato" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Nº Contrato</label>
              <input className="input" value={form.numero_contrato} onChange={f('numero_contrato')} placeholder="Gerado automaticamente" />
            </div>
            <div>
              <label className="label">Data da Venda *</label>
              <input type="date" className="input" value={form.data_venda} onChange={f('data_venda')} required />
            </div>
            <div>
              <label className="label">Frequência *</label>
              <select className="select" value={form.frequencia} onChange={f('frequencia')}>
                <option>Mensal</option><option>Quinzenal</option><option>Semanal</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <select className="select" value={form.cliente_id} onChange={f('cliente_id')} required>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Item *</label>
              <select className="select" value={form.item_id} onChange={f('item_id')} required>
                <option value="">Selecione...</option>
                {itensDisponiveis.map(i => (
                  <option key={i.id} value={i.id}>{getItemName(i.id)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="label">Valor de Venda (R$) *</label>
              <input type="number" step="0.01" min="0" className="input" value={form.valor_venda} onChange={f('valor_venda')} required />
            </div>
            <div>
              <label className="label">Entrada (R$)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.valor_entrada} onChange={f('valor_entrada')} />
            </div>
            <div>
              <label className="label">Taxa de Juros (%)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.taxa_juros} onChange={f('taxa_juros')} />
            </div>
            <div>
              <label className="label">Nº Parcelas *</label>
              <input type="number" min="1" className="input" value={form.numero_parcelas} onChange={f('numero_parcelas')} required />
            </div>
            <div className="col-span-2">
              <label className="label">1º Vencimento *</label>
              <input type="date" className="input" value={form.data_primeiro_vencimento} onChange={f('data_primeiro_vencimento')} required />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.entrada_paga} onChange={f('entrada_paga')}
                  className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-slate-300">Entrada paga</span>
              </label>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Valor Financiado</p>
              <p className="text-lg font-bold text-slate-200">{formatCurrency(summary.fin)}</p>
            </div>
            <div className="text-center border-x border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Total com Juros</p>
              <p className="text-lg font-bold text-orange-400">{formatCurrency(summary.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Valor da Parcela</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(summary.parc)}</p>
            </div>
          </div>

          {/* Avalista (expansível) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setShowAvalista(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:bg-slate-800/30 transition-colors">
              <span className="font-medium">Avalista (opcional)</span>
              {showAvalista ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAvalista && (
              <div className="grid grid-cols-3 gap-4 p-4 border-t border-slate-800">
                <div><label className="label">Nome</label><input className="input" value={form.avalista_nome} onChange={f('avalista_nome')} /></div>
                <div><label className="label">CPF</label><input className="input" value={form.avalista_cpf} onChange={f('avalista_cpf')} /></div>
                <div><label className="label">Telefone</label><input className="input" value={form.avalista_telefone} onChange={f('avalista_telefone')} /></div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Criar Contrato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar */}
      {selected && (
        <Modal open={modal === 'view'} onClose={() => setModal(null)} title={`Contrato — ${selected.numero_contrato || selected.id.slice(0,8).toUpperCase()}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Cliente', getClienteName(selected.cliente_id)],
                ['Item', getItemName(selected.item_id)],
                ['Valor da Venda', formatCurrency(selected.valor_venda)],
                ['Entrada', formatCurrency(selected.valor_entrada)],
                ['Taxa de Juros', `${selected.taxa_juros}%`],
                ['Frequência', selected.frequencia],
                ['Parcelas', `${selected.numero_parcelas}x`],
                ['Data da Venda', formatDate(selected.data_venda)],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-2">Parcelas</p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {getParcelas(selected.id).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400">#{p.numero} — {formatDate(p.data_vencimento)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{formatCurrency(p.valor)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { if(confirm('Cancelar contrato?')) { updateVenda(selected.id, { status: 'Cancelada' }); setModal(null); } }}
                className="btn-danger">Cancelar Contrato</button>
              <button onClick={() => setModal(null)} className="btn-secondary">Fechar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
