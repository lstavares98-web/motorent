import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { useData } from '../hooks/useData';
import { enriquecerParcelas, formatCurrency } from '../utils/parcela';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear, format } from 'date-fns';
import { MotoItem } from '../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function Relatorios() {
  const { parcelas: raw, manutencoes, itens, vendas, clientes } = useData();
  const parcelas = useMemo(() => enriquecerParcelas(raw), [raw]);
  const [periodoMeses, setPeriodoMeses] = useState(12);

  const now = new Date();

  // Recebimentos mensais
  const recebimentosMensais = useMemo(() => {
    return Array.from({ length: periodoMeses }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (periodoMeses - 1 - i), 1);
      const inicio = startOfMonth(d);
      const fim = endOfMonth(d);
      const recebido = parcelas.filter(p =>
        p.status === 'Paga' && p.data_pagamento &&
        isWithinInterval(parseISO(p.data_pagamento), { start: inicio, end: fim })
      ).reduce((s, p) => s + p.valor, 0);
      const custo = manutencoes.filter(m =>
        m.pago_por === 'MotoRent' && isWithinInterval(parseISO(m.data), { start: inicio, end: fim })
      ).reduce((s, m) => s + m.valor, 0);
      return {
        mes: `${MONTH_NAMES[getMonth(d)]}/${String(getYear(d)).slice(2)}`,
        recebido,
        custo,
        lucro: recebido - custo,
      };
    });
  }, [parcelas, manutencoes, periodoMeses]);

  // Custo por moto
  const custoPorMoto = useMemo(() => {
    const motos = itens.filter(i => i.tipo === 'Moto') as MotoItem[];
    return motos.map(m => {
      const custo = manutencoes.filter(x => x.item_id === m.id).reduce((s, x) => s + x.valor, 0);
      const recebido = (() => {
        const venda = vendas.find(v => v.item_id === m.id);
        if (!venda) return 0;
        return parcelas.filter(p => p.venda_id === venda.id && p.status === 'Paga').reduce((s, p) => s + p.valor, 0);
      })();
      return { nome: `${m.marca} ${m.modelo}`, custo, recebido, lucro: recebido - custo };
    }).filter(x => x.custo > 0 || x.recebido > 0).sort((a, b) => b.lucro - a.lucro);
  }, [itens, manutencoes, vendas, parcelas]);

  // Totais gerais
  const totais = useMemo(() => {
    const recebidoTotal = parcelas.filter(p => p.status === 'Paga').reduce((s, p) => s + p.valor, 0);
    const custoTotal = manutencoes.filter(m => m.pago_por === 'MotoRent').reduce((s, m) => s + m.valor, 0);
    const aReceberTotal = parcelas.filter(p => p.status !== 'Paga').reduce((s, p) => s + p.valor, 0);
    const investimentoTotal = itens.reduce((s, i) => s + i.valor_compra, 0);
    return { recebidoTotal, custoTotal, aReceberTotal, investimentoTotal, lucroLiquido: recebidoTotal - custoTotal };
  }, [parcelas, manutencoes, itens]);

  // Top clientes
  const topClientes = useMemo(() => {
    return clientes.map(c => {
      const valor = parcelas.filter(p => p.cliente_id === c.id && p.status === 'Paga').reduce((s, p) => s + p.valor, 0);
      return { nome: c.nome, valor };
    }).filter(x => x.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [clientes, parcelas]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Visão financeira consolidada</p>
        </div>
        <select className="select w-40" value={periodoMeses} onChange={e => setPeriodoMeses(Number(e.target.value))}>
          <option value={3}>Últimos 3 meses</option>
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Recebido', value: formatCurrency(totais.recebidoTotal), color: 'text-emerald-400', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'A Receber', value: formatCurrency(totais.aReceberTotal), color: 'text-blue-400', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Custo Manutenção', value: formatCurrency(totais.custoTotal), color: 'text-red-400', icon: <TrendingDown className="w-4 h-4" /> },
          { label: 'Lucro Líquido', value: formatCurrency(totais.lucroLiquido), color: totais.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Investimento Total', value: formatCurrency(totais.investimentoTotal), color: 'text-violet-400', icon: <DollarSign className="w-4 h-4" /> },
        ].map(k => (
          <div key={k.label} className="card-sm">
            <div className={`flex items-center gap-1.5 ${k.color} mb-1`}>{k.icon}<span className="text-xs font-medium">{k.label}</span></div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico Linha — Evolução Mensal */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Evolução Financeira Mensal</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={recebimentosMensais}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
              formatter={(v: number, name: string) => [formatCurrency(v),
                name === 'recebido' ? 'Recebido' : name === 'custo' ? 'Custo' : 'Lucro']}
            />
            <Legend formatter={(v) => v === 'recebido' ? 'Recebido' : v === 'custo' ? 'Custo' : 'Lucro'}
              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="recebido" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="custo" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custo por Moto */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Performance por Moto</h3>
          {custoPorMoto.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={custoPorMoto.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  formatter={(v: number) => [formatCurrency(v)]}
                />
                <Bar dataKey="recebido" fill="#f97316" radius={[0,4,4,0]} />
                <Bar dataKey="custo" fill="#ef4444" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Sem dados suficientes</div>
          )}
        </div>

        {/* Top Clientes */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Clientes por Receita</h3>
          {topClientes.length > 0 ? (
            <div className="space-y-3">
              {topClientes.map((c, i) => {
                const max = topClientes[0].valor;
                return (
                  <div key={c.nome} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600 w-4">#{i + 1}</span>
                        <span className="text-sm text-slate-300">{c.nome}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(c.valor)}</span>
                    </div>
                    <div className="bg-slate-800 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(c.valor / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Tabela Mensal */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300">Resumo Mensal</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Mês</th>
              <th className="table-header">Recebido</th>
              <th className="table-header">Custo</th>
              <th className="table-header">Lucro</th>
              <th className="table-header">Margem</th>
            </tr>
          </thead>
          <tbody>
            {recebimentosMensais.slice().reverse().map(m => {
              const margem = m.recebido > 0 ? ((m.lucro / m.recebido) * 100).toFixed(1) : '0.0';
              return (
                <tr key={m.mes} className="hover:bg-slate-800/30">
                  <td className="table-cell font-medium">{m.mes}</td>
                  <td className="table-cell text-emerald-400 font-medium">{formatCurrency(m.recebido)}</td>
                  <td className="table-cell text-red-400 font-medium">{formatCurrency(m.custo)}</td>
                  <td className={`table-cell font-semibold ${m.lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(m.lucro)}
                  </td>
                  <td className="table-cell text-sm text-slate-400">{margem}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
