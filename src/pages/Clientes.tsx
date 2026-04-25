import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, User, Phone, MapPin, FileText } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { Cliente } from '../types';
import { format } from 'date-fns';

const empty: Omit<Cliente, 'id' | 'created_at'> = {
  nome: '', cpf: '', telefone: '', endereco: '', notas: '',
  data_cadastro: new Date().toISOString().split('T')[0],
};

export function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, vendas, parcelas } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() =>
    clientes.filter(c =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      c.telefone.includes(search)
    ), [clientes, search]);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (c: Cliente) => { setSelected(c); setForm({ nome: c.nome, cpf: c.cpf, telefone: c.telefone, endereco: c.endereco, notas: c.notas, data_cadastro: c.data_cadastro }); setModal('edit'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modal === 'add') await addCliente(form);
      else if (modal === 'edit' && selected) await updateCliente(selected.id, form);
      setModal(null);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    await deleteCliente(id);
  };

  const getClienteStats = (clienteId: string) => {
    const vendasCliente = vendas.filter(v => v.cliente_id === clienteId && v.status === 'Ativa');
    const parcelasAbertas = parcelas.filter(p => p.cliente_id === clienteId && p.status !== 'Paga').length;
    return { contratos: vendasCliente.length, parcelasAbertas };
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes cadastrados</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input pl-10"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">CPF</th>
              <th className="table-header">Telefone</th>
              <th className="table-header">Cadastro</th>
              <th className="table-header">Contratos</th>
              <th className="table-header">Parcelas Abertas</th>
              <th className="table-header w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-600">Nenhum cliente encontrado</td></tr>
            ) : filtered.map((c, i) => {
              const stats = getClienteStats(c.id);
              return (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{c.nome}</p>
                        {c.endereco && <p className="text-xs text-slate-500 truncate max-w-[200px]">{c.endereco}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{c.cpf || '—'}</td>
                  <td className="table-cell">{c.telefone || '—'}</td>
                  <td className="table-cell text-xs">{c.data_cadastro ? new Date(c.data_cadastro + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${stats.contratos > 0 ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {stats.contratos}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${stats.parcelasAbertas > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {stats.parcelasAbertas}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 text-slate-400 hover:text-blue-400">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn-ghost p-1.5 text-slate-400 hover:text-red-400">
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
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Novo Cliente' : 'Editar Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome completo *</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="label">CPF</label>
              <input className="input" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div className="col-span-2">
              <label className="label">Endereço</label>
              <input className="input" value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea className="input h-20 resize-none" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
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
