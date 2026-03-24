# FASE 4 — Revisão Offline: Garantir Funcionamento Sem Internet no Capacitor

## Contexto do Projeto

O ControlAGRO é um app Capacitor 8 (iOS/Android) para vendedores agrícolas que visitam propriedades rurais — muitas vezes em áreas sem sinal de internet. O offline-first é o diferencial principal do app. Atualmente o offline já funciona como PWA no navegador, mas **nenhum plugin nativo do Capacitor é utilizado**. O app inteiro depende de APIs do browser (`navigator.onLine`, `navigator.geolocation`, `<input type="file">`, Service Worker) que podem se comportar de forma diferente ou não funcionar dentro do WebView nativo.

## Problemas identificados

### 1. `navigator.onLine` não é confiável no Capacitor
- Dentro do WKWebView (iOS) e Android WebView, `navigator.onLine` pode retornar `true` mesmo sem conectividade real
- O app usa `navigator.onLine` em **mais de 20 pontos** do código para decidir se salva offline ou tenta sync
- Os eventos `online`/`offline` podem não disparar corretamente no WebView

### 2. Service Worker não funciona no Capacitor
- Capacitor serve os assets via `capacitor://` (iOS) ou `https://localhost` (Android)
- Service Workers têm suporte limitado ou inexistente nesses esquemas
- O app registra SW em `app.js` linha 16: `navigator.serviceWorker.register('./sw.js')`
- No contexto nativo, o SW é desnecessário porque os assets já estão bundled — mas o código pode dar erro se tentar registrar

### 3. Geolocalização via browser pode ser menos precisa
- `navigator.geolocation.getCurrentPosition()` funciona no WebView, mas o Capacitor Geolocation plugin oferece melhor integração com GPS nativo e permissões
- Atualmente usado em `app.js` para capturar coordenadas das visitas

### 4. Captura de fotos via `<input type="file">`
- Funciona no WebView mas a experiência é inferior ao plugin nativo
- O Capacitor Camera plugin oferece acesso direto à câmera com preview, compressão, e melhor UX
- Atualmente o app lê o arquivo como base64 para armazenar offline — esse padrão deve ser mantido

### 5. Supabase JS via CDN
- O `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` é carregado via CDN
- No contexto nativo offline, se o app abrir sem cache, essa dependência pode não carregar
- Precisa ser bundled localmente

### 6. Fonts do Google Fonts via CDN
- `fonts.googleapis.com` também é carregado online
- Precisa ter fallback ou ser bundled

## O que precisa ser feito

### Passo 1: Instalar e integrar @capacitor/network

```bash
npm install @capacitor/network
npx cap sync
```

Criar módulo `src/scripts/network-status.js`:
```javascript
(function networkStatusModule(globalScope) {
  let _isConnected = navigator.onLine; // fallback inicial
  let _listeners = [];

  async function init() {
    try {
      // Tenta usar o plugin nativo do Capacitor
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      _isConnected = status.connected;

      Network.addListener('networkStatusChange', (status) => {
        _isConnected = status.connected;
        _listeners.forEach(fn => fn(_isConnected));
      });
    } catch (e) {
      // Fallback para browser (PWA)
      console.log('Capacitor Network não disponível, usando navigator.onLine');
      _isConnected = navigator.onLine;
      window.addEventListener('online', () => {
        _isConnected = true;
        _listeners.forEach(fn => fn(true));
      });
      window.addEventListener('offline', () => {
        _isConnected = false;
        _listeners.forEach(fn => fn(false));
      });
    }
  }

  globalScope.ControlAgroNetwork = {
    init,
    isOnline: () => _isConnected,
    onChange: (fn) => { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
  };
})(window);
```

**IMPORTANTE:** Substituir TODOS os `navigator.onLine` no `app.js` e nos outros módulos pela função centralizada `ControlAgroNetwork.isOnline()`. Substituir os `window.addEventListener('online'/'offline', ...)` por `ControlAgroNetwork.onChange(...)`.

### Passo 2: Instalar e integrar @capacitor/camera

```bash
npm install @capacitor/camera
npx cap sync
```

Criar módulo `src/scripts/camera-handler.js`:
```javascript
(function cameraHandlerModule(globalScope) {

  async function takePhoto() {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Deixa o user escolher câmera ou galeria
        width: 1200,
        height: 1200,
        correctOrientation: true
      });

      return {
        base64: `data:image/${image.format};base64,${image.base64String}`,
        format: image.format
      };
    } catch (e) {
      if (e.message?.includes('cancelled') || e.message?.includes('User cancelled')) {
        return null; // Usuário cancelou, não é erro
      }
      console.warn('Capacitor Camera não disponível, usando fallback de input file');
      return null; // Sinaliza que deve usar o fallback <input>
    }
  }

  globalScope.ControlAgroCamera = {
    takePhoto
  };
})(window);
```

Adaptar o `app.js`:
- O botão `#photoUp` deve primeiro tentar `ControlAgroCamera.takePhoto()`
- Se retornar resultado com base64, usar diretamente (sem precisar de FileReader)
- Se retornar `null`, mostrar o `<input type="file">` como fallback (comportamento atual)
- Manter o padrão de armazenar base64 no sync_queue para upload posterior

### Passo 3: Instalar e integrar @capacitor/geolocation

```bash
npm install @capacitor/geolocation
npx cap sync
```

Criar módulo `src/scripts/geo-handler.js`:
```javascript
(function geoHandlerModule(globalScope) {

  async function getCurrentPosition(options = {}) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      // Verificar permissão primeiro
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location === 'denied') {
        const reqResult = await Geolocation.requestPermissions();
        if (reqResult.location === 'denied') {
          throw new Error('Permissão de localização negada');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        ...options
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (e) {
      // Fallback para browser API
      console.warn('Capacitor Geolocation fallback:', e.message);
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalização não suportada'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, ...options }
        );
      });
    }
  }

  globalScope.ControlAgroGeo = {
    getCurrentPosition
  };
})(window);
```

Substituir as chamadas diretas a `navigator.geolocation.getCurrentPosition` no `app.js` por `ControlAgroGeo.getCurrentPosition()`.

### Passo 4: Bundle do Supabase JS localmente

O `supabase-js` não pode depender de CDN no app nativo. Duas opções (escolher a mais simples):

**Opção A (recomendada):** Baixar o bundle UMD e incluir como arquivo local:
- Baixar `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase-js.min.js`
- Salvar em `src/vendor/supabase-js.min.js`
- No `src/index.html`, trocar o `<script src="https://cdn.jsdelivr.net/npm/...">` por `<script src="./vendor/supabase-js.min.js">`
- Atualizar `scripts/build-web.mjs` para copiar a pasta `vendor/` para `dist/`

**Opção B:** Instalar via npm e usar importmap ou bundler — mais complexo, evitar por enquanto.

### Passo 5: Fonts com fallback local

Atualizar o CSS (`src/styles/app.css`) para ter fallback de system fonts:
```css
/* Mudar de: */
font-family: 'Outfit', sans-serif;
/* Para: */
font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

No `src/index.html`, adicionar `display=swap` no link do Google Fonts (já tem) e considerar tornar o link opcional:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" onerror="this.remove()">
```

### Passo 6: Guard do Service Worker no contexto nativo

No `app.js`, o registro do SW deve ser condicional:
```javascript
// Só registrar SW no browser (PWA), não no Capacitor nativo
if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform()) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW reg:', reg))
      .catch(err => console.error('SW err:', err))
  );
}
```

### Passo 7: Atualizar build-web.mjs

O build script precisa copiar os novos arquivos para `dist/`:
- `src/vendor/` → `dist/vendor/`
- `src/scripts/network-status.js` → `dist/scripts/network-status.js`
- `src/scripts/camera-handler.js` → `dist/scripts/camera-handler.js`
- `src/scripts/geo-handler.js` → `dist/scripts/geo-handler.js`

Atualizar `src/index.html` para incluir os novos scripts:
```html
<script src="./vendor/supabase-js.min.js"></script>
<script src="./scripts/offline-db.js"></script>
<script src="./scripts/network-status.js"></script>
<script src="./scripts/camera-handler.js"></script>
<script src="./scripts/geo-handler.js"></script>
<script src="./scripts/data-loader.js"></script>
<!-- ... resto dos scripts ... -->
```

### Passo 8: Atualizar app.js — inicialização

No início do app (dentro do `DOMContentLoaded`), antes de qualquer coisa:
```javascript
// Inicializar detecção de rede nativa
await ControlAgroNetwork.init();
```

E passar `ControlAgroNetwork.isOnline` para todos os módulos que recebem `isOnline`:
```javascript
// dataLoaders
const loaders = ControlAgroDataLoader.createDataLoaders({
  db,
  offlineDB,
  isOnline: ControlAgroNetwork.isOnline  // em vez de () => navigator.onLine
});

// syncEngine
const syncEngine = ControlAgroSyncEngine.createSyncEngine({
  ...deps,
  isOnline: ControlAgroNetwork.isOnline  // em vez de () => navigator.onLine
});
```

Registrar listener para sync automático quando voltar online:
```javascript
ControlAgroNetwork.onChange((isConnected) => {
  updateOnlineStatus(); // atualizar UI
  if (isConnected && initComplete) syncData(); // tentar sync
});
```

## Regras importantes

1. **NÃO quebrar o funcionamento como PWA no browser** — todos os plugins nativos devem ter fallback para APIs do browser via try/catch com dynamic import
2. **Manter o padrão IIFE** `(function(globalScope) { ... })(window)` para os novos módulos
3. **Os plugins do Capacitor usam ES module imports** (`import('@capacitor/network')`) — isso funciona porque o Capacitor injeta os plugins no runtime nativo. No browser, o dynamic import vai falhar e o fallback será usado
4. **NÃO remover o Service Worker** — ele continua necessário para o PWA funcionar no browser. Só impedir que registre no contexto nativo
5. **Manter base64 como formato de armazenamento offline para fotos** — é o que o sync-engine já espera
6. **Testar mentalmente cada fluxo:** abrir app offline → ver dashboard com dados locais → cadastrar cliente → registrar visita com foto e GPS → tudo salvo no IndexedDB → quando voltar online, sync automático

## Critério de sucesso

- [ ] `@capacitor/network` instalado e integrado — substituiu todos os `navigator.onLine`
- [ ] `@capacitor/camera` instalado e integrado — com fallback para `<input type="file">`
- [ ] `@capacitor/geolocation` instalado e integrado — com fallback para `navigator.geolocation`
- [ ] Supabase JS bundled localmente em `src/vendor/` — não depende de CDN
- [ ] Fonts com fallback de system fonts — não quebra se Google Fonts não carregar
- [ ] Service Worker só registra no browser (PWA), não no Capacitor nativo
- [ ] Todos os módulos recebem `isOnline` do `ControlAgroNetwork` (não mais `navigator.onLine`)
- [ ] `build-web.mjs` copia os novos arquivos (vendor/, novos scripts) para dist/
- [ ] `src/index.html` inclui os novos scripts na ordem correta
- [ ] `npm run cap:sync:prod` funciona sem erros
- [ ] O app PWA no browser continua funcionando normalmente (fallbacks ativos)
