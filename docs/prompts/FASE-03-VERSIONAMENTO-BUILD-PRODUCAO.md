# FASE 3 — Versionamento, Assinatura e Build de Produção

## Contexto do Projeto

O ControlAGRO é um app Capacitor 8 (iOS/Android) com pipeline de build por ambiente (dev/homolog/prod). Atualmente:

- **Versão:** 0.1.0 no package.json, versionCode 1 / versionName "1.0" no Android, MARKETING_VERSION 1.0 / CURRENT_PROJECT_VERSION 1 no iOS
- **Assinatura Android:** Nenhuma configuração de signingConfigs no build.gradle — o release build não está assinado
- **Assinatura iOS:** CODE_SIGN_IDENTITY "iPhone Developer", DEVELOPMENT_TEAM não definido, ProvisioningStyle Automatic
- **Minificação Android:** `minifyEnabled false` no release build — sem otimização
- **Sem mecanismo de bump de versão** — versionCode/versionName são manuais

## O que precisa ser feito

### 1. Sistema centralizado de versionamento

Criar arquivo `config/version.json` como fonte única de verdade:
```json
{
  "version": "1.0.0",
  "build": 1
}
```

Regras:
- `version` segue semver (MAJOR.MINOR.PATCH) — mapeia para `versionName` (Android) e `MARKETING_VERSION` (iOS)
- `build` é incremental (inteiro) — mapeia para `versionCode` (Android) e `CURRENT_PROJECT_VERSION` (iOS)
- `package.json` também deve refletir o `version`

### 2. Script de bump de versão

Criar `scripts/bump-version.mjs`:
- Aceitar argumento: `patch`, `minor`, `major`, ou `build-only`
- `patch` → incrementa o terceiro número (1.0.0 → 1.0.1) e incrementa build
- `minor` → incrementa o segundo número (1.0.1 → 1.1.0) e incrementa build
- `major` → incrementa o primeiro número (1.1.0 → 2.0.0) e incrementa build
- `build-only` → só incrementa o build number (para re-submissões à loja)
- Atualizar automaticamente:
  - `config/version.json`
  - `package.json` (campo `version`)
  - `android/app/build.gradle` (versionCode e versionName)
  - `ios/App/App.xcodeproj/project.pbxproj` (MARKETING_VERSION e CURRENT_PROJECT_VERSION)
- Imprimir no console: `Versão atualizada: 1.0.1 (build 2)`

Adicionar scripts no `package.json`:
```json
"version:patch": "node scripts/bump-version.mjs patch",
"version:minor": "node scripts/bump-version.mjs minor",
"version:major": "node scripts/bump-version.mjs major",
"version:build": "node scripts/bump-version.mjs build-only"
```

### 3. Configuração de assinatura Android

Atualizar `android/app/build.gradle` para suportar assinatura de release via variáveis de ambiente ou arquivo de propriedades:

```groovy
// Dentro de android { }
signingConfigs {
    release {
        def keystorePropsFile = rootProject.file("keystore.properties")
        if (keystorePropsFile.exists()) {
            def keystoreProps = new Properties()
            keystoreProps.load(new FileInputStream(keystorePropsFile))
            storeFile file(keystoreProps['storeFile'])
            storePassword keystoreProps['storePassword']
            keyAlias keystoreProps['keyAlias']
            keyPassword keystoreProps['keyPassword']
        } else if (System.getenv("ANDROID_KEYSTORE_FILE")) {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
}

buildTypes {
    release {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release
    }
}
```

Criar template `android/keystore.properties.example`:
```properties
storeFile=controlagro-release.keystore
storePassword=SUA_SENHA_AQUI
keyAlias=controlagro
keyPassword=SUA_SENHA_AQUI
```

Criar script `scripts/generate-keystore.sh` que gera o keystore:
```bash
#!/bin/bash
keytool -genkeypair -v \
  -keystore android/controlagro-release.keystore \
  -alias controlagro \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=ControlAGRO, OU=Mobile, O=O Fazendeiro, L=Belo Horizonte, ST=MG, C=BR"
```

**IMPORTANTE:** Adicionar ao `.gitignore`:
```
# Signing
android/*.keystore
android/*.jks
android/keystore.properties
```

### 4. Configuração iOS para release

Atualizar `ios/App/App.xcodeproj/project.pbxproj`:
- Seção Release: mudar `CODE_SIGN_IDENTITY` de `"iPhone Developer"` para `"iPhone Distribution"`
- Manter `ProvisioningStyle = Automatic` — o desenvolvedor configura o DEVELOPMENT_TEAM no Xcode localmente

Criar `docs/ios-release-setup.md` com instruções:
```markdown
# Configuração iOS para Release

1. Abrir `ios/App/App.xcworkspace` no Xcode
2. Selecionar o target "App"
3. Na aba "Signing & Capabilities":
   - Marcar "Automatically manage signing"
   - Selecionar seu Team (requer Apple Developer Account - $99/ano)
   - O Bundle Identifier já está configurado: br.com.controlagro.app
4. Para gerar o arquivo de submissão:
   - Product → Archive
   - Após o archive, clicar "Distribute App"
   - Selecionar "App Store Connect"
   - Seguir o assistente
```

### 5. Scripts de build de produção

Criar `scripts/build-release.mjs` — script que orquestra o build completo de release:

```
Fluxo:
1. Verificar que estamos no ambiente prod (ou aceitar --env=prod)
2. Rodar npm run version:build (incrementar build number)
3. Rodar npm run cap:sync:prod (config + build web + cap sync + native branding)
4. Imprimir instruções para o próximo passo:
   - Android: "Execute: cd android && ./gradlew bundleRelease"
   - iOS: "Abra ios/App/App.xcworkspace no Xcode e faça Archive"
```

Adicionar scripts no `package.json`:
```json
"release:prepare": "node scripts/build-release.mjs",
"release:android": "node scripts/build-release.mjs && cd android && ./gradlew bundleRelease",
"release:android:apk": "node scripts/build-release.mjs && cd android && ./gradlew assembleRelease"
```

### 6. Atualizar generate-capacitor-config.mjs

O script que gera `capacitor.config.json` deve também ler `config/version.json` e incluir a versão nas configurações, para que fique rastreável:

```javascript
// Adicionar ao final do capacitorConfig:
const versionConfig = JSON.parse(await readFile(versionPath, "utf8"));
capacitorConfig._version = versionConfig.version;
capacitorConfig._build = versionConfig.build;
```

### 7. Atualizar .gitignore

Garantir que os seguintes itens estão no `.gitignore`:
```
# Signing - Android
android/*.keystore
android/*.jks
android/keystore.properties

# Build outputs
android/app/build/
android/.gradle/
ios/App/build/
ios/DerivedData/

# Nunca commitar
*.p12
*.mobileprovision
```

## Regras importantes

1. **NÃO commitar keystores ou senhas** — só templates e exemplos
2. **NÃO habilitar minifyEnabled** no Android por enquanto — o código é vanilla JS sem tree-shaking, e minificar pode quebrar as IIFEs. Pode ser habilitado futuramente quando houver testes
3. **Manter scripts como ES modules (.mjs)** seguindo o padrão existente
4. **O versionCode DEVE ser sempre incremental** — a Google Play rejeita uploads com versionCode igual ou menor ao anterior
5. **O build number iOS DEVE ser sempre incremental** — App Store Connect rejeita builds com mesmo número
6. **Usar `bundleRelease` (AAB) como padrão** para Android — Google Play exige AAB desde 2021. Manter `assembleRelease` (APK) como opção para testes

## Estrutura final esperada

```
config/
  version.json          ← NOVO: fonte de verdade para versão
  environments/
    dev.json
    homolog.json
    prod.json
scripts/
  bump-version.mjs      ← NOVO: incrementar versão
  build-release.mjs     ← NOVO: build completo de release
  generate-keystore.sh   ← NOVO: gerar keystore Android
  build-web.mjs          (existente)
  generate-capacitor-config.mjs (atualizado)
  ...
android/
  keystore.properties.example  ← NOVO: template
docs/
  ios-release-setup.md  ← NOVO: guia iOS
```

## Critério de sucesso

- [ ] `config/version.json` criado com versão 1.0.0 build 1
- [ ] `npm run version:patch` incrementa versão em todos os arquivos (package.json, build.gradle, project.pbxproj)
- [ ] `android/app/build.gradle` tem signingConfigs configurado para ler de keystore.properties ou env vars
- [ ] `.gitignore` atualizado para excluir keystores e propriedades de assinatura
- [ ] `scripts/generate-keystore.sh` criado e funcional
- [ ] `android/keystore.properties.example` criado como template
- [ ] `docs/ios-release-setup.md` criado com instruções claras
- [ ] `npm run release:prepare` executa o fluxo completo de preparação
- [ ] `npm run release:android` gera o AAB assinado (quando keystore estiver configurado)
- [ ] Versões estão sincronizadas entre package.json, Android e iOS
