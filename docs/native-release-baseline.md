# Native Release Baseline

## Permissoes aplicadas

Android:

- Internet
- Localizacao aproximada
- Localizacao precisa
- Camera

iOS:

- Camera
- Localizacao em uso
- Biblioteca de fotos

## Scripts por ambiente

- `npm run cap:sync`
- `npm run cap:sync:dev`
- `npm run cap:sync:homolog`
- `npm run cap:sync:prod`

Esses scripts agora:

1. atualizam o `capacitor.config.json`
2. geram os assets web do ambiente
3. executam `cap sync`
4. reaplicam identidade nativa e permissoes

## Status dos itens de release

- [x] Supabase credentials por ambiente (config/environments/)
- [x] Icones e splash finais gerados (sharp, todas densidades)
- [x] Versionamento centralizado (config/version.json + bump-version.mjs)
- [x] Android signing configurado (keystore.properties)
- [x] Plugins nativos Capacitor (Network, Camera, Geolocation)
- [x] Supabase JS bundled local (sem CDN)
- [x] Service Worker guard para native
- [x] Politica de privacidade e termos de uso
- [x] Tela de consentimento LGPD
- [x] Metadata das lojas preparada
- [x] Script doctor.mjs com diagnostico completo

## Pendente (manual)

- Preencher credenciais prod reais em `config/environments/prod.json`
- Preencher placeholders `[...]` nos documentos legais e store metadata
- Gerar screenshots para as lojas
- Validar build em dispositivo real (Android + iOS)
- Criar conta de teste para Apple review
