# Guia de Submissao — ControlAGRO

## Pre-requisitos

### Apple App Store
- [ ] Conta Apple Developer ($99/ano) — https://developer.apple.com
- [ ] Mac com Xcode instalado (para gerar o Archive)
- [ ] Certificado de distribuicao configurado no Xcode
- [ ] App Store Connect: criar o app com Bundle ID `br.com.controlagro.app`

### Google Play
- [ ] Conta Google Play Developer ($25 taxa unica) — https://play.google.com/console
- [ ] Keystore de assinatura gerado (ver `scripts/generate-keystore.sh`)
- [ ] Google Play Console: criar o app

## Passos para Apple App Store

1. **Preparar o build**
   ```bash
   npm run release:prepare
   ```

2. **Abrir no Xcode**
   ```bash
   open ios/App/App.xcworkspace
   ```

3. **Configurar signing** (ver `docs/ios-release-setup.md`)

4. **Archive:** Product → Archive

5. **Distribuir:** Organize → Distribute App → App Store Connect

6. **App Store Connect:**
   - Preencher metadata (usar `store/metadata.json`)
   - Upload screenshots (ver `store/screenshots/README.md`)
   - Preencher App Privacy (usar `store/apple-privacy-questionnaire.md`)
   - Inserir URL da politica de privacidade
   - Selecionar o build enviado
   - Enviar para Review

### Credenciais de teste (obrigatorio para Apple)
A Apple exige credenciais de teste para o review. Criar um vendedor de teste:
- Email: `[EMAIL DE TESTE]`
- Senha: `[SENHA DE TESTE]`

Informar essas credenciais no campo "App Review Information" do App Store Connect.

## Passos para Google Play

1. **Preparar o build**
   ```bash
   npm run release:android
   ```

2. **O AAB estara em:** `android/app/build/outputs/bundle/release/app-release.aab`

3. **Google Play Console:**
   - Criar o app (Producao → Criar nova versao)
   - Upload do AAB
   - Preencher Store Listing (usar `store/metadata.json`)
   - Upload screenshots (ver `store/screenshots/README.md`)
   - Preencher Data Safety (usar `store/google-data-safety.md`)
   - Inserir URL da politica de privacidade
   - Definir paises (Brasil)
   - Definir classificacao etaria (Todos)
   - Enviar para Review

### Build alternativo (APK)
Para testes internos ou distribuicao fora da Play Store:
```bash
npm run release:android:apk
```
O APK estara em: `android/app/build/outputs/apk/release/app-release.apk`

## Tempo estimado de review
- Apple: 24-48 horas (primeira submissao pode levar mais)
- Google: 3-7 dias (primeira submissao costuma levar mais)

## Motivos comuns de rejeicao e como evitar

| Motivo | Status | Solucao |
|--------|--------|---------|
| Sem politica de privacidade | ✅ Resolvido | Criada na Fase 5 (`src/legal/`) |
| Screenshots genericas | ⚠ Pendente | Gerar com dados realistas |
| App crashando | ⚠ Testar | Testar em dispositivo real |
| Funcionalidade incompleta | ⚠ Testar | Garantir login, visitas, clientes e sync |
| Permissoes sem justificativa | ✅ Resolvido | Textos de permissao configurados |
| Login de teste nao fornecido | ⚠ Pendente | Criar vendedor de teste no Supabase |

## Checklist pre-submissao

### Funcionalidade
- [ ] Login com email/senha funciona
- [ ] Registro de visita com foto e GPS funciona
- [ ] Cadastro de cliente funciona
- [ ] Modo offline funciona (desligar internet, registrar, reconectar)
- [ ] Sincronizacao automatica funciona ao reconectar
- [ ] Tela de consentimento (termos) aparece no primeiro login
- [ ] Link de politica de privacidade acessivel no app

### Build
- [ ] `npm run release:prepare` roda sem erros
- [ ] Build iOS gera Archive sem erros
- [ ] Build Android gera AAB/APK sem erros
- [ ] Versao e build number estao corretos (`config/version.json`)

### Store
- [ ] Todos os placeholders `[...]` em `store/metadata.json` preenchidos
- [ ] URL publica da politica de privacidade funcionando
- [ ] Screenshots geradas nos tamanhos corretos
- [ ] Credenciais de teste criadas (Apple)

## Atualizacoes futuras

Para cada nova versao:
1. `npm run version:patch` (ou minor/major)
2. Criar `store/release-notes/vX.Y.Z.txt` com as novidades
3. `npm run release:prepare`
4. Gerar builds e enviar para as lojas
