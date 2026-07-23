# sendMail

App web pra gerenciar clientes e disparar campanhas de email, com autenticação segura (email + TOTP).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **PostgreSQL** + Drizzle ORM
- **Nodemailer** (envio via Gmail)
- **TanStack Query** (data fetching)
- Tailwind CSS

## Funcionalidades

- Cadastro/login com verificação de email e TOTP (2FA)
- Dispositivos confiáveis
- CRUD de clientes
- Composição e envio de campanhas de email em fila
- Configurações da conta (troca de senha, exclusão de conta)

## Rodando localmente

```bash
# subir o banco
docker-compose up -d

# instalar dependências
npm install

# rodar migrações
npm run db:migrate

# subir o app
npm run dev
```

Configure as variáveis de ambiente em `.env.local` (ver `lib/env.ts`).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | ambiente de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | roda build de produção |
| `npm run lint` | lint |
| `npm run db:generate` | gera migração Drizzle |
| `npm run db:migrate` | aplica migrações |
| `npm run db:studio` | abre Drizzle Studio |
