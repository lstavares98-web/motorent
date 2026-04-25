-- ============================================================
-- MOTORENT — Schema Supabase
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: socios
-- ============================================================
create table if not exists public.socios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  telefone text,
  endereco text,
  notas text default '',
  data_cadastro date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: itens (motos, telemóveis, materiais)
-- ============================================================
create table if not exists public.itens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Moto', 'Telemóvel', 'Material')),
  status text not null default 'Em estoque' check (status in ('Em estoque','Reservado','Vendido','Quitado','Bloqueado','Retomado','Cancelado')),
  valor_compra numeric(12,2) not null default 0,
  valor_venda_previsto numeric(12,2) not null default 0,
  notas text default '',
  socio_id uuid references public.socios(id) on delete set null,
  valor_investimento_socio numeric(12,2),
  percentual_socio numeric(5,2),
  -- Moto
  marca text,
  modelo text,
  ano int,
  cor text,
  condicao text check (condicao in ('Zero','Usado')),
  placa text,
  km_entrada int default 0,
  valor_seguro numeric(12,2) default 0,
  valor_bloqueador numeric(12,2) default 0,
  valor_documento numeric(12,2) default 0,
  numero_rastreador text,
  data_ultima_revisao date,
  data_proxima_revisao date,
  -- Telemóvel
  armazenamento text,
  numero_serie text,
  imei text,
  -- Material
  nome text,
  quantidade int default 1,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: vendas (contratos)
-- ============================================================
create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  numero_contrato text unique,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  item_id uuid not null references public.itens(id) on delete restrict,
  valor_venda numeric(12,2) not null,
  valor_entrada numeric(12,2) not null default 0,
  entrada_paga boolean default false,
  data_entrada_agendada date,
  taxa_juros numeric(5,2) not null default 0,
  numero_parcelas int not null,
  frequencia text not null check (frequencia in ('Semanal','Quinzenal','Mensal')),
  data_primeiro_vencimento date not null,
  parceiro text,
  investimento_parceiro numeric(12,2),
  avalista_nome text,
  avalista_cpf text,
  avalista_telefone text,
  data_venda date not null default current_date,
  status text not null default 'Ativa' check (status in ('Ativa','Quitada','Cancelada')),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: parcelas
-- ============================================================
create table if not exists public.parcelas (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  numero int not null,
  data_vencimento date not null,
  valor numeric(12,2) not null,
  status text not null default 'Em aberto',
  data_pagamento date,
  pago_por text,
  forma_pagamento text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: manutencoes
-- ============================================================
create table if not exists public.manutencoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens(id) on delete cascade,
  data date not null default current_date,
  descricao text not null,
  km int,
  valor numeric(12,2) not null default 0,
  pago_por text not null check (pago_por in ('MotoRent','Cliente')),
  desconta_lucro boolean default true,
  notas text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: bloqueios
-- ============================================================
create table if not exists public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  venda_id uuid not null references public.vendas(id) on delete cascade,
  data_bloqueio date not null default current_date,
  parcela_mais_antiga_id uuid references public.parcelas(id) on delete set null,
  status text not null default 'Ativo' check (status in ('Ativo','Resolvido')),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: usuarios
-- ============================================================
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  role text not null default 'Admin' check (role in ('Admin','Visualizador')),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: pagamentos_socios
-- ============================================================
create table if not exists public.pagamentos_socios (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  valor numeric(12,2) not null,
  data date not null default current_date,
  notas text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — desabilitar para uso com anon key
-- (habilite conforme necessidade de auth futura)
-- ============================================================
alter table public.socios enable row level security;
alter table public.clientes enable row level security;
alter table public.itens enable row level security;
alter table public.vendas enable row level security;
alter table public.parcelas enable row level security;
alter table public.manutencoes enable row level security;
alter table public.bloqueios enable row level security;
alter table public.usuarios enable row level security;
alter table public.pagamentos_socios enable row level security;

-- Políticas abertas para anon (ajuste conforme auth real)
create policy "anon full access socios" on public.socios for all using (true) with check (true);
create policy "anon full access clientes" on public.clientes for all using (true) with check (true);
create policy "anon full access itens" on public.itens for all using (true) with check (true);
create policy "anon full access vendas" on public.vendas for all using (true) with check (true);
create policy "anon full access parcelas" on public.parcelas for all using (true) with check (true);
create policy "anon full access manutencoes" on public.manutencoes for all using (true) with check (true);
create policy "anon full access bloqueios" on public.bloqueios for all using (true) with check (true);
create policy "anon full access usuarios" on public.usuarios for all using (true) with check (true);
create policy "anon full access pagamentos_socios" on public.pagamentos_socios for all using (true) with check (true);

-- ============================================================
-- USUÁRIO ADMIN PADRÃO
-- senha: motorent123 (armazenada como texto simples para demo)
-- ============================================================
insert into public.usuarios (nome, email, senha_hash, role)
values ('Administrador', 'admin@motorent.com', 'motorent123', 'Admin')
on conflict (email) do nothing;

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_parcelas_venda_id on public.parcelas(venda_id);
create index if not exists idx_parcelas_cliente_id on public.parcelas(cliente_id);
create index if not exists idx_parcelas_data_vencimento on public.parcelas(data_vencimento);
create index if not exists idx_vendas_cliente_id on public.vendas(cliente_id);
create index if not exists idx_vendas_item_id on public.vendas(item_id);
create index if not exists idx_manutencoes_item_id on public.manutencoes(item_id);
create index if not exists idx_bloqueios_status on public.bloqueios(status);
