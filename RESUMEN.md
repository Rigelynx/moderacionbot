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
│   ├── moderation/       # 14 comandos de moderación
│   ├── info/              # 3 comandos de información
│   └── utilities/         # 2 comandos utilitarios
├── events/
│   └── interactionCreate.js  # Maneja comandos slash
└── utils/
    ├── embeds.js          # Helpers para embeds y logs
    ├── config.js          # Gestión de configuración JSON
    ├── helpers.js         # Utilidades varias
    ├── logger.js          # Logging consola
    └── guildSetup.js      # Setup automático de servidor
```

## Comandos (19 total)

### Moderación (14)
| Comando | Descripción | Opciones |
|---------|-------------|----------|
| `/ban` | Banear usuario | usuario, razón |
| `/unban` | Desbanear usuario | usuario, razón |
| `/kick` | Expulsar usuario | usuario, razón |
| `/mute` | Silenciar usuario | usuario, cantidad, unidad (s/m/h/d) |
| `/unmute` | Quitar silencio | usuario |
| `/warn` | Advertir usuario (5 warns = ban auto) | usuario, razón |
| `/warnings` | Ver advertencias | usuario (opcional) |
| `/clear` | Eliminar mensajes (1-100) | cantidad |
| `/setnick` | Cambiar apodo | usuario, apodo |
| `/role` | Gestionar roles (subcommands) | create/delete/add/remove/list |
| `/logs` | Gestionar logs (subcommands) | set/disable/enable/status |
| `/perm` | Configurar permisos | view/send/embed/manage/speak |
| `/lock` | Bloquear canal | - |
| `/unlock` | Desbloquear canal | - |
| `/slowmode` | Modo lento (0-21600s) | segundos |

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
- Configuración en `data/config.json`
- Funciones: `sendLog()`, `isLogsEnabled()`, `getLogChannelName()`
- Se guarda en cada acción de moderación

## Sistema de Advertencias
- Máximo 5 advertencias
- Al llegar a 5: ban automático
- Al desbanear: se resetean las advertencias
- Almacenamiento en memoria (`client.warningCounts`)

## Configuración
```json
{
  "logs": {
    "enabled": true,
    "channelName": "logs-moderacion"
  }
}
```

## Colores de Embeds
- Rojo (0xff0000): Ban, Lock
- Verde (0x00ff00): Unban, Unlock, Unmute, Clear, SetNick
- Naranja (0xffa500): Kick, Role Remove
- Gris (0x808080): Mute, Perm Reset
- Amarillo (0xffff00): Warn, Warnings
- Azul (0x5865f2): Help, Ping, Info

## Helpers Importantes
- `createModerationEmbed({color, title, user, moderator, fields})` - Crea embed de moderación
- `sendLog(guild, content, client)` - Envía a canal de logs
- `getStatusEmoji(status)` - Retorna emoji de estado
- `parseDuration(duration)` - Convierte "1h" a milisegundos

## Setup Automático de Servidor
- Crea rol "Silenciado" si no existe
- Crea canal de logs si no existe (en categoría "Moderación")
- Se ejecuta al conectar y al unirse a nuevo servidor

## Variables de Entorno (.env)
```
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor (opcional, para comandos de prueba)
```

## Scripts NPM
- `npm start` - Iniciar bot
- `npm run dev` - Iniciar con --watch
- `npm run deploy` - Registrar comandos slash
