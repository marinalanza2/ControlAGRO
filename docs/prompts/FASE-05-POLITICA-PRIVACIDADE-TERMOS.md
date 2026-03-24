# FASE 5 — Política de Privacidade, Termos de Uso e Tela de Consentimento

## Contexto

Tanto a Apple App Store quanto a Google Play Store **exigem obrigatoriamente** uma política de privacidade acessível antes de aprovar qualquer app. A Apple também exige que o app tenha um link de política de privacidade acessível de dentro do app. A LGPD (Lei Geral de Proteção de Dados — Brasil) exige consentimento explícito para coleta de dados pessoais.

O ControlAGRO coleta os seguintes dados:
- **Dados pessoais dos vendedores:** nome, email, telefone
- **Dados pessoais dos clientes (terceiros):** nome, CPF/CNPJ, telefone, email, endereço da propriedade, cidade, estado
- **Dados de localização:** latitude/longitude das visitas (via GPS)
- **Fotos:** imagens das visitas técnicas
- **Dados de uso:** informações de culturas, plantios, valores estimados de vendas

O backend é **Supabase** (hospedado na AWS, região configurável). Os dados ficam armazenados localmente via **IndexedDB** e sincronizados com o servidor.

## O que precisa ser feito

### Passo 1: Criar página de Política de Privacidade (HTML hospedável)

Criar `src/legal/politica-privacidade.html` — uma página HTML standalone (sem dependências do app) que pode ser:
- Hospedada no site da empresa (ex: controlagro.com.br/privacidade)
- Servida dentro do app via link
- Apontada nas configurações das lojas

Conteúdo deve cobrir:

1. **Identificação do responsável**
   - Nome: O Fazendeiro (ou nome da empresa real — deixar como placeholder editável: `[NOME DA EMPRESA]`, `[CNPJ]`, `[ENDEREÇO]`, `[EMAIL DE CONTATO]`)

2. **Dados coletados**
   - Dados de cadastro (nome, email, telefone dos vendedores)
   - Dados de clientes registrados (nome, CPF/CNPJ, telefone, email, endereço, propriedade)
   - Dados de localização (GPS das visitas)
   - Fotografias (imagens das visitas técnicas)
   - Dados comerciais (culturas, plantios, valores estimados)

3. **Finalidade da coleta**
   - Gestão de equipe de vendas e visitas técnicas
   - Registro e acompanhamento de clientes do setor agrícola
   - Geolocalização para comprovação de visitas realizadas
   - Relatórios gerenciais internos

4. **Base legal (LGPD)**
   - Execução de contrato ou procedimentos preliminares (Art. 7°, V)
   - Legítimo interesse do controlador (Art. 7°, IX)
   - Consentimento do titular quando aplicável (Art. 7°, I)

5. **Compartilhamento de dados**
   - Supabase (infraestrutura de banco de dados — provedor cloud)
   - Não há venda ou compartilhamento com terceiros para fins de marketing
   - Dados podem ser acessados pelo gestor da equipe

6. **Armazenamento e segurança**
   - Dados armazenados em servidores Supabase (PostgreSQL com criptografia em trânsito e repouso)
   - Armazenamento local no dispositivo via IndexedDB (dados cacheados para funcionamento offline)
   - Autenticação via Supabase Auth com tokens JWT
   - Row Level Security (RLS) no banco de dados

7. **Retenção de dados**
   - Dados mantidos enquanto o vendedor estiver ativo
   - Exclusão mediante solicitação ao gestor ou email de contato

8. **Direitos do titular (LGPD Art. 18)**
   - Confirmação de tratamento
   - Acesso aos dados
   - Correção de dados incompletos ou desatualizados
   - Eliminação de dados desnecessários
   - Portabilidade
   - Revogação do consentimento

9. **Permissões do aplicativo**
   - Câmera: para registrar fotos das visitas técnicas
   - Localização: para registrar coordenadas GPS das visitas
   - Galeria de fotos: para selecionar imagens existentes
   - Internet: para sincronização com o servidor
   - Armazenamento local: para funcionamento offline

10. **Contato**
    - Email: `[EMAIL DE CONTATO]`
    - Endereço: `[ENDEREÇO DA EMPRESA]`

11. **Alterações nesta política**
    - Notificação dentro do app ou por email
    - Data da última atualização

**Estilo:** página limpa, fundo branco, fonte legível (system fonts), responsiva, sem dependências externas. Idioma: Português (Brasil).

### Passo 2: Criar página de Termos de Uso (HTML hospedável)

Criar `src/legal/termos-de-uso.html` — mesma estrutura da política de privacidade.

Conteúdo deve cobrir:

1. **Aceitação dos termos** — ao usar o app, o usuário aceita os termos
2. **Descrição do serviço** — app de gestão de visitas e clientes para equipes de vendas do setor agrícola
3. **Cadastro e conta** — responsabilidade sobre credenciais, uma conta por vendedor, acesso gerenciado pelo gestor
4. **Uso permitido** — registro de visitas, clientes, fotos, contatos comerciais do setor agrícola
5. **Uso proibido** — não usar para fins ilegais, não tentar acessar dados de outros vendedores, não fazer engenharia reversa
6. **Dados de terceiros** — o vendedor é responsável por informar os clientes sobre a coleta de dados e obter consentimento quando necessário
7. **Propriedade intelectual** — o app e seu código pertencem a `[NOME DA EMPRESA]`
8. **Disponibilidade** — o app pode funcionar offline, mas a sincronização depende de internet; não há garantia de disponibilidade 100%
9. **Limitação de responsabilidade** — a empresa não se responsabiliza por perda de dados locais (dispositivo danificado/perdido)
10. **Alterações nos termos** — a empresa pode alterar os termos com notificação prévia
11. **Foro** — Comarca de `[CIDADE]`, Estado de `[ESTADO]`

### Passo 3: Tela de consentimento no primeiro login

Adicionar no `app.js` — após o login bem-sucedido e **antes** de acessar o dashboard pela primeira vez:

- Verificar `localStorage` flag `controlagro_terms_accepted`
- Se não aceito, mostrar modal com:
  - Título: "Termos de Uso e Privacidade"
  - Texto resumido: "Ao usar o ControlAGRO, você concorda com nossos Termos de Uso e Política de Privacidade. O app coleta dados de localização, fotos e informações de clientes para gestão de visitas."
  - Link "Ler Política de Privacidade completa" → abre `politica-privacidade.html` (usar `window.open` ou `Capacitor.Plugins.Browser.open` se disponível)
  - Link "Ler Termos de Uso completos" → abre `termos-de-uso.html`
  - Checkbox: "Li e aceito os Termos de Uso e a Política de Privacidade"
  - Botão "Continuar" (só habilitado com checkbox marcado)
- Ao aceitar: salvar `controlagro_terms_accepted` com timestamp no localStorage
- **NÃO bloquear uso offline** se os termos já foram aceitos anteriormente

Estilo do modal: consistente com o design do app (verde #166534, fonte Outfit, border-radius arredondado).

### Passo 4: Link de política dentro do app (requisito Apple)

Adicionar no app um local permanente para acessar a política:
- Na seção de "perfil" ou no header/menu, adicionar link "Política de Privacidade"
- Ao clicar, abrir a página HTML no browser nativo
- Pode ser um item discreto no rodapé do dashboard ou dentro de um menu "Sobre"

### Passo 5: Atualizar build para incluir os arquivos legais

Atualizar `scripts/build-web.mjs`:
- Copiar `src/legal/` → `dist/legal/`
- Esses arquivos ficam acessíveis dentro do app e também podem ser hospedados separadamente

### Passo 6: Criar links hospedáveis para as lojas

As lojas pedem URL pública da política de privacidade. Criar `docs/legal-hosting.md` com instruções:
```markdown
# Hospedagem dos Documentos Legais

Os arquivos em `src/legal/` devem ser hospedados em URL pública para uso nas lojas:

## Opção 1: GitHub Pages
1. Ativar GitHub Pages no repositório
2. URLs ficarão em: https://[usuario].github.io/ControlAGRO-main/legal/politica-privacidade.html

## Opção 2: Vercel
Como o projeto já tem deploy na Vercel:
- https://[projeto].vercel.app/legal/politica-privacidade.html
- https://[projeto].vercel.app/legal/termos-de-uso.html

## Opção 3: Domínio próprio
- https://controlagro.com.br/privacidade
- https://controlagro.com.br/termos

## URLs para configurar nas lojas
- Apple App Store → App Privacy → Privacy Policy URL
- Google Play → Store Listing → Privacy Policy URL
```

## Regras importantes

1. **Todos os placeholders `[...]` devem ser claramente marcados** para o Gustavo preencher com os dados reais da empresa
2. **Idioma: Português (Brasil)** — todo o conteúdo jurídico em PT-BR
3. **LGPD compliance é obrigatório** — o app opera no Brasil
4. **As páginas HTML devem ser standalone** — sem dependências do app (CSS inline, sem JS externo)
5. **Manter o padrão IIFE** para qualquer JS novo no app.js
6. **NÃO usar termos jurídicos excessivamente complexos** — manter linguagem clara e acessível
7. **A tela de consentimento NÃO deve aparecer no modo offline com sessão salva** — só no primeiro login online ou se os termos foram atualizados

## Critério de sucesso

- [ ] `src/legal/politica-privacidade.html` criada — completa, LGPD-compliant, responsiva, standalone
- [ ] `src/legal/termos-de-uso.html` criados — completos, claros, standalone
- [ ] Ambos os arquivos têm placeholders `[...]` claramente marcados para dados da empresa
- [ ] Modal de consentimento aparece no primeiro login (antes do dashboard)
- [ ] Checkbox + botão "Continuar" funcional
- [ ] Flag de aceitação salva no localStorage com timestamp
- [ ] Link permanente para política de privacidade acessível de dentro do app
- [ ] `build-web.mjs` copia `src/legal/` para `dist/legal/`
- [ ] `docs/legal-hosting.md` criado com instruções de hospedagem
- [ ] O fluxo offline não é bloqueado se termos já foram aceitos anteriormente
