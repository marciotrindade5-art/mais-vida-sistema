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
| Recepção | Agenda (marcar, confirmar, remarcar, cancelar), horários livres, mapa de disponibilidade, grade dos profissionais, pacientes, salas, ocupação, recebimentos e caixa do dia (só sessões particulares) |
| Profissional | A própria agenda (registra sessão realizada ou falta) e a lista de pacientes |
| Financeiro | Resumo financeiro, recebimentos, caixa, despesas, repasses, planos de saúde e ocupação |

As regras ficam em `src/lib/roles.ts`. Valores de sessão, tabela dos planos e repasses só aparecem para administrador e financeiro; a recepção vê o valor das sessões particulares apenas na hora de receber.

## Unidades, planos e grade

- A clínica tem duas unidades (Vila e Aterrado). Cada sala pertence a uma unidade, e agenda, ocupação, horários livres e mapa são vistos por unidade. A última unidade escolhida fica lembrada.
- Cada paciente é particular ou tem um plano de saúde, com o número da carteirinha. O valor da sessão sai da tabela do plano para a especialidade; particular, ou plano que não cobre a especialidade, usa o valor particular da especialidade.
- Cada profissional tem uma grade semanal (dia, horário e sala). A tela **Horários livres** cruza essa grade com a agenda e mostra os horários vagos para agendar com um clique; o **Mapa de disponibilidade** mostra a semana inteira por profissional.
- Um atendimento comporta até 2 pacientes (dupla), no mesmo horário, com o mesmo profissional e a mesma sala.

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

1. Importe o repositório na Vercel.
2. Em **Storage**, crie um banco Postgres da Neon e conecte ao projeto (isso preenche `DATABASE_URL`).
3. Em **Settings → Environment Variables**, defina `SESSION_SECRET` (texto aleatório longo), `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
4. Faça o deploy. Em produção, o script `vercel-build` aplica as migrações, cria as especialidades e o primeiro administrador (só se ainda não existir) e depois gera o build. As prévias de pull request só geram o build, sem mexer no banco.

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
