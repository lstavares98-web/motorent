export type ItemStatus = 'Em estoque' | 'Reservado' | 'Vendido' | 'Quitado' | 'Bloqueado' | 'Retomado' | 'Cancelado';
export type ItemType = 'Moto' | 'Telemóvel' | 'Material';

export interface BaseItem {
  id: string;
  tipo: ItemType;
  status: ItemStatus;
  valor_compra: number;
  valor_venda_previsto: number;
  notas: string;
  socio_id?: string;
  valor_investimento_socio?: number;
  percentual_socio?: number;
  created_at?: string;
}

export interface MotoItem extends BaseItem {
  tipo: 'Moto';
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  condicao: 'Zero' | 'Usado';
  placa: string;
  km_entrada: number;
  valor_seguro: number;
  valor_bloqueador: number;
  valor_documento?: number;
  numero_rastreador: string;
  data_ultima_revisao?: string;
  data_proxima_revisao?: string;
}

export interface TelemovelItem extends BaseItem {
  tipo: 'Telemóvel';
  marca: string;
  modelo: string;
  cor: string;
  condicao: 'Zero' | 'Usado';
  armazenamento: string;
  numero_serie: string;
  imei: string;
}

export interface MaterialItem extends BaseItem {
  tipo: 'Material';
  nome: string;
  quantidade: number;
}

export type Item = MotoItem | TelemovelItem | MaterialItem;

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  notas: string;
  data_cadastro: string;
  created_at?: string;
}

export interface Parcela {
  id: string;
  venda_id: string;
  cliente_id: string;
  numero: number;
  data_vencimento: string;
  valor: number;
  status: 'Paga' | 'Em aberto' | 'Atrasada' | 'Bloqueio recomendado' | 'Vence amanhã' | 'Vence hoje' | 'Vencida';
  data_pagamento?: string;
  pago_por?: string;
  forma_pagamento?: string;
  created_at?: string;
}

export interface Venda {
  id: string;
  numero_contrato?: string;
  cliente_id: string;
  item_id: string;
  valor_venda: number;
  valor_entrada: number;
  entrada_paga?: boolean;
  data_entrada_agendada?: string;
  taxa_juros: number;
  numero_parcelas: number;
  frequencia: 'Semanal' | 'Quinzenal' | 'Mensal';
  data_primeiro_vencimento: string;
  parceiro?: string;
  investimento_parceiro?: number;
  avalista_nome?: string;
  avalista_cpf?: string;
  avalista_telefone?: string;
  data_venda: string;
  status: 'Ativa' | 'Quitada' | 'Cancelada';
  created_at?: string;
}

export interface Manutencao {
  id: string;
  item_id: string;
  data: string;
  descricao: string;
  km?: number;
  valor: number;
  pago_por: 'MotoRent' | 'Cliente';
  desconta_lucro: boolean;
  notas: string;
  created_at?: string;
}

export interface Bloqueio {
  id: string;
  item_id: string;
  cliente_id: string;
  venda_id: string;
  data_bloqueio: string;
  parcela_mais_antiga_id: string;
  status: 'Ativo' | 'Resolvido';
  created_at?: string;
}

export interface Socio {
  id: string;
  nome: string;
  telefone: string;
  created_at?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'Admin' | 'Visualizador';
  created_at?: string;
}

export interface PagamentoSocio {
  id: string;
  socio_id: string;
  valor: number;
  data: string;
  notas?: string;
  created_at?: string;
}

export interface MotoRentData {
  clientes: Cliente[];
  itens: Item[];
  vendas: Venda[];
  parcelas: Parcela[];
  manutencoes: Manutencao[];
  bloqueios: Bloqueio[];
  socios: Socio[];
  usuarios: Usuario[];
  pagamentos_socios: PagamentoSocio[];
}
