import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Bike, Users, CreditCard, TrendingUp, AlertTriangle, ShieldOff, Wrench, DollarSign } from 'lucide-react';
import { useData } from '../hooks/useData';
import { enriquecerParcelas, formatCurrency } from '../utils/parcela';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth } from 'date-fns';

function KpiCard({ label, value, sub, icon, color, onClick }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  color: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`card flex items-start gap-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function Dashboard() {
  const { itens, clientes, parcelas: rawParcelas, vendas, manutencoes, bloqueios } = useData();
  const parcelas = useMemo(() => enriquecerParcelas(rawParcelas), [rawParcelas]);

  const now = new Date();
  const mesAtual = { start: startOfMonth(now), end: endOfMonth(now) };

  const kpis = useMemo(() => {
    const motos = itens.filter(i => i.tipo === 'Moto');
    const emEstoque = motos.filter(i => i.status === 'Em estoque').length;
    const emUso = motos.filter(i => i.status === 'Vendido').length;
    const bloqueados = motos.filter(i => i.status === 'Bloqueado').length;

    const parcelasAtrasadas = parcelas.filter(p => p.status === 'Atrasada' || p.status === 'Vencida' || p.status === 'Bloqueio recomendado').length;
    const venceHoje = parcelas.filter(p => p.status === 'Vence hoje').length;

    const receitaMes = parcelas.filter(p => {
      if (p.status !== 'Paga' || !p.data_pagamento) return false;
      return isWithinInterval(parseISO(p.data_pagamento), mesAtual);
    }).reduce((sum, p) => sum + p.valor, 0);

    const custoManutMes = manutencoes.filter(m => {
      return isWithinInterval(parseISO(m.data), mesAtual) && m.pago_por === 'MotoRent';
    }).reduce((sum, m) => sum + m.valor, 0);

    const bloqueiosAtivos = bloqueios.filter(b => b.status === 'Ativo').length;

    return { emEstoque, emUso, bloqueados, parcelasAtrasadas, venceHoje, receitaMes, custoManutMes, bloqueiosAtivos };
  }, [itens, parcelas, manutencoes, bloqueios]);

  // Gráfico: recebimentos últimos 6 meses
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const inicio = startOfMonth(d);
      const fim = endOfMonth(d);
      const recebido = parcelas.filter(p =>
        p.status === 'Paga' && p.data_pagamento &&
        isWithinInterval(parseISO(p.data_pagamento), { start: inicio, end: fim })
      ).reduce((s, p) => s + p.valor, 0);
      const custo = manutencoes.filter(m =>
        m.pago_por === 'MotoRent' && isWithinInterval(parseISO(m.data), { start: inicio, end: fim })
      ).reduce((s, m) => s + m.valor, 0);
      return { mes: MONTH_NAMES[getMonth(d)], recebido, custo, lucro: recebido - custo };
    });
  }, [parcelas, manutencoes]);

  // Status das motos
  const pieData = useMemo(() => {
    const motos = itens.filter(i => i.tipo === 'Moto');
    const counts: Record<string, number> = {};
    motos.forEach(m => { counts[m.status] = (counts[m.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [itens]);

  const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#6b7280'];

  const alertasParcelas = parcelas.filter(p =>
    ['Atrasada','Vencida','Bloqueio recomendado','Vence hoje','Vence amanhã'].includes(p.status)
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Motos em Estoque"
          value={String(kpis.emEstoque)}
          sub={`${kpis.emUso} em uso`}
          icon={<Bike className="w-5 h-5 text-emerald-400" />}
          color="bg-emerald-500/10"
        />
        <KpiCard
          label="Clientes Ativos"
          value={String(clientes.length)}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/10"
        />
        <KpiCard
          label="Receita do Mês"
          value={formatCurrency(kpis.receitaMes)}
          sub={`Custo: ${formatCurrency(kpis.custoManutMes)}`}
          icon={<DollarSign className="w-5 h-5 text-orange-400" />}
          color="bg-orange-500/10"
        />
        <KpiCard
          label="Contratos Ativos"
          value={String(vendas.filter(v => v.status === 'Ativa').length)}
          sub={`${vendas.filter(v => v.status === 'Quitada').length} quitados`}
          icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
          color="bg-violet-500/10"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Parcelas Atrasadas"
          value={String(kpis.parcelasAtrasadas)}
          sub={`${kpis.venceHoje} vencem hoje`}
          icon={<CreditCard className="w-5 h-5 text-red-400" />}
          color="bg-red-500/10"
        />
        <KpiCard
          label="Bloqueios Ativos"
          value={String(kpis.bloqueiosAtivos)}
          icon={<ShieldOff className="w-5 h-5 text-red-400" />}
          color="bg-red-500/10"
        />
        <KpiCard
          label="Motos Bloqueadas"
          value={String(kpis.bloqueados)}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500/10"
        />
        <KpiCard
          label="Manutenções (Mês)"
          value={formatCurrency(kpis.custoManutMes)}
          sub="Custo MotoRent"
          icon={<Wrench className="w-5 h-5 text-teal-400" />}
          color="bg-teal-500/10"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recebimentos */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Recebimentos x Custos (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: number, name: string) => [formatCurrency(v), name === 'recebido' ? 'Recebido' : name === 'custo' ? 'Custo' : 'Lucro']}
              />
              <Bar dataKey="recebido" fill="#f97316" radius={[4,4,0,0]} />
              <Bar dataKey="custo" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="lucro" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {[{c:'bg-orange-500',l:'Recebido'},{c:'bg-red-500',l:'Custo'},{c:'bg-emerald-500',l:'Lucro'}].map(x=>(
              <div key={x.l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${x.c}`}/>
                <span className="text-xs text-slate-500">{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Status do Estoque</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alertasParcelas.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alertas de Parcelas
          </h3>
          <div className="space-y-2">
            {alertasParcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    p.status === 'Bloqueio recomendado' ? 'bg-orange-400' :
                    p.status === 'Vence hoje' ? 'bg-amber-400' :
                    p.status === 'Vence amanhã' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm text-slate-300">Parcela #{p.numero}</span>
                  <span className="text-xs text-slate-500">Venc: {new Date(p.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-200">{formatCurrency(p.valor)}</span>
                  <span className={`badge text-xs ${
                    p.status === 'Bloqueio recomendado' ? 'bg-orange-500/10 text-orange-400' :
                    p.status === 'Vence hoje' ? 'bg-amber-500/10 text-amber-400' :
                    p.status === 'Vence amanhã' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
