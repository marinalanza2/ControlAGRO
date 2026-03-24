#!/bin/bash
set -e

KEYSTORE_PATH="android/controlagro-release.keystore"

if [ -f "$KEYSTORE_PATH" ]; then
  echo "Keystore ja existe em $KEYSTORE_PATH"
  echo "Remova-o manualmente se quiser gerar um novo."
  exit 1
fi

echo "Gerando keystore de release para ControlAGRO..."
echo ""

keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias controlagro \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=ControlAGRO, OU=Mobile, O=O Fazendeiro, L=Belo Horizonte, ST=MG, C=BR"

echo ""
echo "Keystore gerado em: $KEYSTORE_PATH"
echo ""
echo "Proximo passo: copie android/keystore.properties.example para android/keystore.properties"
echo "e preencha com a senha usada acima."
