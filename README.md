# ModBot - Discord Moderation Bot

Bot de moderación para Discord construido con `discord.js` y `express`, con dashboard web, persistencia local en JSON y un sistema de tickets profesional configurable por comandos.

## Características principales

- 48 comandos slash organizados en moderación, información, utilidades y diversión.
- Dashboard web con OAuth2 de Discord para revisar servidores, warnings y configuración.
- Sistema de tickets premium con panel configurable, tipos de ticket, prioridades, claim, asignación, modal de apertura y transcripts HTML.
- Sistema persistente de advertencias con auto-ban al llegar al límite.
- Logs automáticos, bans temporales, welcome/goodbye con `@napi-rs/canvas`, sugerencias, AFK y registro de usuarios.

## Sistema de tickets premium

El comando `/ticket` ahora controla un flujo mucho más completo:

- Panel configurable con `/ticket panel` y publicación con `/ticket setup`.
- Tipos de ticket configurables con `/ticket tipos`, `/ticket tipo_add`, `/ticket tipo_edit` y `/ticket tipo_remove`.
- Apertura mediante botón rápido o selector de tipo desde el panel.
- Modal de apertura para capturar asunto y contexto antes de crear el canal.
- Prioridades por ticket: `baja`, `media`, `alta`, `urgente`.
- Gestión interna con `/ticket claim`, `/ticket assign`, `/ticket priority`, `/ticket rename`, `/ticket add`, `/ticket remove`.
- Cierre profesional con `/ticket close`, razón obligatoria y transcript `.html`.
- Persistencia de tickets y contador en `src/data/tickets.json`.

## Comandos destacados

### Moderación
- `/ban`, `/softban`, `/tempban`, `/unban`, `/untimeban`, `/massban`, `/massunban`
- `/kick`, `/mute`, `/unmute`
- `/warn`, `/unwarn`, `/warnings`
- `/clear`, `/slowmode`, `/lock`, `/unlock`, `/lockdown`, `/nuke`, `/vckick`
- `/role`, `/perm`, `/logs`, `/welcome`, `/goodbye`

### Información
- `/avatar`, `/userinfo`, `/serverinfo`, `/roleinfo`, `/channelinfo`

### Utilidades
- `/announce`, `/poll`, `/snipe`, `/membercount`
- `/register`, `/unregister`, `/profile`
- `/ticket`
- `/ping`, `/help`, `/report`, `/afk`, `/sugerencias`

### Diversión
- `/8ball`, `/coinflip`, `/rps`

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar `.env`
```env
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor_de_pruebas
CLIENT_ID=id_del_bot_discord
CLIENT_SECRET=secret_de_discord_oauth2
SESSION_SECRET=una_cadena_segura_para_la_sesion
BASE_URL=http://localhost:3000
```

### 3. Registrar comandos
```bash
npm run deploy
```

### 4. Iniciar el bot
```bash
npm start
```

## Setup rápido de tickets

1. `/ticket config habilitado:true categoria:#tickets rol_staff:@staff canal_logs:#ticket-logs`
2. `/ticket panel titulo:"Centro de soporte" descripcion:"Selecciona el tipo de ticket o usa el botón rápido." boton:"Abrir ticket" emoji:🎫`
3. `/ticket mensaje bienvenida:"Hola {user}, ya abrimos tu ticket {ticket}. Tipo: {type}. Prioridad: {priority}."`
4. `/ticket tipo_add clave:alianzas nombre:"Alianzas" descripcion:"Solicitudes de alianza y colaboraciones." prioridad:media emoji:🤝`
5. `/ticket setup canal:#abrir-ticket`

## Estructura relevante

```text
src/
├── commands/utilities/ticket.js   # Suite completa de tickets
├── events/interactionCreate.js    # Slash commands, botones, select menus y modals
├── utils/ticketCore.js            # Flujo de apertura, claim, prioridad, asignación y cierre
├── utils/ticketStore.js           # Persistencia de tickets abiertos y contador
├── utils/config.js                # Configuración por servidor
├── data/config.json               # Configuración persistente
├── data/tickets.json              # Tickets activos y numeración
└── web/                           # Landing + dashboard Express
```

## Panel web

Abre `http://localhost:3000` para ver:

- Landing pública con estadísticas en vivo y catálogo de comandos.
- Dashboard con login por Discord.
- Resumen de servidores, warnings y configuración básica.

## Scripts

- `npm start` - inicia el bot y el servidor web
- `npm run dev` - inicia con `--watch`
- `npm run deploy` - registra los slash commands
