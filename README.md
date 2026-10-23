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
| Administrador | Tudo, incluindo usuários, especialidades e salas |
| Recepção | Pacientes e salas; consulta profissionais |
| Profissional | Início e pacientes (somente leitura) |
| Financeiro | Consulta profissionais e repasses |

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
- [ ] Fase 3: financeiro (recebimentos, despesas, caixa e repasses)
