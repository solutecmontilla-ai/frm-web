# FRM Web — Portal de Torneos de Fútbol

Portal web de la Liga FRM para mostrar resultados, tablas de posiciones, goleadores y playoff de los torneos Liga +40 y Liga +35.

## Tecnología

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Datos**: JSON files en `public/data/` (actualizados por el bot de Telegram)
- **Bot**: Node.js con `node-telegram-bot-api` (corre en VPS via PM2)

## Estructura de datos

```
public/data/
├── torneo40/
│   ├── meta.json        # Info del torneo
│   ├── standings.json   # Tabla de posiciones
│   ├── results.json     # Resultados por jornada
│   ├── scorers.json     # Tabla de goleadores
│   ├── upcoming.json    # Próximos partidos
│   └── playoff.json     # Bracket eliminatorio
└── torneo35/
    └── (misma estructura)
```

## Comandos

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Deploy al VPS
./deploy.sh <usuario_cwp> <dominio>
```

## Bot de Telegram

El bot actualiza los JSON files en el servidor. Ver `bot/` para configuración.

```bash
cd bot
npm install
cp .env.example .env
# Editar .env con BOT_TOKEN y ADMIN_IDS
node bot.js
```

### Comandos del bot

| Comando | Descripción |
|---|---|
| `/tabla40` | Tabla de posiciones Liga +40 |
| `/tabla35` | Tabla de posiciones Liga +35 |
| `/goles40` | Goleadores Liga +40 |
| `/r40 Real Maracay 3-1 Golazo J10` | Registrar resultado |
| `/r40 ... \| Ruiz(2) Cuellar(1) \| Briceño(1)` | Con goleadores |
| `/proximo40 Golazo vs Casa Italia \| Sabado 15:30 La Trinidad` | Programar partido |
| `/borrarproximos40` | Borrar programación |
| `/playoff40 SF Real Maracay 2-1 Agape` | Actualizar bracket |
| `/recalcular40` | Recalcular tabla y goleadores |

## Deploy en VPS (CWP)

1. Construir: `npm run build`
2. Subir `dist/` al document root del dominio en CWP
3. Instalar bot: subir `bot/`, instalar deps, configurar `.env`, iniciar con PM2

```bash
pm2 start bot.js --name frm-bot
pm2 save
```
