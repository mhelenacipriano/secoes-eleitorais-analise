#!/bin/bash
# Agenda no Mac a atualização automática das listas do TSE, às 06:35, 11:35, 15:35 e 20:35 (10 min depois de cada atualização do TSE).
# Usa o launchd (LaunchAgent do seu usuário): se o Mac estiver dormindo no horário, a tarefa roda assim que ele acordar.
# O painel bloqueia servidores, então precisa ser no seu computador, com a sessão aberta (abre o Chrome por alguns segundos).
#
# Uso:   bash scripts/agendar-mac.sh [caminho-do-clone-da-consulta]     (instalar)
#        bash scripts/agendar-mac.sh --remover                          (desinstalar)
#        bash scripts/agendar-mac.sh --agora                            (rodar uma vez já, para testar)
# Antes: o git precisa conseguir dar push sem pedir senha (chave SSH ou credencial salva no Keychain).
set -e
ROTULO="br.secoes-eleitorais.atualizar"
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$HOME/Library/Logs/secoes-eleitorais-atualizacao.log"

if [ "$1" = "--remover" ]; then
  launchctl bootout "gui/$(id -u)/$ROTULO" 2>/dev/null || true
  rm -f "$PLIST"; echo "Agendamento removido."; exit 0
fi
if [ "$1" = "--agora" ]; then launchctl kickstart -k "gui/$(id -u)/$ROTULO"; echo "Rodando. Acompanhe: tail -f $LOG"; exit 0; fi

NODE="$(command -v node)" || { echo "Node não encontrado no PATH."; exit 1; }
CONSULTA="${1:-}"
if [ -n "$CONSULTA" ]; then CONSULTA="$(cd "$CONSULTA" && pwd)"; fi
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$ROTULO</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$RAIZ/scripts/atualizar-tudo.mjs</string></array>
  <key>WorkingDirectory</key><string>$RAIZ</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>$(dirname "$NODE"):/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    <key>CONSULTA_DIR</key><string>$CONSULTA</string>
  </dict>
  <key>StartCalendarInterval</key><array>
    <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>35</integer></dict>
    <dict><key>Hour</key><integer>11</integer><key>Minute</key><integer>35</integer></dict>
    <dict><key>Hour</key><integer>15</integer><key>Minute</key><integer>35</integer></dict>
    <dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>35</integer></dict>
  </array>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
PL

launchctl bootout "gui/$(id -u)/$ROTULO" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Agendado: 06:35, 11:35, 15:35 e 20:35 (horário do Mac; ajuste o fuso se não for Brasília)."
echo "Análise: $RAIZ"; echo "Consulta: ${CONSULTA:-(não configurada)}"
echo "Log: $LOG    Testar agora: bash scripts/agendar-mac.sh --agora"
echo "Se o macOS pedir, permita o Terminal/Node em Ajustes do Sistema → Privacidade e Segurança."
