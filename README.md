# ControlAGRO

Aplicativo de gestao de visitas e clientes para equipes de vendas do setor agricola. Funciona offline.

## Stack

- Frontend: Vanilla JavaScript (sem frameworks)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Mobile: Capacitor 8 (iOS + Android)
- Offline: IndexedDB + Service Worker (PWA)

## Pre-requisitos

- Node.js >= 20
- npm
- Para iOS: Mac com Xcode
- Para Android: Android Studio com SDK 36

## Setup

```bash
npm install
npm run cap:sync:dev    # Ambiente de desenvolvimento
npm run cap:sync:prod   # Ambiente de producao
```

## Scripts principais

| Comando | Descricao |
|---------|-----------|
| `npm run build:prod` | Build web para producao |
| `npm run cap:sync:prod` | Sync completo (config + build + native) |
| `npm run release:check` | Diagnostico completo do projeto |
| `npm run preflight` | Verificacao pre-publicacao |
| `npm run release:android` | Build AAB para Google Play |
| `npm run release:android:apk` | Build APK para teste |
| `npm run version:patch` | Incrementar versao patch |
| `npm run generate:assets` | Gerar icones e splash screens |

## Estrutura do projeto

```
src/             -> Codigo fonte do app
config/          -> Configuracoes por ambiente e versao
scripts/         -> Scripts de build e automacao
store/           -> Metadata e docs para as lojas
android/         -> Projeto nativo Android
ios/             -> Projeto nativo iOS
docs/            -> Documentacao
```

## Publicacao

Consulte `store/SUBMISSION-GUIDE.md` para o passo a passo completo de publicacao na App Store e Google Play.
