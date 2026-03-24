# Configuração iOS para Release

## Pré-requisitos

- macOS com Xcode instalado (versão 14+)
- Apple Developer Account ativa ($99/ano)
- Dispositivo iOS para teste (opcional, mas recomendado)

## Configuração inicial (uma vez)

1. Abrir `ios/App/App.xcworkspace` no Xcode
2. Selecionar o target **"App"** na barra lateral
3. Na aba **"Signing & Capabilities"**:
   - Marcar **"Automatically manage signing"**
   - Selecionar seu **Team** no dropdown (requer Apple Developer Account)
   - O Bundle Identifier já está configurado: `br.com.controlagro.app`
4. O Xcode irá gerar os provisioning profiles automaticamente

## Gerando build de release

### Opção 1: Via script (recomendado)

```bash
npm run release:prepare
```

Isso irá:
- Incrementar o build number
- Executar o build web de produção
- Sincronizar os assets nativos

Depois, abra o Xcode e siga o passo 2 abaixo.

### Opção 2: Manual

1. Execute `npm run cap:sync:prod` para sincronizar
2. No Xcode: **Product → Archive**
3. Após o archive completar, clique **"Distribute App"**
4. Selecione **"App Store Connect"**
5. Siga o assistente de distribuição

## Testando no dispositivo

1. Conecte o iPhone/iPad via USB
2. Selecione o dispositivo no Xcode (barra superior)
3. Pressione **Cmd+R** para executar

## Notas importantes

- O `MARKETING_VERSION` e `CURRENT_PROJECT_VERSION` são atualizados automaticamente pelo script `bump-version.mjs`
- A assinatura usa **ProvisioningStyle = Automatic** — o Xcode gerencia os certificados
- Para builds de release, o `CODE_SIGN_IDENTITY` é "iPhone Distribution"
- Nunca commite certificados (.p12) ou provisioning profiles (.mobileprovision) no repositório
