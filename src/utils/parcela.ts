import { parseISO, isAfter, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';
import { Parcela } from '../types';

export function calcularStatusParcela(p: Parcela): Parcela['status'] {
  if (p.status === 'Paga' || p.data_pagamento) return 'Paga';
  const today = startOfDay(new Date());
  const venc = startOfDay(parseISO(p.data_vencimento));
  const diff = differenceInDays(venc, today);
  if (diff < 0 && Math.abs(diff) > 30) return 'Bloqueio recomendado';
  if (diff < 0) return 'Atrasada';
  if (diff === 0) return 'Vence hoje';
  if (diff === 1) return 'Vence amanhã';
  return 'Em aberto';
}

export function enriquecerParcelas(parcelas: Parcela[]): Parcela[] {
  return parcelas.map(p => ({
    ...p,
    status: calcularStatusParcela(p),
  }));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = parseISO(dateStr);
  return d.toLocaleDateString('pt-BR');
}
