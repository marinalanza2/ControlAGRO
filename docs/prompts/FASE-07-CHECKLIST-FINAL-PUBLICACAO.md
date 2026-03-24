# FASE 7 — Checklist Final, Script de Verificação e Preparação para Publicação

## Contexto

As 6 fases anteriores implementaram:
1. ✅ Autenticação real com Supabase Auth (email/senha, roles, sessão offline)
2. ✅ Ícones, splash screens e branding nativo (SVG, sharp, todas as densidades)
3. ✅ Versionamento centralizado, assinatura Android, scripts de release
4. ✅ Plugins nativos Capacitor (Network, Camera, Geolocation), Supabase bundled local, guard do SW
5. ✅ Política de privacidade, termos de uso, tela de consentimento LGPD
6. ✅ Metadata das lojas, questionários de privacidade, guia de submissão

Esta fase final faz a verificação de integridade, corrige qualquer lacuna restante, e gera o script `doctor.mjs` atualizado que valida se o projeto está pronto para publicação.

## O que precisa ser feito

### Passo 1: Atualizar o script `scripts/doctor.mjs`

O script `doctor.mjs` já existe mas precisa ser **completamente reescrito** para validar todos os requisitos de publicação. Deve verificar:

#### A) Estrutura de arquivos obrigatória
```javascript
const requiredFiles = [
  // Config
  'config/version.json',
  'config/environments/prod.json',
  'capacitor.config.json',
  'package.json',

  // Source
  'src/index.html',
  'src/scripts/app.js',
  'src/scripts/auth-engine.js',
  'src/scripts/auth-session.js',
  'src/scripts/offline-db.js',
  'src/scripts/data-loader.js',
  'src/scripts/sync-engine.js',
  'src/scripts/network-status.js',
  'src/scripts/camera-handler.js',
  'src/scripts/geo-handler.js',
  'src/scripts/bootstrap-state.js',
  'src/scripts/runtime-config.js',
  'src/scripts/app-config.js',
  'src/styles/app.css',

  // Vendor (bundled, não CDN)
  'src/vendor/supabase-js.min.js',

  // Legal
  'src/legal/politica-privacidade.html',
  'src/legal/termos-de-uso.html',

  // Assets
  'logo.svg',
  'logo-1024.png',
  'manifest.json',
  'sw.js',

  // Nativos
  'android/app/build.gradle',
  'android/keystore.properties.example',
  'ios/App/App.xcodeproj/project.pbxproj',
  'ios/App/App/Info.plist',

  // Store
  'store/metadata.json',
  'store/SUBMISSION-GUIDE.md',
  'store/apple-privacy-questionnaire.md',
  'store/google-data-safety.md',

  // Scripts
  'scripts/build-web.mjs',
  'scripts/build-release.mjs',
  'scripts/bump-version.mjs',
  'scripts/generate-app-icons.mjs',
  'scripts/generate-splash-screens.mjs',
  'scripts/generate-keystore.sh',
  'scripts/apply-native-branding.mjs',
  'scripts/generate-capacitor-config.mjs',

  // Docs
  'docs/ios-release-setup.md'
];
```

#### B) Validações de conteúdo
```javascript
// 1. Verificar que NÃO existem senhas hardcoded
//    - Buscar "rodrigo26", "edmundoagro26", "fazendeiro26" em todos os .js
//    - Se encontrar: FALHA CRÍTICA

// 2. Verificar que NÃO existem conflitos de merge
//    - Buscar "<<<<<<", "======", ">>>>>>" em todos os arquivos
//    - Se encontrar: FALHA CRÍTICA

// 3. Verificar que o Supabase NÃO é carregado via CDN no index.html
//    - Buscar "cdn.jsdelivr.net" no src/index.html
//    - Se encontrar como <script src>: FALHA (deve ser local)
//    - Se encontrar como <link> para fonts: OK (fonts são opcionais)

// 4. Verificar que config/environments/prod.json tem credenciais preenchidas
//    - Ler prod.json e checar se supabaseUrl e supabaseAnonKey NÃO estão vazios
//    - Se vazios: AVISO (precisa preencher antes de publicar)

// 5. Verificar versão sincronizada
//    - Ler version.json, package.json, build.gradle, project.pbxproj
//    - A versão deve ser a mesma em todos
//    - Se diferente: FALHA

// 6. Verificar que os ícones existem em todas as densidades
//    - Android: mipmap-mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi com ic_launcher.png
//    - iOS: AppIcon.appiconset com Contents.json
//    - Se faltam: FALHA

// 7. Verificar que splash screens existem
//    - Android: drawable-port-*, drawable-land-* com splash.png
//    - iOS: Splash.imageset com splash-2732x2732.png
//    - Se faltam: FALHA

// 8. Verificar que o manifest.json tem ícones nos caminhos corretos
//    - Ler manifest.json, verificar que os src dos ícones existem como arquivos
//    - Se não existem: FALHA

// 9. Verificar que .gitignore exclui keystores
//    - Buscar "*.keystore" e "keystore.properties" no .gitignore
//    - Se ausente: AVISO DE SEGURANÇA

// 10. Verificar que NÃO existem policies de acesso anônimo no database.sql
//     - Buscar "TO anon" no database.sql
//     - Se encontrar: AVISO (devem ser removidas para produção)

// 11. Verificar que placeholders [NOME DA EMPRESA] etc. foram preenchidos
//     - Buscar "[NOME DA EMPRESA]", "[CNPJ]", "[EMAIL DE CONTATO]", etc.
//     - Em: store/metadata.json, src/legal/*.html
//     - Se encontrar: AVISO (precisa preencher antes de publicar)

// 12. Verificar que auth-engine.js usa supabase.auth (não senhas hardcoded)
//     - Buscar "signInWithPassword" no auth-engine.js
//     - Se NÃO encontrar: FALHA CRÍTICA
```

#### C) Output formatado
O script deve imprimir um relatório colorido no terminal:

```
╔══════════════════════════════════════════╗
║     ControlAGRO — Diagnóstico v2.0      ║
╚══════════════════════════════════════════╝

📋 Arquivos obrigatórios .............. ✅ 38/38
🔒 Segurança (senhas hardcoded) ....... ✅ Nenhuma encontrada
🔀 Conflitos de merge ................. ✅ Nenhum encontrado
📦 Supabase bundled local ............. ✅ vendor/supabase-js.min.js
🔑 Credenciais prod ................... ⚠️  Vazias (preencher antes de publicar)
🔢 Versão sincronizada ................ ✅ 1.0.0 (build 1)
🎨 Ícones Android ..................... ✅ 5/5 densidades
🎨 Ícones iOS ......................... ✅ 18/18 tamanhos
🖼️  Splash Android ..................... ✅ 11/11 variantes
🖼️  Splash iOS ......................... ✅ OK
📱 Manifest PWA ....................... ✅ Ícones válidos
🔐 .gitignore (keystores) ............. ✅ Configurado
📜 Política de Privacidade ............ ✅ Existe
📜 Termos de Uso ...................... ✅ Existe
📝 Placeholders a preencher ........... ⚠️  5 encontrados
🏪 Metadata da loja ................... ✅ Completo
🔐 Autenticação ....................... ✅ Supabase Auth

═══════════════════════════════════════════
  Resultado: 15 ✅  |  2 ⚠️  |  0 ❌
  Status: PRONTO PARA BUILD (resolver avisos antes de publicar)
═══════════════════════════════════════════
```

Classificação:
- ✅ = OK
- ⚠️ = Aviso (não bloqueia build, mas deve ser resolvido antes de publicar)
- ❌ = Falha crítica (bloqueia publicação)

Exit code:
- 0 se nenhuma falha crítica
- 1 se alguma falha crítica

### Passo 2: Resolver conflitos de merge no database.sql

O arquivo `database.sql` na raiz ainda pode conter marcadores de merge (`<<<<<<`, `======`, `>>>>>>`). Se existirem:
- Manter TODAS as adições de ambos os lados (são complementares, não conflitantes)
- Remover os marcadores de merge
- Resultado final deve ter: vendedores, clientes (com lembrete_data/nota), visitas, contatos, plantios, e todas as views/policies

### Passo 3: Criar script de build final completo

Criar `scripts/preflight.mjs` — script que roda ANTES do build de release:
```
Fluxo:
1. Rodar doctor.mjs (verificação completa)
2. Se há falhas críticas → abortar com mensagem de erro
3. Se há avisos → imprimir avisos mas continuar
4. Confirmar versão atual e build number
5. Imprimir resumo:
   "Pronto para build. Execute:"
   "  npm run release:android    (gera AAB para Google Play)"
   "  npm run release:android:apk (gera APK para teste)"
   "  Xcode Archive              (para App Store — ver docs/ios-release-setup.md)"
```

Adicionar ao `package.json`:
```json
"preflight": "node scripts/preflight.mjs",
"release:check": "node scripts/doctor.mjs"
```

### Passo 4: Atualizar build-release.mjs

O `build-release.mjs` existente deve chamar o preflight antes de proceder:
```javascript
// No início do script:
// 1. Rodar doctor.mjs e verificar resultado
// 2. Se falha crítica → abortar
// 3. Bumpar build number
// 4. Rodar cap:sync:prod
// 5. Imprimir próximos passos
```

### Passo 5: Validar e limpar o index.html

Revisar `src/index.html` para garantir:
- NÃO tem `<script>` apontando para CDN (exceto Google Fonts que é opcional)
- Scripts estão na ordem correta de dependência:
  1. `vendor/supabase-js.min.js` (dependência base)
  2. `scripts/network-status.js` (sem dependências)
  3. `scripts/camera-handler.js` (sem dependências)
  4. `scripts/geo-handler.js` (sem dependências)
  5. `scripts/offline-db.js` (sem dependências)
  6. `scripts/data-loader.js` (depende de offlineDB)
  7. `scripts/sync-engine.js` (depende de offlineDB)
  8. `scripts/bootstrap-state.js` (sem dependências)
  9. `scripts/auth-session.js` (sem dependências)
  10. `scripts/auth-engine.js` (sem dependências)
  11. `scripts/runtime-config.js` (sem dependências)
  12. `scripts/app-config.js` (depende de runtime-config)
  13. `scripts/app.js` (depende de todos os anteriores) — no `<body>`
- Meta tag viewport está correta para mobile nativo: `viewport-fit=cover`
- Sem `<meta http-equiv="Content-Security-Policy">` que possa bloquear Capacitor

### Passo 6: Criar README atualizado do projeto

Criar/atualizar `README.md` na raiz com:

```markdown
# ControlAGRO

Aplicativo de gestão de visitas e clientes para equipes de vendas do setor agrícola. Funciona offline.

## Stack

- Frontend: Vanilla JavaScript (sem frameworks)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Mobile: Capacitor 8 (iOS + Android)
- Offline: IndexedDB + Service Worker (PWA)

## Pré-requisitos

- Node.js >= 20
- npm
- Para iOS: Mac com Xcode
- Para Android: Android Studio com SDK 36

## Setup

\`\`\`bash
npm install
npm run cap:sync:dev    # Ambiente de desenvolvimento
npm run cap:sync:prod   # Ambiente de produção
\`\`\`

## Scripts principais

| Comando | Descrição |
|---------|-----------|
| `npm run build:prod` | Build web para produção |
| `npm run cap:sync:prod` | Sync completo (config + build + native) |
| `npm run release:check` | Diagnóstico completo do projeto |
| `npm run preflight` | Verificação pré-publicação |
| `npm run release:android` | Build AAB para Google Play |
| `npm run version:patch` | Incrementar versão patch |
| `npm run generate:assets` | Gerar ícones e splash screens |

## Estrutura do projeto

\`\`\`
src/             → Código fonte do app
config/          → Configurações por ambiente e versão
scripts/         → Scripts de build e automação
store/           → Metadata e docs para as lojas
android/         → Projeto nativo Android
ios/             → Projeto nativo iOS
docs/            → Documentação
\`\`\`

## Publicação

Consulte `store/SUBMISSION-GUIDE.md` para o passo a passo completo de publicação na App Store e Google Play.
```

### Passo 7: Limpeza final

- Remover `docs/mobile-plan.md` (obsoleto — o plano foi executado)
- Atualizar `docs/native-release-baseline.md` com o status atualizado (todos os itens resolvidos)
- Verificar que não há `console.log` de debug excessivo nos scripts de produção (manter apenas logs de erro e sync)
- Verificar que `database.sql` está limpo (sem marcadores de merge)

## Regras importantes

1. **O `doctor.mjs` é o artefato mais importante desta fase** — deve ser robusto e cobrir tudo
2. **NÃO remover console.error** — logs de erro são úteis para debugging em produção
3. **Manter `console.log` do SW e do offlineDB** — são úteis para debugging offline
4. **O preflight NÃO deve bloquear se houver apenas avisos** — apenas falhas críticas bloqueiam
5. **O README deve ser conciso** — não duplicar informação que está em docs/ e store/

## Critério de sucesso

- [ ] `npm run release:check` executa e mostra relatório completo e formatado
- [ ] Script detecta corretamente: senhas hardcoded, conflitos de merge, CDN no index, credenciais vazias, versão dessincronizada, ícones faltando, placeholders não preenchidos
- [ ] `npm run preflight` roda doctor + mostra instruções de próximo passo
- [ ] `build-release.mjs` integra verificação antes do build
- [ ] `database.sql` limpo (sem marcadores de merge)
- [ ] `README.md` atualizado e conciso
- [ ] `docs/mobile-plan.md` removido ou marcado como concluído
- [ ] `docs/native-release-baseline.md` atualizado
- [ ] Exit code 0 quando tudo está OK, exit code 1 quando há falha crítica
- [ ] Rodar `npm run cap:sync:prod` sem erros após todas as correções
