import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, UserPlus, DollarSign, Settings } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { Socio, PagamentoSocio } from '../types';
import { formatCurrency, formatDate } from '../utils/parcela';

export function Configuracoes() {
  const {
    socios, addSocio, deleteSocio, pagamentosSocios, addPagamentoSocio, deletePagamentoSocio,
    usuarios, addUsuario, deleteUsuario,
  } = useData();

  const [tab, setTab] = useState<'socios' | 'usuarios'>('socios');
  const [modalSocio, setModalSocio] = useState(false);
  const [modalPag, setModalPag] = useState<Socio | null>(null);
  const [modalUser, setModalUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formSocio, setFormSocio] = useState({ nome: '', telefone: '' });
  const [formPag, setFormPag] = useState({ valor: 0, data: new Date().toISOString().split('T')[0], notas: '' });
  const [formUser, setFormUser] = useState<{ nome: string; email: string; senha_hash: string; role: 'Admin' | 'Visualizador' }>({ nome: '', email: '', senha_hash: '', role: 'Admin' });

  const handleAddSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await addSocio(formSocio); setModalSocio(false); setFormSocio({ nome: '', telefone: '' }); }
    finally { setLoading(false); }
  };

  const handleAddPag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPag) return;
    setLoading(true);
    try {
      await addPagamentoSocio({ ...formPag, socio_id: modalPag.id });
      setModalPag(null);
    } finally { setLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await addUsuario(formUser); setModalUser(false); setFormUser({ nome: '', email: '', senha_hash: '', role: 'Admin' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Sócios, usuários e dados do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(['socios', 'usuarios'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'socios' ? 'Sócios' : 'Usuários'}
          </button>
        ))}
      </div>

      {/* Sócios */}
      {tab === 'socios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModalSocio(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Novo Sócio
            </button>
          </div>

          {socios.length === 0 ? (
            <div className="card text-center py-16">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">Nenhum sócio cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {socios.map(s => {
                const pagamentos = pagamentosSocios.filter(p => p.socio_id === s.id);
                const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
                return (
                  <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{s.nome}</p>
                        <p className="text-sm text-slate-500">{s.telefone || '—'}</p>
                      </div>
                      <button onClick={() => { if(confirm('Excluir sócio?')) deleteSocio(s.id); }}
                        className="btn-ghost p-1.5 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500">Total pago ao sócio</span>
                      <span className="text-sm font-bold text-orange-400">{formatCurrency(totalPago)}</span>
                    </div>
                    <button onClick={() => { setModalPag(s); setFormPag({ valor: 0, data: new Date().toISOString().split('T')[0], notas: '' }); }}
                      className="btn-secondary w-full justify-center">
                      <DollarSign className="w-4 h-4" /> Registrar Pagamento
                    </button>
                    {pagamentos.length > 0 && (
                      <div className="space-y-1">
                        {pagamentos.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs text-slate-500">
                            <span>{formatDate(p.data)} {p.notas && `· ${p.notas}`}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">{formatCurrency(p.valor)}</span>
                              <button onClick={() => deletePagamentoSocio(p.id)} className="hover:text-red-400 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Usuários */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModalUser(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Novo Usuário
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nome</th>
                  <th className="table-header">E-mail</th>
                  <th className="table-header">Perfil</th>
                  <th className="table-header w-16">Del.</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="table-cell font-medium text-slate-200">{u.nome}</td>
                    <td className="table-cell text-sm text-slate-400">{u.email}</td>
                    <td className="table-cell">
                      <span className={`badge ${u.role === 'Admin' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-700/50 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button onClick={() => { if(confirm('Excluir usuário?')) deleteUsuario(u.id); }}
                        className="btn-ghost p-1.5 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Sócio */}
      <Modal open={modalSocio} onClose={() => setModalSocio(false)} title="Novo Sócio" size="sm">
        <form onSubmit={handleAddSocio} className="space-y-4">
          <div><label className="label">Nome *</label><input className="input" value={formSocio.nome} onChange={e => setFormSocio(f => ({ ...f, nome: e.target.value }))} required /></div>
          <div><label className="label">Telefone</label><input className="input" value={formSocio.telefone} onChange={e => setFormSocio(f => ({ ...f, telefone: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalSocio(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Pagamento Sócio */}
      <Modal open={!!modalPag} onClose={() => setModalPag(null)} title={`Pagamento — ${modalPag?.nome}`} size="sm">
        <form onSubmit={handleAddPag} className="space-y-4">
          <div><label className="label">Valor (R$) *</label><input type="number" step="0.01" min="0" className="input" value={formPag.valor} onChange={e => setFormPag(f => ({ ...f, valor: Number(e.target.value) }))} required /></div>
          <div><label className="label">Data *</label><input type="date" className="input" value={formPag.data} onChange={e => setFormPag(f => ({ ...f, data: e.target.value }))} required /></div>
          <div><label className="label">Notas</label><input className="input" value={formPag.notas} onChange={e => setFormPag(f => ({ ...f, notas: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalPag(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Usuário */}
      <Modal open={modalUser} onClose={() => setModalUser(false)} title="Novo Usuário" size="sm">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div><label className="label">Nome *</label><input className="input" value={formUser.nome} onChange={e => setFormUser(f => ({ ...f, nome: e.target.value }))} required /></div>
          <div><label className="label">E-mail *</label><input type="email" className="input" value={formUser.email} onChange={e => setFormUser(f => ({ ...f, email: e.target.value }))} required /></div>
          <div><label className="label">Senha *</label><input type="password" className="input" value={formUser.senha_hash} onChange={e => setFormUser(f => ({ ...f, senha_hash: e.target.value }))} required /></div>
          <div>
            <label className="label">Perfil</label>
            <select className="select" value={formUser.role} onChange={e => setFormUser(f => ({ ...f, role: e.target.value as 'Admin' | 'Visualizador' }))}>
              <option value="Admin">Admin</option>
              <option value="Visualizador">Visualizador</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalUser(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
