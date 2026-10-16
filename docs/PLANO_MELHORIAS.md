# Plano de melhorias — Análises Esportivas

Objetivo: evoluir o projeto em fases, priorizando resultados e análise de futebol e mantendo custo inicial zero.

## Fase 1 — Estabilidade, segurança e persistência
- [x] Remover a opção de ignorar erros de TypeScript durante o build.
- [x] Adicionar verificação automatizada de TypeScript e build no GitHub Actions.
- [x] Validar datas reais e limitar/validar IDs recebidos pela API de partidas.
- [x] Cookies de sessão HTTP-only e SameSite=Lax.
- [ ] Executar o workflow e corrigir todos os erros reportados.
- [ ] Migrar o armazenamento JSON temporário para banco persistente.
- [ ] Testar cadastro, login, sessão, permissões e configurações de API.

### Bloqueio de infraestrutura: banco de dados
O armazenamento atual usa `os.tmpdir()/radargol-data/db.json`. Isso não é uma base persistente adequada para instâncias serverless e pode causar perda/divergência de usuários, sessões e chaves de API.
A migração precisa de um destino persistente (por exemplo, PostgreSQL gratuito no Neon ou Supabase), de uma variável de conexão configurada no ambiente de hospedagem e de uma estratégia de migração/backup. Não gravar credenciais no Git. Até esses requisitos existirem, não declarar a persistência resolvida.

## Fase 2 — Dados reais de futebol
- Confirmar a integração API-Football com uma chave válida e conferir os limites do plano.
- Diferenciar claramente dados reais, demonstração e indisponibilidade; nunca misturar exemplos com dados reais sem indicação.
- Validar resultados, partidas por data, jogos ao vivo, ligas e IDs.
- Tratar limite de requisições (429), timeout, resposta inválida e falhas do provedor sem esconder a origem do erro.
- Adicionar testes para normalização e fallback antes de alterar os contratos públicos da API.

## Fase 3 — Análise estatística
- Mostrar forma recente, gols marcados/sofridos e desempenho casa/fora apenas quando houver dados de origem suficientes.
- Exibir tamanho da amostra e fonte/horário de atualização.
- Distinguir probabilidades calculadas pelo modelo de estatísticas observadas; não apresentar estimativas como garantias.
- Não preencher estatísticas ausentes com zeros ou valores fictícios.

## Fase 4 — Alertas e personalização
- Favoritos e filtros persistentes após a migração do banco.
- Alertas de partidas ao vivo com limites para evitar polling excessivo e duplicação.
- Monitorar erros, consumo de API e estado do provedor.
- Melhorar acessibilidade e experiência móvel sem comprometer as telas existentes.

## Política de testes e entrega
1. Rodar `pnpm install --frozen-lockfile`.
2. Rodar `pnpm typecheck`.
3. Rodar `pnpm build`.
4. Verificar o resultado real do GitHub Actions e testar os endpoints com e sem API key.
5. Só marcar um item como concluído quando houver evidência verificável. Acesso a uma API com chave e configuração de banco devem ser confirmados no ambiente de hospedagem.

## Custos
Usar inicialmente ferramentas com plano gratuito, respeitando cotas e termos. Não prometer que APIs, banco ou hospedagem permanecerão gratuitos para sempre; verificar limites vigentes antes da produção.
