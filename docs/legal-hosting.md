# Hospedagem dos Documentos Legais

Os arquivos em `src/legal/` devem ser hospedados em URL publica para uso nas lojas.

## Arquivos

- `src/legal/politica-privacidade.html` — Politica de Privacidade (LGPD)
- `src/legal/termos-de-uso.html` — Termos de Uso

## Antes de publicar

Preencha todos os placeholders marcados com `[...]` nos arquivos HTML:

- `[NOME DA EMPRESA]`
- `[CNPJ]`
- `[ENDERECO DA EMPRESA]`
- `[EMAIL DE CONTATO]`
- `[DATA DA ULTIMA ATUALIZACAO]`
- `[ANO]`
- `[CIDADE]` e `[ESTADO]` (foro nos termos de uso)

## Opcao 1: GitHub Pages

1. Ativar GitHub Pages no repositorio (Settings > Pages)
2. URLs ficarao em:
   - `https://[usuario].github.io/ControlAGRO-main/legal/politica-privacidade.html`
   - `https://[usuario].github.io/ControlAGRO-main/legal/termos-de-uso.html`

## Opcao 2: Vercel

Se o projeto tiver deploy na Vercel:
- `https://[projeto].vercel.app/legal/politica-privacidade.html`
- `https://[projeto].vercel.app/legal/termos-de-uso.html`

## Opcao 3: Dominio proprio

- `https://controlagro.com.br/privacidade`
- `https://controlagro.com.br/termos`

Redirecionar essas URLs para os respectivos arquivos HTML.

## URLs para configurar nas lojas

- **Apple App Store** → App Privacy → Privacy Policy URL
- **Google Play** → Store Listing → Privacy Policy URL

Ambas as lojas exigem uma URL publica acessivel da politica de privacidade.
A politica tambem e acessivel de dentro do app (icone de escudo no header).
