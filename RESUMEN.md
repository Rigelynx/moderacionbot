# RESUMEN - Bot de Discord para Moderación

## Información General
- **Framework:** discord.js v14.14.1
- **Lenguaje:** JavaScript (ES Modules)
- **Entrada principal:** `src/index.js`

## Estructura del Proyecto
```
src/
├── index.js              # Cliente principal, carga comandos y eventos
├── commands/
│   ├── moderation/       # 16 comandos de moderación
│   ├── info/              # 3 comandos de información
│   └── utilities/         # 2 comandos utilitarios
├── events/
│   └── interactionCreate.js  # Maneja comandos slash
├── utils/
│   ├── embeds.js          # Helpers para embeds y logs
│   ├── config.js          # Configuración por servidor (JSON)
│   ├── warnings.js        # Sistema persistente de advertencias (JSON)
│   ├── helpers.js         # Utilidades varias
│   ├── logger.js          # Logging consola
│   └── guildSetup.js      # Setup automático de servidor
└── data/
    ├── config.json        # Configuración por servidor
    └── warnings.json      # Advertencias persistentes
```

## Comandos (21 total)

### Moderación (16)
| Comando | Descripción | Opciones | Permiso requerido |
|---------|-------------|----------|-------------------|
| `/ban` | Banear usuario | usuario, razón | BanMembers |
| `/unban` | Desbanear usuario | id, razón | BanMembers |
| `/kick` | Expulsar usuario | usuario, razón | KickMembers |
| `/mute` | Silenciar usuario | usuario, cantidad, unidad | ModerateMembers |
| `/unmute` | Quitar silencio | usuario | ModerateMembers |
| `/warn` | Advertir usuario (5 warns = ban auto) | usuario, razón | ModerateMembers |
| `/unwarn` | Quitar advertencia | usuario, número (opcional) | ModerateMembers |
| `/warnings` | Ver advertencias | usuario (opcional) | ModerateMembers |
| `/clear` | Eliminar mensajes (1-100) | cantidad | ManageMessages |
| `/setnick` | Cambiar apodo | usuario, apodo | ManageNicknames |
| `/role` | Gestionar roles (subcommands) | create/delete/add/remove/list | ManageRoles |
| `/logs` | Gestionar logs (subcommands) | set/disable/enable/status | ManageGuild |
| `/perm` | Configurar permisos | view/send/embed/manage/speak | ManageChannels |
| `/lock` | Bloquear canal | - | ManageChannels |
| `/unlock` | Desbloquear canal | - | ManageChannels |
| `/slowmode` | Modo lento (0-21600s) | segundos | ManageChannels |

### Info (3)
| Comando | Descripción |
|---------|-------------|
| `/avatar` | Ver avatar de usuario |
| `/userinfo` | Info detallada de usuario |
| `/serverinfo` | Info del servidor |

### Utilidades (2)
| Comando | Descripción |
|---------|-------------|
| `/ping` | Ver latencia |
| `/help` | Mostrar todos los comandos |

## Sistema de Logs
- Canal por defecto: `logs-moderacion`
- Configuración **por servidor** en `data/config.json`
- Funciones: `sendLog()`, `isLogsEnabled()`, `getLogChannelName()`
- Se guarda en cada acción de moderación

## Sistema de Advertencias
- Máximo 5 advertencias
- Al llegar a 5: ban automático (si el bot puede)
- Al desbanear: se resetean las advertencias
- **Almacenamiento persistente** en `data/warnings.json`
- Cada advertencia guarda: razón, moderador, fecha

## Configuración (por servidor)
```json
{
  "guilds": {
    "SERVER_ID": {
      "logs": {
        "enabled": true,
        "channelName": "logs-moderacion"
      }
    }
  }
}
```

## Verificaciones de Seguridad
- Cada comando tiene `default_member_permissions` (Discord oculta comandos sin permiso)
- Protección contra auto-moderación (no puedes banearte/mutearte a ti mismo)
- Protección contra moderar al bot
- Verificación de `bannable`/`kickable` antes de actuar
- Error handler resistente a doble reply

## Colores de Embeds
- Rojo (0xff0000): Ban, Lock, Rol eliminado
- Verde (0x00ff00): Unban, Unlock, Unmute, Clear, SetNick, Unwarn
- Naranja (0xffa500): Kick, Role Remove, Logs desactivados
- Gris (0x808080): Mute, Perm Reset
- Amarillo (0xffff00): Warn, Warnings
- Azul (0x5865f2): Help, Ping, Info, Role List, Log Status

## Helpers Importantes
- `createModerationEmbed({color, title, user, moderator, fields})` - Crea embed (acepta User y GuildMember)
- `sendLog(guild, content, client)` - Envía a canal de logs
- `getStatusEmoji(status)` - Retorna emoji de estado
- `parseDuration(duration)` - Convierte "1h" a milisegundos
- `addWarning(guildId, userId, reason, moderator)` - Agrega advertencia persistente
- `removeWarning(guildId, userId, index)` - Quita advertencia
- `getWarnings(guildId, userId)` - Lista de advertencias
- `clearWarnings(guildId, userId)` - Limpia todas las advertencias

## Setup Automático de Servidor
- Crea canal de logs si no existe (en categoría "Moderación")
- Se ejecuta al conectar y al unirse a nuevo servidor

## Variables de Entorno (.env)
```
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor (opcional, para comandos de prueba)
CLIENT_ID=id_del_bot (opcional, se auto-detecta del token)
```

## Scripts NPM
- `npm start` - Iniciar bot
- `npm run dev` - Iniciar con --watch
- `npm run deploy` - Registrar comandos slash (ejecutar una vez o al cambiar comandos)
