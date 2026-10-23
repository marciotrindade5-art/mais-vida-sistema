# Sistema Clínica Mais Vida

Sistema web de gestão da Clínica Mais Vida: cadastros, agenda, ocupação das salas e financeiro.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4, com as cores e fontes da marca em `src/app/globals.css`
- PostgreSQL + Prisma
- Login próprio com sessão assinada (cookie httpOnly) e perfis de acesso

## Perfis

| Perfil | Acesso |
| --- | --- |
| Administrador | Tudo |
| Recepção | Agenda (marcar, confirmar, remarcar, cancelar), pacientes, salas, ocupação, recebimentos e caixa do dia |
| Profissional | A própria agenda (registra sessão realizada ou falta) e a lista de pacientes |
| Financeiro | Resumo financeiro, recebimentos, caixa, despesas, repasses e ocupação |

As regras ficam em `src/lib/roles.ts`.

## Rodando localmente

Requisitos: Node 20+ e um PostgreSQL.

```bash
cp .env.example .env              # preencha DATABASE_URL, SESSION_SECRET e ADMIN_PASSWORD
npm install
npx prisma migrate dev            # cria as tabelas
npm run db:seed                   # especialidades da clínica + primeiro administrador
npm run dev                       # http://localhost:3000
```

## Implantação

1. Crie um banco PostgreSQL gerenciado (Neon ou Supabase).
2. Importe o repositório na Vercel e configure `DATABASE_URL` e `SESSION_SECRET`.
3. Rode `npm run db:migrate` e `npm run db:seed` apontando para o banco de produção.

## Horário da clínica

O horário de funcionamento (usado na grade da agenda e no cálculo de ocupação) fica em `src/lib/clinic.ts`.
Hoje está seg. a sex. das 8h às 19h e sáb. das 8h às 13h. Datas são gravadas em UTC e exibidas no horário de Brasília.

## Etapas

- [x] Fase 1: base, login, perfis e cadastros
- [x] Fase 2: agenda (com sessões recorrentes e checagem de conflitos) e ocupação das salas
- [x] Fase 3: financeiro (recebimentos por sessão ou pacote, caixa do dia, despesas e repasses)

## Como o financeiro funciona

- Cada sessão tem um valor (vem da especialidade e pode ser alterado no agendamento).
- Sessão **realizada** e sem pagamento entra em "A receber". Sessões com valor zero não entram.
- Um recebimento quita uma ou várias sessões do paciente, inclusive futuras (pacote pago adiantado). O valor pode ter desconto.
- O repasse de cada profissional é calculado sobre as sessões realizadas no mês, pela regra do cadastro (percentual ou valor fixo por sessão), e pode ser lançado como despesa com vencimento no dia 5 do mês seguinte.
