#!/bin/bash
# Script de deploy al VPS — FRM Web
# Uso: ./deploy.sh <usuario_cwp> <dominio>
# Ej:  ./deploy.sh frmweb frm.tudominio.com

set -e

USER="amaysgr"
DOMAIN="frm.amaysgroup.com"
VPS="66.94.111.124"
PORT="2327"
SSH_KEY="~/.ssh/id_ed25519"
REMOTE_HOME="/home/$USER/$DOMAIN"
BOT_DIR="/home/$USER/frm-bot"

echo "=== Build del frontend ==="
npm run build

echo "=== Subir dist/ al servidor ==="
rsync -avz --delete \
  -e "ssh -p $PORT -i $SSH_KEY -o StrictHostKeyChecking=no" \
  dist/ \
  root@$VPS:$REMOTE_HOME/

echo "=== Subir bot/ al servidor ==="
rsync -avz --exclude='.env' --exclude='node_modules' \
  -e "ssh -p $PORT -i $SSH_KEY -o StrictHostKeyChecking=no" \
  bot/ \
  root@$VPS:$BOT_DIR/

echo "=== Instalar dependencias del bot en el servidor ==="
ssh -p $PORT -i $SSH_KEY -o StrictHostKeyChecking=no root@$VPS \
  "cd $BOT_DIR && npm install --production"

echo "=== Reiniciar bot con PM2 ==="
ssh -p $PORT -i $SSH_KEY -o StrictHostKeyChecking=no root@$VPS \
  "pm2 delete frm-bot 2>/dev/null || true; pm2 start $BOT_DIR/bot.js --name frm-bot; pm2 save"

echo ""
echo "=== Deploy completado ==="
echo "Web: https://$DOMAIN"
echo ""
echo "IMPORTANTE: Verificar que el bot tenga .env configurado:"
echo "  ssh -p $PORT -i $SSH_KEY root@$VPS"
echo "  nano $BOT_DIR/.env"
echo ""
echo "Contenido del .env:"
echo "  BOT_TOKEN=<token de @BotFather>"
echo "  ADMIN_IDS=<tu_telegram_id>"
echo "  DATA_PATH=$REMOTE_HOME/data"
