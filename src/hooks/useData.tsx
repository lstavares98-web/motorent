import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Item, Venda, Parcela, Manutencao, Bloqueio, Socio, Usuario, PagamentoSocio } from '../types';
import { addDays, addWeeks, addMonths } from 'date-fns';

interface DataContextType {
  clientes: Cliente[];
  itens: Item[];
  vendas: Venda[];
  parcelas: Parcela[];
  manutencoes: Manutencao[];
  bloqueios: Bloqueio[];
  socios: Socio[];
  usuarios: Usuario[];
  pagamentosSocios: PagamentoSocio[];
  loading: boolean;
  refresh: () => Promise<void>;
  // Clientes
  addCliente: (c: Omit<Cliente, 'id' | 'created_at'>) => Promise<void>;
  updateCliente: (id: string, c: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  // Itens
  addItem: (i: Omit<Item, 'id' | 'created_at'>) => Promise<void>;
  updateItem: (id: string, i: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Vendas
  addVenda: (v: Omit<Venda, 'id' | 'created_at'>) => Promise<void>;
  updateVenda: (id: string, v: Partial<Venda>) => Promise<void>;
  // Parcelas
  pagarParcela: (id: string, data_pagamento: string, pago_por: string, forma_pagamento: string) => Promise<void>;
  // Manutenções
  addManutencao: (m: Omit<Manutencao, 'id' | 'created_at'>) => Promise<void>;
  deleteManutencao: (id: string) => Promise<void>;
  // Bloqueios
  addBloqueio: (b: Omit<Bloqueio, 'id' | 'created_at'>) => Promise<void>;
  resolverBloqueio: (id: string) => Promise<void>;
  // Sócios
  addSocio: (s: Omit<Socio, 'id' | 'created_at'>) => Promise<void>;
  updateSocio: (id: string, s: Partial<Socio>) => Promise<void>;
  deleteSocio: (id: string) => Promise<void>;
  // Usuários
  addUsuario: (u: Omit<Usuario, 'id' | 'created_at'> & { senha_hash: string }) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  // Pagamentos sócios
  addPagamentoSocio: (p: Omit<PagamentoSocio, 'id' | 'created_at'>) => Promise<void>;
  deletePagamentoSocio: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagamentosSocios, setPagamentosSocios] = useState<PagamentoSocio[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: cli }, { data: its }, { data: vnd }, { data: par },
        { data: man }, { data: blo }, { data: soc }, { data: usr }, { data: pgs }
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        supabase.from('itens').select('*').order('created_at', { ascending: false }),
        supabase.from('vendas').select('*').order('created_at', { ascending: false }),
        supabase.from('parcelas').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('manutencoes').select('*').order('data', { ascending: false }),
        supabase.from('bloqueios').select('*').order('created_at', { ascending: false }),
        supabase.from('socios').select('*').order('nome'),
        supabase.from('usuarios').select('*').order('nome'),
        supabase.from('pagamentos_socios').select('*').order('data', { ascending: false }),
      ]);
      setClientes((cli as Cliente[]) ?? []);
      setItens((its as Item[]) ?? []);
      setVendas((vnd as Venda[]) ?? []);
      setParcelas((par as Parcela[]) ?? []);
      setManutencoes((man as Manutencao[]) ?? []);
      setBloqueios((blo as Bloqueio[]) ?? []);
      setSocios((soc as Socio[]) ?? []);
      setUsuarios((usr as Usuario[]) ?? []);
      setPagamentosSocios((pgs as PagamentoSocio[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ---- CLIENTES ----
  const addCliente = async (c: Omit<Cliente, 'id' | 'created_at'>) => {
    await supabase.from('clientes').insert(c);
    await refresh();
  };
  const updateCliente = async (id: string, c: Partial<Cliente>) => {
    await supabase.from('clientes').update(c).eq('id', id);
    await refresh();
  };
  const deleteCliente = async (id: string) => {
    await supabase.from('clientes').delete().eq('id', id);
    await refresh();
  };

  // ---- ITENS ----
  const addItem = async (i: Omit<Item, 'id' | 'created_at'>) => {
    await supabase.from('itens').insert(i);
    await refresh();
  };
  const updateItem = async (id: string, i: Partial<Item>) => {
    await supabase.from('itens').update(i).eq('id', id);
    await refresh();
  };
  const deleteItem = async (id: string) => {
    await supabase.from('itens').delete().eq('id', id);
    await refresh();
  };

  // ---- VENDAS ----
  const addVenda = async (v: Omit<Venda, 'id' | 'created_at'>) => {
    const { data: vendaData, error } = await supabase.from('vendas').insert(v).select().single();
    if (error || !vendaData) throw error;

    // Gerar parcelas automaticamente
    const valorFinanciado = v.valor_venda - v.valor_entrada;
    const totalComJuros = valorFinanciado * (1 + v.taxa_juros / 100);
    const valorParcela = Number((totalComJuros / v.numero_parcelas).toFixed(2));

    const parcelasGeradas: Omit<Parcela, 'id' | 'created_at'>[] = [];
    let dataBase = new Date(v.data_primeiro_vencimento + 'T12:00:00');

    for (let i = 0; i < v.numero_parcelas; i++) {
      let dataVenc = dataBase;
      if (i > 0) {
        if (v.frequencia === 'Semanal') dataVenc = addWeeks(dataBase, i);
        else if (v.frequencia === 'Quinzenal') dataVenc = addDays(dataBase, i * 15);
        else dataVenc = addMonths(dataBase, i);
      }
      parcelasGeradas.push({
        venda_id: vendaData.id,
        cliente_id: v.cliente_id,
        numero: i + 1,
        data_vencimento: dataVenc.toISOString().split('T')[0],
        valor: valorParcela,
        status: 'Em aberto',
      });
    }

    await supabase.from('parcelas').insert(parcelasGeradas);
    await supabase.from('itens').update({ status: 'Vendido' }).eq('id', v.item_id);
    await refresh();
  };

  const updateVenda = async (id: string, v: Partial<Venda>) => {
    await supabase.from('vendas').update(v).eq('id', id);
    await refresh();
  };

  // ---- PARCELAS ----
  const pagarParcela = async (id: string, data_pagamento: string, pago_por: string, forma_pagamento: string) => {
    await supabase.from('parcelas').update({
      status: 'Paga',
      data_pagamento,
      pago_por,
      forma_pagamento,
    }).eq('id', id);

    // Verificar se todas as parcelas da venda foram pagas
    const parcela = parcelas.find(p => p.id === id);
    if (parcela) {
      const parcelasVenda = parcelas.filter(p => p.venda_id === parcela.venda_id);
      const todasPagas = parcelasVenda.every(p => p.id === id || p.status === 'Paga');
      if (todasPagas) {
        await supabase.from('vendas').update({ status: 'Quitada' }).eq('id', parcela.venda_id);
        const venda = vendas.find(v => v.id === parcela.venda_id);
        if (venda) await supabase.from('itens').update({ status: 'Quitado' }).eq('id', venda.item_id);
      }
    }
    await refresh();
  };

  // ---- MANUTENÇÕES ----
  const addManutencao = async (m: Omit<Manutencao, 'id' | 'created_at'>) => {
    await supabase.from('manutencoes').insert(m);
    await refresh();
  };
  const deleteManutencao = async (id: string) => {
    await supabase.from('manutencoes').delete().eq('id', id);
    await refresh();
  };

  // ---- BLOQUEIOS ----
  const addBloqueio = async (b: Omit<Bloqueio, 'id' | 'created_at'>) => {
    await supabase.from('bloqueios').insert(b);
    await supabase.from('itens').update({ status: 'Bloqueado' }).eq('id', b.item_id);
    await refresh();
  };
  const resolverBloqueio = async (id: string) => {
    const b = bloqueios.find(x => x.id === id);
    await supabase.from('bloqueios').update({ status: 'Resolvido' }).eq('id', id);
    if (b) await supabase.from('itens').update({ status: 'Vendido' }).eq('id', b.item_id);
    await refresh();
  };

  // ---- SÓCIOS ----
  const addSocio = async (s: Omit<Socio, 'id' | 'created_at'>) => {
    await supabase.from('socios').insert(s);
    await refresh();
  };
  const updateSocio = async (id: string, s: Partial<Socio>) => {
    await supabase.from('socios').update(s).eq('id', id);
    await refresh();
  };
  const deleteSocio = async (id: string) => {
    await supabase.from('socios').delete().eq('id', id);
    await refresh();
  };

  // ---- USUÁRIOS ----
  const addUsuario = async (u: Omit<Usuario, 'id' | 'created_at'> & { senha_hash: string }) => {
    await supabase.from('usuarios').insert(u);
    await refresh();
  };
  const deleteUsuario = async (id: string) => {
    await supabase.from('usuarios').delete().eq('id', id);
    await refresh();
  };

  // ---- PAGAMENTOS SÓCIOS ----
  const addPagamentoSocio = async (p: Omit<PagamentoSocio, 'id' | 'created_at'>) => {
    await supabase.from('pagamentos_socios').insert(p);
    await refresh();
  };
  const deletePagamentoSocio = async (id: string) => {
    await supabase.from('pagamentos_socios').delete().eq('id', id);
    await refresh();
  };

  return (
    <DataContext.Provider value={{
      clientes, itens, vendas, parcelas, manutencoes, bloqueios,
      socios, usuarios, pagamentosSocios, loading, refresh,
      addCliente, updateCliente, deleteCliente,
      addItem, updateItem, deleteItem,
      addVenda, updateVenda,
      pagarParcela,
      addManutencao, deleteManutencao,
      addBloqueio, resolverBloqueio,
      addSocio, updateSocio, deleteSocio,
      addUsuario, deleteUsuario,
      addPagamentoSocio, deletePagamentoSocio,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
