import { ItemStatus } from '../types';

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Em estoque':         { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Reservado':          { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  'Vendido':            { bg: 'bg-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-400' },
  'Quitado':            { bg: 'bg-teal-500/10',    text: 'text-teal-400',    dot: 'bg-teal-400' },
  'Bloqueado':          { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  'Retomado':           { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  'Cancelado':          { bg: 'bg-slate-700/50',   text: 'text-slate-400',   dot: 'bg-slate-400' },
  'Ativa':              { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Quitada':            { bg: 'bg-teal-500/10',    text: 'text-teal-400',    dot: 'bg-teal-400' },
  'Paga':               { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Em aberto':          { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  'Atrasada':           { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  'Vencida':            { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  'Vence hoje':         { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  'Vence amanhã':       { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  'Bloqueio recomendado': { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Ativo':              { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  'Resolvido':          { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { bg: 'bg-slate-700/50', text: 'text-slate-400', dot: 'bg-slate-400' };
  return (
    <span className={`badge ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}
