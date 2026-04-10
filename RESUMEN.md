# RESUMEN - Bot de Discord para Moderación

## Información General
- **Framework:** discord.js v14.14.1
- **Servidor Web:** Express v4.21
- **Lenguaje:** JavaScript (ES Modules)
- **Entrada principal:** `src/index.js`

## Estructura del Proyecto
```
src/
├── index.js              # Cliente principal, carga comandos, eventos y servidor web
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
├── data/
│   ├── config.json        # Configuración por servidor
│   └── warnings.json      # Advertencias persistentes
└── web/
    ├── server.js              # Servidor Express (puerto 3000)
    ├── routes/
    │   ├── auth.js            # OAuth2 Discord (login, callback, logout, /me)
    │   └── api.js             # API REST (stats, guilds, warnings, config)
    ├── middleware/
    │   └── authMiddleware.js  # Verificación de sesión + permisos admin
    └── public/
        ├── index.html         # Landing page
        ├── dashboard.html     # Dashboard de administración
        ├── css/
        │   ├── landing.css    # Estilos landing (dark theme, glassmorphism)
        │   └── dashboard.css  # Estilos dashboard (sidebar, cards, tablas)
        └── js/
            ├── landing.js     # Animaciones, stats en vivo, tabs
            └── dashboard.js   # Auth check, CRUD warnings/config
```

## Comandos (41 total)

### Moderación (24)
| Comando | Descripción | Opciones | Permiso requerido |
|---------|-------------|----------|-------------------|
| `/ban` | Banear usuario | usuario, razón | BanMembers |
| `/softban` | Ban + unban automático | usuario, razón | BanMembers |
| `/tempban` | Ban temporal | usuario, tiempo, razón | BanMembers |
| `/unban` | Desbanear usuario | id, razón | BanMembers |
| `/untimeban` | Quitar ban temporal | id, razón | BanMembers |
| `/massban` | Banear múltiples | ids, razón | BanMembers |
| `/massunban` | Desbanear múltiples | ids, razón | BanMembers |
| `/kick` | Expulsar usuario | usuario, razón | KickMembers |
| `/mute` | Silenciar usuario | usuario, cantidad, unidad | ModerateMembers |
| `/unmute` | Quitar silencio | usuario | ModerateMembers |
| `/warn` | Advertir usuario (5 = ban) | usuario, razón | ModerateMembers |
| `/unwarn` | Quitar advertencia | usuario, número | ModerateMembers |
| `/warnings` | Ver advertencias | usuario (opcional) | ModerateMembers |
| `/clear` | Eliminar mensajes | cantidad | ManageMessages |
| `/setnick` | Cambiar apodo | usuario, apodo | ManageNicknames |
| `/removenick` | Quitar apodo | usuario | ManageNicknames |
| `/role` | Gestionar roles | create/delete/add/rmv/list | ManageRoles |
| `/logs` | Gestionar logs | set/disable/enable/status | ManageGuild |
| `/welcome` | Sistema bienvenida | enable/channel/message/bg | ManageGuild |
| `/goodbye` | Sistema despedida | enable/channel/message/bg | ManageGuild |
| `/perm` | Permisos (12 subs) | view/send/embed/manage... | ManageChannels |
| `/lock` | Bloquear canal | - | ManageChannels |
| `/unlock` | Desbloquear canal | - | ManageChannels |
| `/slowmode` | Modo lento (0-21600s)| segundos | ManageChannels |

### Info (5)
| Comando | Descripción |
|---------|-------------|
| `/avatar` | Ver avatar de usuario |
| `/userinfo` | Info detallada de usuario |
| `/serverinfo` | Info del servidor |
| `/roleinfo` | Info detallada de rol |
| `/channelinfo` | Info de canal |

### Utilidades (9)
| Comando | Descripción |
|---------|-------------|
| `/announce` | Enviar un anuncio |
| `/poll` | Crear encuesta con reacciones |
| `/snipe` | Último mensaje eliminado |
| `/membercount`| Conteo detallado de miembros |
| `/register` | Registrarse en el bot |
| `/unregister` | Eliminar registro |
| `/profile` | Ver perfil del registro |
| `/ticket`  | Gestión de tickets |
| `/ping` | Ver latencia |
| `/help` | Mostrar todos los comandos |

### Diversión (3)
| Comando | Descripción |
|---------|-------------|
| `/8ball` | Bola mágica 8 |
| `/coinflip` | Lanzar moneda |
| `/rps` | Piedra, papel, tijeras |

## Panel Web (Dashboard)

### Landing Page (`http://localhost:3000`)
- Hero section con terminal animada mostrando comandos
- Grid de características con glassmorphism
- Lista de comandos con tabs por categoría
- Estadísticas en vivo (servidores, usuarios, ping, uptime)
- Botones de invitar bot y abrir dashboard
- Diseño responsive, tema oscuro premium

### Dashboard (`http://localhost:3000/dashboard`)
- **Autenticación:** Login con Discord OAuth2
- **Selector de servidores:** Lista servidores mutuos donde el usuario es admin
- **Vista Resumen:** Stats del servidor + config rápida de logs
- **Vista Advertencias:** Tabla de warns con opción de eliminar
- **Vista Configuración:** Toggle de logs + selector de canal de logs

### API REST
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/stats` | GET | No | Stats públicas del bot |
| `/api/guilds` | GET | Sí | Servidores mutuos del usuario |
| `/api/guilds/:id` | GET | Admin | Info detallada del servidor |
| `/api/guilds/:id/warnings` | GET | Admin | Advertencias del servidor |
| `/api/guilds/:id/warnings/:userId/:index` | DELETE | Admin | Eliminar advertencia |
| `/api/guilds/:id/config` | GET | Admin | Configuración del servidor |
| `/api/guilds/:id/config` | POST | Admin | Actualizar configuración |
| `/api/guilds/:id/users` | GET | Admin | Obtener usuarios registrados |
| `/api/guilds/:id/users/:userId` | DELETE | Admin | Eliminar usuario registrado |

### Autenticación OAuth2
- `/auth/login` — Redirige a Discord para autorizar
- `/auth/callback` — Recibe token y guarda sesión
- `/auth/logout` — Destruye sesión
- `/auth/me` — Retorna usuario actual

## Sistema de Logs
- Canal por defecto: `logs-moderacion`
- Configuración **por servidor** en `data/config.json`
- Funciones: `sendLog()`, `isLogsEnabled()`, `getLogChannelName()`
- Se guarda en cada acción de moderación
- Configurable desde Dashboard web o comandos slash

## Sistema de Advertencias
- Máximo 5 advertencias
- Al llegar a 5: ban automático (si el bot puede)
- Al desbanear: se resetean las advertencias
- **Almacenamiento persistente** en `data/warnings.json`
- Cada advertencia guarda: razón, moderador, fecha
- Gestionable desde Dashboard web o comandos slash

## Sistemas Adicionales

### Welcome & Goodbye (Generación Canvas)
- Configuración independiente por comandos `/welcome` y `/goodbye`
- Usa la librería `@napi-rs/canvas` para crear imágenes premium personalizadas
- Soporta configuración de canal, fondo y variables dinámicas en el mensaje (`{user}`, `{count}`, `{server}`)

### Registro de Usuarios (Persistent)
- Los usuarios se registran vía el comando `/register`
- La data se guarda en `data/users.json`
- Gestionable desde la Web y eliminables vía dashboard

### Sistema de Bans Temporales
- Archivo de persistencia en `data/tempbans.json`
- Bucle (Interval) que revisa cada minuto los expirados
- Desbanea automáticamente y emite logs

### Sistema de Tickets Empresarial (Configurable)
- Los tickets son generados por interacción de botones con UI nativa de Discord (`/ticket setup`).
- Aislamiento de permisos: Oculta el canal a `@everyone` y lo revela al autor y a un rol Staff designado.
- Uso de `discord-html-transcripts` para auto-construir transcripciones `.html` interactivas en el servidor y mandarlas antes de su cierre.
- Integración en Dashboard para seleccionar dinámicamente un rol Staff y la ID de la Categoría de despliegue.

### Snipe (Mensajes Borrados)
- Almacenamiento auto-limpiable (5 minutos en memoria, no en disco) para cada canal.
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
- Dashboard protegido con OAuth2 + verificación de permisos de admin por servidor

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
- `startWebServer(client)` - Inicia servidor Express con el cliente de Discord

## Setup Automático de Servidor
- Crea canal de logs si no existe (en categoría "Moderación")
- Se ejecuta al conectar y al unirse a nuevo servidor

## Dependencias
```json
{
  "@napi-rs/canvas": "^0.1.53",
  "cookie-parser": "^1.4.7",
  "discord-html-transcripts": "^3.2.0",
  "discord.js": "^14.14.1",
  "dotenv": "^16.4.5",
  "express": "^4.21.2",
  "express-session": "^1.18.1"
}
```

## Variables de Entorno (.env)
```
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor (opcional, para comandos de prueba)
CLIENT_ID=id_del_bot
CLIENT_SECRET=secret_de_discord_oauth2
SESSION_SECRET=cadena_aleatoria_para_sesiones
BASE_URL=http://localhost:3000
```

## Scripts NPM
- `npm start` - Iniciar bot + servidor web
- `npm run dev` - Iniciar con --watch
- `npm run deploy` - Registrar comandos slash (ejecutar una vez o al cambiar comandos)
