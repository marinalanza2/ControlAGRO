# FASE 6 — Metadata das Lojas (App Store e Google Play)

## Contexto

Para publicar nas lojas, é necessário preencher uma série de campos de metadata: título, descrição, categoria, screenshots, classificação etária, questionário de privacidade, etc. Muito desse conteúdo pode ser preparado antecipadamente em arquivos versionados, para que o processo de submissão seja rápido e consistente.

O ControlAGRO é um app B2B (uso interno por equipes de vendas) do setor agrícola brasileiro, com funcionalidade offline-first.

## O que precisa ser feito

### Passo 1: Criar arquivo de metadata centralizado

Criar `store/metadata.json` com todos os campos necessários para ambas as lojas:

```json
{
  "app_name": "ControlAGRO",
  "subtitle": "Gestão de Visitas Agrícolas",
  "default_locale": "pt-BR",

  "short_description": "Registre visitas, clientes e vendas do agro — mesmo sem internet.",

  "full_description": "O ControlAGRO é a ferramenta ideal para equipes de vendas do setor agrícola. Registre visitas técnicas, gerencie clientes e acompanhe negociações — tudo funcionando mesmo em áreas rurais sem sinal de internet.\n\n✔ FUNCIONA OFFLINE\nRegistre visitas, cadastre clientes e tire fotos mesmo sem conexão. Os dados sincronizam automaticamente quando a internet voltar.\n\n✔ GESTÃO DE VISITAS\nRegistre cada visita com fotos, localização GPS, motivo (prospecção, análise, suporte, pós-venda) e status da negociação.\n\n✔ CADASTRO DE CLIENTES\nMantenha os dados dos clientes organizados: propriedade, culturas, área em hectares, contatos e histórico completo.\n\n✔ ACOMPANHAMENTO COMERCIAL\nAcompanhe o funil de vendas: prospecção → negociação → fechamento. Valores estimados e taxa de conversão na palma da mão.\n\n✔ AGENDA INTELIGENTE\nLembretes de retorno, plantios críticos e follow-ups pendentes organizados automaticamente.\n\n✔ RELATÓRIOS GERENCIAIS\nVisão completa da equipe: visitas realizadas, clientes ativos, negociações em andamento e vendas fechadas.\n\n✔ FOTOS E GPS\nRegistre fotos das visitas e comprove a presença no local com geolocalização automática.\n\nIdeal para:\n• Revendas agrícolas\n• Distribuidores de insumos\n• Cooperativas\n• Equipes de vendas técnicas do agro\n\nDesenvolvido por [NOME DA EMPRESA].",

  "keywords": "agro,vendas,visitas,offline,clientes,agrícola,fazenda,campo,rural,CRM",

  "categories": {
    "apple": {
      "primary": "Business",
      "secondary": "Productivity"
    },
    "google": {
      "category": "Business",
      "tags": ["CRM", "Sales", "Agriculture", "Offline"]
    }
  },

  "content_rating": {
    "apple": "4+",
    "google": "Everyone"
  },

  "contact": {
    "email": "[EMAIL DE SUPORTE]",
    "website": "[URL DO SITE]",
    "phone": "[TELEFONE OPCIONAL]"
  },

  "privacy_policy_url": "[URL DA POLÍTICA DE PRIVACIDADE]",

  "pricing": "free",

  "countries": ["BR"],

  "supported_languages": ["pt-BR"]
}
```

### Passo 2: Criar textos de "O que há de novo" (Release Notes)

Criar `store/release-notes/v1.0.0.txt`:
```
Primeira versão do ControlAGRO!

• Registre visitas técnicas com fotos e localização GPS
• Cadastre e gerencie clientes do setor agrícola
• Funciona offline — sincroniza quando a internet voltar
• Acompanhe o funil de vendas e negociações
• Agenda inteligente com lembretes e follow-ups
• Relatórios gerenciais da equipe
```

### Passo 3: Criar guia de screenshots

Criar `store/screenshots/README.md` com instruções para gerar as screenshots obrigatórias:

```markdown
# Screenshots para as Lojas

## Tamanhos obrigatórios

### Apple App Store
- iPhone 6.7" (1290 x 2796) — obrigatório (iPhone 15 Pro Max)
- iPhone 6.5" (1284 x 2778) — obrigatório (iPhone 14 Plus)
- iPad 12.9" (2048 x 2732) — obrigatório se suportar iPad
- Mínimo: 3 screenshots, máximo: 10

### Google Play
- Mínimo: 2 screenshots, máximo: 8
- Tamanho mínimo: 320px, máximo: 3840px
- Proporção entre 16:9 e 9:16
- Recomendado: 1080 x 1920 (portrait)

## Screenshots recomendadas (6 telas)

1. **Tela de Login** — mostrando o formulário clean com a marca
2. **Dashboard** — agenda inteligente, estatísticas, visitas recentes
3. **Registrar Visita** — formulário com foto, GPS, status de venda
4. **Lista de Clientes** — cards de clientes com propriedade e cidade
5. **Detalhe do Cliente** — informações completas, plantios, histórico
6. **Relatório Gerencial** — métricas da equipe (tela master)

## Como gerar

### Opção 1: Capturas manuais
1. Rodar o app no simulador iOS (Xcode) ou emulador Android (Android Studio)
2. Usar dados de demonstração
3. Capturar com Cmd+S (Xcode) ou botão de screenshot (Android Studio)

### Opção 2: Ferramenta de mockup
Usar ferramentas como:
- screenshots.pro
- mockuphone.com
- Figma com templates de device frames

### Dicas
- Usar dados realistas (nomes de fazendas, cidades de MG, culturas como Soja e Milho)
- Mostrar o badge de "offline" em pelo menos uma screenshot
- Destacar a funcionalidade offline na primeira ou segunda screenshot
- Manter consistência visual (mesmo dispositivo frame em todas)
```

### Passo 4: Criar questionário de privacidade da Apple (App Privacy)

Criar `store/apple-privacy-questionnaire.md`:

```markdown
# Apple App Privacy — Respostas do Questionário

A Apple exige declarar quais dados o app coleta na seção "App Privacy" do App Store Connect.

## Dados coletados

### 1. Contact Info
- **Name** → Coletado (nome do vendedor e dos clientes)
- **Email Address** → Coletado (email do vendedor e dos clientes)
- **Phone Number** → Coletado (telefone do vendedor e dos clientes)
- **Physical Address** → Coletado (endereço da propriedade do cliente)
- Uso: **App Functionality**
- Vinculado à identidade: **Sim**
- Tracking: **Não**

### 2. Location
- **Precise Location** → Coletado (GPS das visitas)
- Uso: **App Functionality**
- Vinculado à identidade: **Sim**
- Tracking: **Não**

### 3. Photos or Videos
- **Photos** → Coletado (fotos das visitas técnicas)
- Uso: **App Functionality**
- Vinculado à identidade: **Sim**
- Tracking: **Não**

### 4. Identifiers
- **User ID** → Coletado (ID do vendedor no Supabase Auth)
- Uso: **App Functionality**
- Vinculado à identidade: **Sim**
- Tracking: **Não**

### 5. Other Data
- **Dados comerciais** → Coletado (culturas, áreas, valores de negociação)
- Uso: **App Functionality**
- Vinculado à identidade: **Sim**
- Tracking: **Não**

## Dados NÃO coletados
- Financial Info
- Health & Fitness
- Browsing History
- Search History
- Diagnostics
- Advertising Data
- Usage Data (analytics)

## Declarações
- O app **NÃO** faz tracking para publicidade
- O app **NÃO** usa SDKs de analytics terceiros
- O app **NÃO** compartilha dados com data brokers
- Todos os dados são usados exclusivamente para funcionalidade do app
```

### Passo 5: Criar questionário de segurança de dados do Google Play (Data Safety)

Criar `store/google-data-safety.md`:

```markdown
# Google Play Data Safety — Respostas do Questionário

O Google Play exige um formulário de "Data Safety" declarando coleta e uso de dados.

## Perguntas e respostas

### O app coleta ou compartilha dados de usuário?
**Sim**, o app coleta dados.

### O app coleta dados?
**Sim**

### Todos os dados coletados são criptografados em trânsito?
**Sim** (HTTPS/TLS para todas as comunicações com Supabase)

### O app oferece mecanismo para o usuário solicitar exclusão de dados?
**Sim** (mediante contato com o gestor ou email de suporte)

## Tipos de dados coletados

### Localização
- **Localização precisa** → Coletado
- Obrigatório: Sim (para registro de visitas)
- Finalidade: Funcionalidade do app

### Informações pessoais
- **Nome** → Coletado
- **Endereço de email** → Coletado
- **Endereço** → Coletado (propriedade do cliente)
- **Telefone** → Coletado
- Obrigatório: Sim
- Finalidade: Funcionalidade do app, Gerenciamento de conta

### Fotos e vídeos
- **Fotos** → Coletado
- Obrigatório: Não (opcional por visita)
- Finalidade: Funcionalidade do app

### Identificadores de app
- **ID de usuário** → Coletado
- Obrigatório: Sim
- Finalidade: Funcionalidade do app, Gerenciamento de conta

## Declarações
- Os dados **NÃO** são compartilhados com terceiros
- Os dados **NÃO** são usados para publicidade
- Os dados **NÃO** são usados para tracking entre apps
- O processamento de dados segue a LGPD brasileira
```

### Passo 6: Criar guia completo de submissão

Criar `store/SUBMISSION-GUIDE.md`:

```markdown
# Guia de Submissão — ControlAGRO

## Pré-requisitos

### Apple App Store
- [ ] Conta Apple Developer ($99/ano) — https://developer.apple.com
- [ ] Mac com Xcode instalado (para gerar o Archive)
- [ ] Certificado de distribuição configurado no Xcode
- [ ] App Store Connect: criar o app com Bundle ID `br.com.controlagro.app`

### Google Play
- [ ] Conta Google Play Developer ($25 taxa única) — https://play.google.com/console
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
   - Inserir URL da política de privacidade
   - Selecionar o build enviado
   - Enviar para Review

## Passos para Google Play

1. **Preparar o build**
   ```bash
   npm run release:android
   ```
2. **O AAB estará em:** `android/app/build/outputs/bundle/release/app-release.aab`
3. **Google Play Console:**
   - Criar o app (Produção → Criar nova versão)
   - Upload do AAB
   - Preencher Store Listing (usar `store/metadata.json`)
   - Upload screenshots (ver `store/screenshots/README.md`)
   - Preencher Data Safety (usar `store/google-data-safety.md`)
   - Inserir URL da política de privacidade
   - Definir países (Brasil)
   - Definir classificação etária (Todos)
   - Enviar para Review

## Tempo estimado de review
- Apple: 24-48 horas (primeira submissão pode levar mais)
- Google: 3-7 dias (primeira submissão costuma levar mais)

## Motivos comuns de rejeição e como evitar
- **Sem política de privacidade** → ✅ Já criada na Fase 5
- **Screenshots genéricas ou de baixa qualidade** → Usar dados realistas
- **App crashando** → Testar em dispositivo real antes de enviar
- **Funcionalidade incompleta** → Garantir que login, visitas, clientes e sync funcionam
- **Permissões sem justificativa** → ✅ Textos de permissão já configurados (câmera, GPS, galeria)
- **Login de teste não fornecido** → Fornecer credenciais de teste na submissão da Apple
```

## Regras importantes

1. **Todos os placeholders `[...]` devem ser claramente marcados** para preenchimento manual
2. **Idioma principal: Português (Brasil)** — as lojas suportam localização por idioma
3. **A descrição completa deve ter entre 800 e 4000 caracteres** (requisito do Google Play)
4. **Keywords da Apple são limitadas a 100 caracteres** total, separadas por vírgula, sem espaços
5. **NÃO mencionar "a outra plataforma"** na descrição (ex: não dizer "também disponível no Android" na App Store)
6. **Estrutura de pastas `store/`** deve ficar na raiz do projeto (não dentro de `src/` — não são assets do app)

## Estrutura final esperada

```
store/
  metadata.json
  release-notes/
    v1.0.0.txt
  screenshots/
    README.md
  apple-privacy-questionnaire.md
  google-data-safety.md
  SUBMISSION-GUIDE.md
```

## Critério de sucesso

- [ ] `store/metadata.json` criado com todos os campos para ambas as lojas
- [ ] Descrição curta (≤80 chars) e descrição completa (800-4000 chars) redigidas em PT-BR
- [ ] Keywords otimizadas (≤100 chars total para Apple)
- [ ] `store/release-notes/v1.0.0.txt` criado
- [ ] `store/screenshots/README.md` com instruções claras de tamanhos e telas recomendadas
- [ ] `store/apple-privacy-questionnaire.md` completo com respostas prontas
- [ ] `store/google-data-safety.md` completo com respostas prontas
- [ ] `store/SUBMISSION-GUIDE.md` com passo a passo detalhado para ambas as lojas
- [ ] Todos os placeholders marcados com `[...]`
- [ ] Categorias corretas selecionadas (Business para ambas)
- [ ] Classificação etária definida (4+ / Everyone)
