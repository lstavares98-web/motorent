import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Bike, Smartphone, Package, Filter } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Item, ItemType, ItemStatus, MotoItem, TelemovelItem, MaterialItem } from '../types';
import { formatCurrency } from '../utils/parcela';

const STATUS_OPTIONS: ItemStatus[] = ['Em estoque','Reservado','Vendido','Quitado','Bloqueado','Retomado','Cancelado'];
const TIPO_OPTIONS: ItemType[] = ['Moto','Telemóvel','Material'];

const emptyMoto: Omit<MotoItem, 'id' | 'created_at'> = {
  tipo: 'Moto', status: 'Em estoque', valor_compra: 0, valor_venda_previsto: 0, notas: '',
  marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', condicao: 'Usado',
  placa: '', km_entrada: 0, valor_seguro: 0, valor_bloqueador: 0, valor_documento: 0,
  numero_rastreador: '', data_ultima_revisao: '', data_proxima_revisao: '',
};

export function Estoque() {
  const { itens, addItem, updateItem, deleteItem, socios } = useData();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<ItemType | 'Todos'>('Todos');
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'Todos'>('Todos');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [tipoForm, setTipoForm] = useState<ItemType>('Moto');
  const [form, setForm] = useState<any>(emptyMoto);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => itens.filter(i => {
    const matchSearch = search === '' || (
      (i.tipo === 'Moto' && (`${(i as MotoItem).marca} ${(i as MotoItem).modelo} ${(i as MotoItem).placa}`.toLowerCase().includes(search.toLowerCase()))) ||
      (i.tipo === 'Telemóvel' && (`${(i as TelemovelItem).marca} ${(i as TelemovelItem).modelo}`.toLowerCase().includes(search.toLowerCase()))) ||
      (i.tipo === 'Material' && (i as MaterialItem).nome?.toLowerCase().includes(search.toLowerCase()))
    );
    const matchTipo = filterTipo === 'Todos' || i.tipo === filterTipo;
    const matchStatus = filterStatus === 'Todos' || i.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  }), [itens, search, filterTipo, filterStatus]);

  const openAdd = () => {
    setTipoForm('Moto');
    setForm({ ...emptyMoto });
    setSelected(null);
    setModal('add');
  };

  const openEdit = (item: Item) => {
    setSelected(item);
    setTipoForm(item.tipo);
    setForm({ ...item });
    setModal('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, tipo: tipoForm };
      if (modal === 'add') await addItem(data);
      else if (selected) await updateItem(selected.id, data);
      setModal(null);
    } finally { setLoading(false); }
  };

  const getItemLabel = (i: Item) => {
    if (i.tipo === 'Moto') { const m = i as MotoItem; return `${m.marca} ${m.modelo} ${m.ano}`; }
    if (i.tipo === 'Telemóvel') { const t = i as TelemovelItem; return `${t.marca} ${t.modelo}`; }
    return (i as MaterialItem).nome;
  };

  const getItemSub = (i: Item) => {
    if (i.tipo === 'Moto') { const m = i as MotoItem; return m.placa; }
    if (i.tipo === 'Telemóvel') { const t = i as TelemovelItem; return `IMEI: ${t.imei}`; }
    return `Qtd: ${(i as MaterialItem).quantidade}`;
  };

  const TipoIcon = ({ tipo }: { tipo: ItemType }) => {
    if (tipo === 'Moto') return <Bike className="w-4 h-4" />;
    if (tipo === 'Telemóvel') return <Smartphone className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev: any) => ({ ...prev, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">{itens.length} itens cadastrados</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-10" placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-40" value={filterTipo} onChange={e => setFilterTipo(e.target.value as any)}>
          <option value="Todos">Todos os tipos</option>
          {TIPO_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="select w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="Todos">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Item</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Status</th>
              <th className="table-header">Compra</th>
              <th className="table-header">Venda Prev.</th>
              <th className="table-header">Margem</th>
              <th className="table-header w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-600">Nenhum item encontrado</td></tr>
            ) : filtered.map((item, i) => {
              const margem = item.valor_venda_previsto - item.valor_compra;
              return (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-800/30 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <TipoIcon tipo={item.tipo} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{getItemLabel(item)}</p>
                        <p className="text-xs text-slate-500">{getItemSub(item)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-slate-800 text-slate-300">
                      <TipoIcon tipo={item.tipo} /> {item.tipo}
                    </span>
                  </td>
                  <td className="table-cell"><StatusBadge status={item.status} /></td>
                  <td className="table-cell font-medium">{formatCurrency(item.valor_compra)}</td>
                  <td className="table-cell font-medium">{formatCurrency(item.valor_venda_previsto)}</td>
                  <td className="table-cell">
                    <span className={`font-semibold ${margem >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(margem)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="btn-ghost p-1.5 hover:text-blue-400">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(confirm('Excluir item?')) deleteItem(item.id); }}
                        className="btn-ghost p-1.5 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Novo Item' : 'Editar Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {modal === 'add' && (
            <div>
              <label className="label">Tipo</label>
              <div className="flex gap-2">
                {TIPO_OPTIONS.map(t => (
                  <button key={t} type="button"
                    onClick={() => { setTipoForm(t); setForm(t === 'Moto' ? { ...emptyMoto } : { tipo: t, status: 'Em estoque', valor_compra: 0, valor_venda_previsto: 0, notas: '' }); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${tipoForm === t ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Campos comuns */}
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={f('status')}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Condição</label>
              <select className="select" value={form.condicao} onChange={f('condicao')}>
                <option value="Usado">Usado</option>
                <option value="Zero">Zero</option>
              </select>
            </div>
            <div>
              <label className="label">Valor de Compra (R$)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.valor_compra} onChange={f('valor_compra')} required />
            </div>
            <div>
              <label className="label">Valor de Venda Previsto (R$)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.valor_venda_previsto} onChange={f('valor_venda_previsto')} required />
            </div>

            {/* Moto */}
            {tipoForm === 'Moto' && <>
              <div><label className="label">Marca *</label><input className="input" value={form.marca||''} onChange={f('marca')} required /></div>
              <div><label className="label">Modelo *</label><input className="input" value={form.modelo||''} onChange={f('modelo')} required /></div>
              <div><label className="label">Ano</label><input type="number" className="input" value={form.ano||''} onChange={f('ano')} /></div>
              <div><label className="label">Cor</label><input className="input" value={form.cor||''} onChange={f('cor')} /></div>
              <div><label className="label">Placa</label><input className="input" value={form.placa||''} onChange={f('placa')} placeholder="ABC-1D23" /></div>
              <div><label className="label">KM de Entrada</label><input type="number" className="input" value={form.km_entrada||0} onChange={f('km_entrada')} /></div>
              <div><label className="label">Valor Seguro (R$)</label><input type="number" step="0.01" className="input" value={form.valor_seguro||0} onChange={f('valor_seguro')} /></div>
              <div><label className="label">Valor Bloqueador (R$)</label><input type="number" step="0.01" className="input" value={form.valor_bloqueador||0} onChange={f('valor_bloqueador')} /></div>
              <div><label className="label">Nº Rastreador</label><input className="input" value={form.numero_rastreador||''} onChange={f('numero_rastreador')} /></div>
              <div><label className="label">Valor Documento (R$)</label><input type="number" step="0.01" className="input" value={form.valor_documento||0} onChange={f('valor_documento')} /></div>
              <div><label className="label">Última Revisão</label><input type="date" className="input" value={form.data_ultima_revisao||''} onChange={f('data_ultima_revisao')} /></div>
              <div><label className="label">Próxima Revisão</label><input type="date" className="input" value={form.data_proxima_revisao||''} onChange={f('data_proxima_revisao')} /></div>
            </>}

            {/* Telemóvel */}
            {tipoForm === 'Telemóvel' && <>
              <div><label className="label">Marca *</label><input className="input" value={form.marca||''} onChange={f('marca')} required /></div>
              <div><label className="label">Modelo *</label><input className="input" value={form.modelo||''} onChange={f('modelo')} required /></div>
              <div><label className="label">Cor</label><input className="input" value={form.cor||''} onChange={f('cor')} /></div>
              <div><label className="label">Armazenamento</label><input className="input" value={form.armazenamento||''} onChange={f('armazenamento')} placeholder="128GB" /></div>
              <div><label className="label">Nº de Série</label><input className="input" value={form.numero_serie||''} onChange={f('numero_serie')} /></div>
              <div><label className="label">IMEI</label><input className="input" value={form.imei||''} onChange={f('imei')} /></div>
            </>}

            {/* Material */}
            {tipoForm === 'Material' && <>
              <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.nome||''} onChange={f('nome')} required /></div>
              <div><label className="label">Quantidade</label><input type="number" min="1" className="input" value={form.quantidade||1} onChange={f('quantidade')} /></div>
            </>}

            {/* Sócio */}
            <div>
              <label className="label">Sócio investidor</label>
              <select className="select" value={form.socio_id||''} onChange={f('socio_id')}>
                <option value="">Nenhum</option>
                {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            {form.socio_id && (
              <div>
                <label className="label">Valor investido pelo sócio (R$)</label>
                <input type="number" step="0.01" className="input" value={form.valor_investimento_socio||0} onChange={f('valor_investimento_socio')} />
              </div>
            )}

            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea className="input h-20 resize-none" value={form.notas||''} onChange={f('notas')} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
