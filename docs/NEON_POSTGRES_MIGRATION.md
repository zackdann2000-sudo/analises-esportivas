# Migração do armazenamento para Neon PostgreSQL

## Estado
Esta etapa prepara o esquema do banco; ela **não** troca ainda o adaptador JSON do aplicativo. Não considere a migração concluída até que o adaptador PostgreSQL, a inicialização das tabelas e os testes sejam implementados e verificados.

## Pré-requisitos
- Configurar `DATABASE_URL` como variável de ambiente na Vercel (Production e Preview, conforme necessário).
- Manter a URL e a senha fora do Git, do código do navegador e das mensagens públicas.
- Fazer backup do armazenamento existente antes de qualquer migração de dados.

## Diagnóstico atual

Depois do deploy, abra `/api/status/database`. O endpoint informa se `DATABASE_URL` está definida e deixa explícito que o armazenamento ainda é JSON temporário. Ele não revela a URL nem a senha e **não** testa uma conexão PostgreSQL real.

## Esquema inicial
O arquivo `db/migrations/001_initial_schema.sql` cria:
- `app_users`: contas e hashes de senha;
- `app_sessions`: sessões com hash do token e expiração;
- `app_settings`: configurações JSON, incluindo configurações de provedores, que devem permanecer acessíveis apenas no servidor.

## Próximas etapas obrigatórias
1. Adicionar e travar uma biblioteca PostgreSQL compatível com Next.js/Vercel.
2. Implementar consultas parametrizadas e um adaptador que preserve as funções públicas de `lib/db.ts`.
3. Executar migração explícita dos dados existentes, sem apagar o arquivo antigo.
4. Testar cadastro, login, logout, sessão expirada, bloqueio de usuário, configurações de APIs e build.
5. Só então ativar o adaptador PostgreSQL em produção.
