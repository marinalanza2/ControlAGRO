# FASE 1 — Autenticação Real com Supabase Auth

## Contexto do Projeto

O ControlAGRO é um app de visitas para vendedores agrícolas, construído como PWA em JavaScript vanilla com Capacitor 8 (iOS/Android). O backend é Supabase (PostgreSQL + Auth + Storage). O app funciona offline-first com IndexedDB e sync queue.

**Problema atual:** A autenticação usa senhas hardcoded no frontend (`auth-engine.js`), o que é inaceitável para publicação nas lojas Apple/Google.

## O que precisa ser feito

Substituir o sistema de autenticação hardcoded por Supabase Auth real (email + senha), mantendo compatibilidade com o fluxo offline-first existente.

## Arquivos que devem ser modificados

### 1. `src/scripts/auth-engine.js` (REESCREVER)
**Estado atual:** Valida senhas comparando com objeto `VENDOR_PASSWORDS` e `MASTER_PASSWORD` hardcoded.

**Novo comportamento:**
- Usar `supabase.auth.signInWithPassword({ email, password })` para login
- O email do vendedor vem da tabela `vendedores` (campo `email` já existe)
- Após login com sucesso, identificar o vendedor correspondente pelo email na tabela `vendedores`
- Para o modo gestor (master), o login também é por email/senha — o gestor é identificado por um campo `role` (novo) na tabela `vendedores` com valor `'gestor'`
- Se estiver offline E houver sessão salva no localStorage, permitir acesso offline (já funciona via `canUseOffline` em `auth-session.js`)
- Manter a interface como módulo IIFE `(function(globalScope) { ... })(window)` expondo `window.ControlAgroAuthEngine`

### 2. `src/scripts/auth-session.js` (ADAPTAR)
**Estado atual:** Salva/recupera sessão do localStorage com chave `controlagro_user`.

**Novo comportamento:**
- Além de salvar os dados do vendedor, salvar também o token de sessão do Supabase Auth
- Implementar `restoreSession()` que tenta `supabase.auth.getSession()` e, se expirado, tenta refresh
- Manter `canUseOffline()` — se offline e tem sessão salva, permitir acesso
- Adicionar `logout()` que chama `supabase.auth.signOut()` e `clearSession()`

### 3. `src/scripts/app.js` (ADAPTAR tela de login)
**Estado atual:** A tela de login (`section-login`) mostra uma lista de vendedores para selecionar e pede senha via `prompt()`.

**Novo comportamento:**
- Substituir a tela de login por um formulário com campos de email e senha
- Botão "Entrar" que chama `auth-engine.signIn(email, password)`
- Mostrar loading durante autenticação
- Mostrar erro de credenciais inválidas via toast (não via `alert()` ou `prompt()`)
- Se offline e existe sessão salva, mostrar opção "Continuar offline como [Nome]"
- Após login, redirecionar para o dashboard (fluxo já existente)
- Adicionar botão de logout no menu/header que chama `auth-session.logout()`

### 4. `database.sql` (ADICIONAR migração)
**Adicionar:**
- Campo `role` na tabela `vendedores`: `ALTER TABLE vendedores ADD COLUMN role VARCHAR(20) DEFAULT 'vendedor' CHECK (role IN ('vendedor', 'gestor'));`
- Vincular `vendedores.id` ao `auth.users.id` do Supabase Auth: `ALTER TABLE vendedores ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);`
- Atualizar RLS policies para usar `auth.uid()` real em vez de acesso anônimo
- **IMPORTANTE:** Remover TODAS as policies que dão acesso ao role `anon` (são policies de teste que não devem existir em produção)
- Criar script de migração separado: `database-migration-auth.sql`

### 5. `src/scripts/data-loader.js` (VERIFICAR)
- O Supabase client já deve estar autenticado após login, então as queries vão funcionar com as novas RLS policies
- Verificar que o client Supabase é inicializado com o token de sessão do Auth

### 6. `src/scripts/sync-engine.js` (VERIFICAR)
- O upload de fotos para o storage bucket `visitas-fotos` precisa de autenticação
- Verificar que as operações de insert/update usam o client autenticado

## Regras importantes

1. **NÃO quebrar o offline-first:** Se offline, o app DEVE funcionar com a sessão em cache. Nunca bloquear o uso offline porque não consegue validar token.
2. **NÃO usar frameworks:** O projeto é vanilla JS com IIFE modules. Manter esse padrão.
3. **NÃO importar supabase-js via npm:** O projeto usa Supabase via CDN (já carregado no index.html). Usar `window.supabase.createClient()`.
4. **Manter o padrão de módulos:** Cada módulo usa `(function(globalScope) { ... })(window)` e expõe via `globalScope.NomeDoModulo`.
5. **Resolver os conflitos de merge no `database.sql`:** O arquivo tem marcadores `<<<<<<<`, `=======`, `>>>>>>>` que precisam ser resolvidos (manter ambas as versões, são adições complementares).
6. **Criar um script SQL de migração separado** (`database-migration-auth.sql`) para quem já tem o banco rodando.

## Fluxo esperado após implementação

```
1. Vendedor abre o app
2. Vê tela de login com email + senha
3. Digita credenciais → Supabase Auth valida
4. Se OK → identifica vendedor na tabela → salva sessão → vai pro dashboard
5. Se offline + sessão salva → mostra "Continuar offline como [Nome]"
6. Todas as operações (CRUD, sync, fotos) usam o token autenticado
7. Gestor faz login normal → sistema detecta role='gestor' → habilita features master
8. Logout limpa sessão e token
```

## Critério de sucesso

- [ ] Login funciona com email/senha via Supabase Auth
- [ ] Senhas hardcoded removidas completamente do código
- [ ] Modo offline continua funcionando com sessão em cache
- [ ] Sync funciona com autenticação real
- [ ] Upload de fotos funciona com token autenticado
- [ ] Role gestor/vendedor funciona via tabela (não hardcoded)
- [ ] RLS policies atualizadas (sem acesso anônimo)
- [ ] Conflitos de merge no database.sql resolvidos
