# RESUMEN - Bot de Discord para Moderación

## Información general

- Framework: `discord.js v14.14.1`
- Servidor web: `Express v4.21`
- Lenguaje: `JavaScript ES Modules`
- Entrada principal: `src/index.js`
- Comandos raíz: `49`

## Estructura del proyecto

```text
src/
├── index.js
├── commands/
│   ├── moderation/      # 27 comandos
│   ├── info/            # 5 comandos
│   ├── utilities/       # 13 comandos
│   └── fun/             # 3 comandos
├── events/
│   ├── interactionCreate.js
│   ├── guildMemberAdd.js
│   ├── guildMemberRemove.js
│   ├── messageCreate.js
│   └── messageDelete.js
├── utils/
│   ├── config.js
│   ├── embeds.js
│   ├── guildSetup.js
│   ├── logger.js
│   ├── ticketCore.js
│   ├── ticketStore.js
│   ├── tempbans.js
│   ├── users.js
│   ├── warnings.js
│   └── ...
├── data/
│   ├── config.json
│   ├── tickets.json
│   ├── tempbans.json
│   ├── users.json
│   └── warnings.json
└── web/
    ├── server.js
    ├── routes/
    ├── middleware/
    └── public/
```

## Comandos

### Moderación (27)
- `/ban`, `/softban`, `/tempban`, `/unban`, `/untimeban`, `/massban`, `/massunban`
- `/kick`, `/mute`, `/unmute`
- `/warn`, `/unwarn`, `/warnings`
- `/clear`, `/setnick`, `/removenick`
- `/role`, `/logs`, `/welcome`, `/goodbye`
- `/perm`, `/lock`, `/unlock`, `/slowmode`, `/nuke`, `/vckick`, `/lockdown`

### Información (5)
- `/avatar`
- `/userinfo`
- `/serverinfo`
- `/roleinfo`
- `/channelinfo`

### Utilidades (14)
- `/announce`
- `/poll`
- `/snipe`
- `/membercount`
- `/register`
- `/unregister`
- `/profile`
- `/ticket`
- `/ping`
- `/help`
- `/report`
- `/afk`
- `/unafk`
- `/sugerencias`

### Diversión (3)
- `/8ball`
- `/coinflip`
- `/rps`

## Sistema de tickets profesional

### Capacidades

- Panel configurable desde comandos con embed, botón rápido y selector de tipos.
- Apertura mediante modal para capturar asunto y contexto antes de crear el canal.
- Tipos de ticket configurables con prioridad por defecto, emoji y rol staff opcional por tipo.
- Claim, liberación, asignación manual, cambio de prioridad, renombrado y control de participantes.
- Cierre con razón obligatoria, resumen final opcional y transcript HTML automático.
- Persistencia de tickets abiertos y numeración incremental en `src/data/tickets.json`.

### Subcomandos de `/ticket`

- `/ticket setup` - publica o actualiza el panel
- `/ticket status` - muestra el estado global del sistema
- `/ticket config` - activa sistema, categoría, rol, logs, prefijo, límites y política de cierre
- `/ticket panel` - personaliza el embed y botón del panel
- `/ticket mensaje` - define el texto inicial del ticket
- `/ticket tipos` - lista tipos configurados
- `/ticket tipo_add` - crea un nuevo tipo
- `/ticket tipo_edit` - edita un tipo existente
- `/ticket tipo_remove` - elimina un tipo
- `/ticket claim` - reclama o libera el ticket actual
- `/ticket assign` - asigna el ticket a otro staff
- `/ticket priority` - cambia la prioridad actual
- `/ticket rename` - renombra el canal del ticket
- `/ticket add` - añade participantes
- `/ticket remove` - remueve participantes
- `/ticket close` - cierra el ticket con razón y transcript

### Datos persistidos

`config.json` guarda, por servidor:

```json
{
  "tickets": {
    "enabled": true,
    "categoryId": "123",
    "roleId": "456",
    "logChannelId": "789",
    "panelChannelId": "321",
    "panelMessageId": "654",
    "maxOpenTickets": 1,
    "namePrefix": "ticket",
    "panelTitle": "Centro de Soporte",
    "panelDescription": "Pulsa el botón para abrir un ticket privado con el equipo de soporte.",
    "panelButtonLabel": "Abrir ticket",
    "panelButtonEmoji": "🎫",
    "welcomeMessage": "Hola {user}, ya abrimos tu ticket {ticket}.",
    "mentionStaffOnOpen": true,
    "closeReasonRequired": true,
    "types": [
      {
        "key": "soporte",
        "label": "Soporte General",
        "description": "Ayuda técnica y dudas generales.",
        "emoji": "🛠️",
        "priority": "media",
        "staffRoleId": null
      }
    ]
  }
}
```

`tickets.json` guarda:

```json
{
  "guilds": {
    "SERVER_ID": {
      "counter": 12,
      "channels": {
        "CHANNEL_ID": {
          "ticketNumber": 12,
          "ownerId": "USER_ID",
          "typeKey": "soporte",
          "typeLabel": "Soporte General",
          "priority": "alta",
          "claimedBy": "STAFF_ID",
          "subject": "No puedo usar el comando",
          "description": "El slash command no aparece en el servidor.",
          "controlMessageId": "MESSAGE_ID"
        }
      }
    }
  }
}
```

## Dashboard web

### Landing page (`/`)
- Hero con estadísticas en vivo
- Catálogo de comandos
- Sección destacada del sistema de tickets premium
- CTA para invitar el bot o abrir el dashboard

### Dashboard (`/dashboard`)
- Login con OAuth2 de Discord
- Lista de servidores mutuos con permisos de administrador
- Vista de warnings
- Vista de configuración de logs
- Vista de usuarios registrados

## Sistemas adicionales

- Warnings persistentes con auto-ban al llegar a 5 advertencias
- Tempbans con revisión automática cada minuto
- Welcome/Goodbye con imágenes generadas por `@napi-rs/canvas`
- Registro de usuarios en `users.json`
- Snipe en memoria por canal
- Logs por servidor

## Dependencias principales

```json
{
  "@napi-rs/canvas": "^0.1.97",
  "discord-html-transcripts": "^3.2.0",
  "discord.js": "^14.14.1",
  "express": "^4.21.2",
  "express-session": "^1.18.1",
  "cookie-parser": "^1.4.7",
  "dotenv": "^16.4.5"
}
```

## Variables de entorno

```env
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor_de_pruebas
CLIENT_ID=id_del_bot
CLIENT_SECRET=secret_de_discord_oauth2
SESSION_SECRET=clave_segura_de_sesion
BASE_URL=http://localhost:3000
```

## Scripts

- `npm start`
- `npm run dev`
- `npm run deploy`
