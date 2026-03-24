# FASE 2 — Ícones, Splash Screen e Branding Nativo

## Contexto do Projeto

O ControlAGRO é um app Capacitor 8 (iOS/Android) com cores de marca verde (#166534 primário, #14532d fundo escuro). Já existe uma infraestrutura de ícones e splash screens, mas com problemas críticos que impedem publicação nas lojas.

## Problemas identificados

### 1. Logo fonte muito pequena
- O arquivo `logo.png` na raiz é na verdade um **WEBP de 144x144 pixels**
- A Apple App Store exige ícone de **1024x1024** como asset obrigatório
- Upscale de 144→1024 gera resultado pixelado e borrado — rejeição garantida na review

### 2. Script de ícones depende de `sips` (macOS only)
- `scripts/generate-app-icons.mjs` usa o comando `sips` para redimensionar
- `sips` só existe no macOS — o script falha em Linux/CI
- Precisa ser substituído por ferramenta cross-platform (`sharp` via npm)

### 3. Splash screens são genéricas
- As splash screens no Android e iOS existem mas são as padrão do Capacitor (fundo branco/azulado)
- Precisam refletir a marca: fundo verde escuro (#14532d) com logo centralizada

### 4. Ícone adaptativo do Android incompleto
- Os XMLs de adaptive icon existem em `mipmap-anydpi-v26/` mas o `ic_launcher_foreground.png` é só uma cópia redimensionada do logo completo
- Android Adaptive Icons requerem foreground com **padding de 25%** (safe zone) sobre fundo transparente, e um background layer separado (cor sólida ou imagem)

### 5. Manifest PWA referencia tamanhos inexistentes
- `manifest.json` declara ícones 192x192 e 512x512 apontando para `logo.png` que é 144x144

## O que precisa ser feito

### Passo 1: Gerar logo SVG de alta qualidade

Criar `logo.svg` na raiz do projeto com o ícone do ControlAGRO:
- Desenho vetorial simples representando o agro (pode ser uma folha estilizada, planta, ou trator minimalista com as letras "CA" integradas)
- Cores da marca: verde #166534 (principal), branco para contraste
- Design limpo que funcione bem em tamanhos pequenos (20x20) e grandes (1024x1024)
- Sem gradientes complexos (precisa funcionar como ícone flat)

A partir do SVG, gerar `logo-1024.png` (1024x1024 em PNG, fundo sólido verde #14532d com logo centralizado) que será a fonte para todos os outros tamanhos.

### Passo 2: Atualizar script de geração de ícones

Reescrever `scripts/generate-app-icons.mjs`:
- Substituir `sips` por `sharp` (npm package) para ser cross-platform
- Adicionar `sharp` como devDependency no package.json
- Fonte: `logo-1024.png` (1024x1024)
- Gerar todos os tamanhos de ícone para iOS (18 variantes, mesma lista que já existe no script)
- Gerar todos os tamanhos de mipmap para Android (mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192)
- Gerar `ic_launcher_foreground.png` com padding de 25% em cada direção (safe zone para adaptive icon) — fundo transparente
- Gerar ícones PWA: `icons/icon-192.png` e `icons/icon-512.png` na pasta `dist/` ou `src/`
- Atualizar `manifest.json` para apontar para os caminhos corretos

### Passo 3: Gerar splash screens com a marca

Criar script `scripts/generate-splash-screens.mjs`:
- Usar `sharp` para gerar splash screens
- Fundo sólido verde escuro (#14532d)
- Logo centralizada (branca ou logo-1024.png redimensionada) ocupando ~30% do menor eixo
- Gerar para Android:
  - `drawable/splash.png` (480x480)
  - `drawable-land-hdpi/splash.png` (800x480)
  - `drawable-land-mdpi/splash.png` (480x320)
  - `drawable-land-xhdpi/splash.png` (1280x720)
  - `drawable-land-xxhdpi/splash.png` (1600x960)
  - `drawable-land-xxxhdpi/splash.png` (1920x1080)
  - `drawable-port-hdpi/splash.png` (480x800)
  - `drawable-port-mdpi/splash.png` (320x480)
  - `drawable-port-xhdpi/splash.png` (720x1280)
  - `drawable-port-xxhdpi/splash.png` (960x1600)
  - `drawable-port-xxxhdpi/splash.png` (1080x1920)
- Gerar para iOS:
  - `Splash.imageset/splash-2732x2732.png` (2732x2732, all 3 scales use mesmo arquivo)

### Passo 4: Atualizar adaptive icon do Android

Atualizar `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

Atualizar `android/app/src/main/res/values/ic_launcher_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#14532d</color>
</resources>
```

### Passo 5: Integrar no pipeline de build

Atualizar `scripts/apply-native-branding.mjs`:
- Chamar `generate-splash-screens.mjs` além do `generate-app-icons.mjs`
- Garantir que ambos usam `sharp` (não `sips`)

Atualizar `package.json`:
- Adicionar `sharp` em devDependencies
- Adicionar script: `"generate:icons": "node scripts/generate-app-icons.mjs"`
- Adicionar script: `"generate:splash": "node scripts/generate-splash-screens.mjs"`
- Adicionar script: `"generate:assets": "node scripts/generate-app-icons.mjs && node scripts/generate-splash-screens.mjs"`

### Passo 6: Atualizar manifest.json

```json
{
  "name": "ControlAGRO - O Fazendeiro",
  "short_name": "ControlAGRO",
  "description": "Gestão de visitas e clientes para o agro.",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#14532d",
  "theme_color": "#166534",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Regras importantes

1. **NÃO usar `sips`** — substituir por `sharp` em todos os scripts
2. **NÃO usar canvas/jimp** — `sharp` é a melhor opção (rápido, suporte a compositing)
3. **Manter os scripts como ES modules** (`.mjs`) usando `import/export`
4. **Manter o padrão existente** de CLI scripts na pasta `scripts/`
5. **O logo SVG deve ser simples e reconhecível** em 20x20px
6. **Ícone do iOS NÃO pode ter transparência** — deve ter fundo sólido
7. **Ícone do Android foreground DEVE ter transparência** e padding de 25%

## Critério de sucesso

- [ ] Logo SVG vetorial criada (limpo, profissional, temática agro)
- [ ] `logo-1024.png` gerado (1024x1024, alta qualidade)
- [ ] Todos os ícones iOS gerados (18 tamanhos) com Contents.json atualizado
- [ ] Todos os ícones Android gerados (5 densidades + adaptive icon com foreground/background)
- [ ] Splash screens gerados para Android (11 variantes portrait+landscape) e iOS (2732x2732)
- [ ] Splash screens com a marca (fundo #14532d, logo centralizada)
- [ ] PWA manifest atualizado com ícones 192 e 512 nos caminhos corretos
- [ ] Scripts funcionam cross-platform (sem `sips`, usando `sharp`)
- [ ] Pipeline `npm run generate:assets` funciona
- [ ] `npm run cap:sync:prod` gera build com os novos assets
