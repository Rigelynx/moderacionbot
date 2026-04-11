# ModBot - Discord Moderation Bot

![ModBot Cover](https://via.placeholder.com/1200x400/0a0a1a/5865f2?text=ModBot+-+Advanced+Discord+Moderation)

ModBot es un bot de moderación robusto y avanzado para Discord con un panel de control en la web (Dashboard) integrado. Construido con `discord.js` y `express`.

## Características principales

- 49 comandos slash organizados en moderación, información, utilidades y diversión.
- Dashboard web con OAuth2 de Discord para revisar servidores, warnings, usuarios, configuración, permisos opcionales por comando y apariencia.
- Sistema de tickets premium con panel configurable, tipos de ticket, prioridades, claim, asignación, modal de apertura y transcripts HTML.
- Sistema persistente de advertencias con auto-ban al llegar al límite.
- Logs automáticos, bans temporales, welcome/goodbye con `@napi-rs/canvas`, sugerencias, AFK, `unafk`, registro de usuarios y perfil visual configurable.

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
- `/register`, `/unregister`, `/profile`, `/unafk`
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
- Resumen del servidor y configuración de logs.
- Gestión de warnings y usuarios registrados.
- Permisos opcionales por comando con reglas por roles/canales.
- Apariencia del bot en el panel: nombre visible, descripción, color principal y fondos.
- Fondos específicos para `profile`, `welcome` y `goodbye`.

## Perfil visual y fondos

- `/profile` ahora genera una tarjeta visual con `@napi-rs/canvas`.
- El fondo del perfil se puede cambiar desde el dashboard en la sección `Apariencia`.
- Los fondos de `welcome` y `goodbye` se pueden cambiar desde el dashboard o con sus comandos slash.
- Si no configuras ningún fondo ni permisos extra, el bot mantiene su comportamiento normal.

## Despliegue y hosting

- Por defecto, `npm start` levanta el bot y la web en el mismo proceso.
- Para un proyecto como el tuyo, lo más simple es hostear bot y dashboard juntos en el mismo VPS o servicio Node.
- No necesitas separarlo todavía salvo que luego quieras escalar la web por aparte, poner CDN, balanceo o una arquitectura más grande.
- Cuando lo subas a producción, conviene añadir HTTPS, cookies seguras, mejor `SESSION_SECRET`, protección de cabeceras y revisión de rutas administrativas.

## Scripts

- `npm start` - inicia el bot y el servidor web
- `npm run dev` - inicia con `--watch`
- `npm run deploy` - registra los slash commands
