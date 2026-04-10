# 🤖 ARMANDO - Bot de Discord para Moderación

## 📋 Descripción General

**ARMANDO** es un bot de Discord diseñado para facilitar la moderación de servidores. Proporciona herramientas completas para gestionar miembros, roles, canales y permisos mediante slash commands intuitivos. Incluye un **panel web** con landing page y dashboard de administración.

---

## 📁 Estructura del Proyecto

```
discord-moderation-bot/
├── src/
│   ├── commands/
│   │   ├── moderation/     # 16 comandos de moderación
│   │   ├── info/           # 3 comandos de información
│   │   └── utilities/      # 2 comandos utilitarios
│   ├── events/             # Manejo de eventos
│   ├── utils/              # Utilidades y configuración
│   └── web/                # Servidor web Express
│       ├── server.js       # Setup de Express (puerto 3000)
│       ├── routes/
│       │   ├── auth.js     # OAuth2 con Discord
│       │   └── api.js      # API REST
│       ├── middleware/
│       │   └── authMiddleware.js  # Verificación de sesión
│       └── public/         # Landing page + Dashboard
│           ├── index.html
│           ├── dashboard.html
│           ├── css/
│           └── js/
├── data/                   # Archivos de configuración (JSON)
├── deploy-commands.js      # Script para registrar slash commands
└── .env                    # Variables de entorno
```

---

## 🌐 Panel Web

### Landing Page (`http://localhost:3000`)
Página pública y atractiva para presentar el bot:
- 🎨 Diseño premium con tema oscuro, glassmorphism y animaciones
- 🖥️ Terminal animada mostrando comandos del bot
- ⚡ Grid de características con iconos
- 📊 Estadísticas en vivo (servidores, usuarios, ping, uptime)
- 📋 Lista de comandos con tabs por categoría
- 🔗 Botones de invitar al servidor + acceder al dashboard

### Dashboard (`http://localhost:3000/dashboard`)
Panel de administración protegido con Discord OAuth2:
- 🔐 Login con tu cuenta de Discord
- 📡 Selector de servidores donde eres admin y el bot está presente
- 📊 **Resumen** — Stats del servidor + config rápida
- ⚠️ **Advertencias** — Tabla de warns con opción de eliminar
- ⚙️ **Configuración** — Toggle de logs + selector de canal de logs

---

## 🎮 Comandos Disponibles (21 total)

### 🔨 Moderación

| Comando | Descripción |
|---------|-------------|
| `/ban @usuario [razón]` | Banear a un usuario del servidor |
| `/unban @usuario` | Desbanear un usuario |
| `/kick @usuario [razón]` | Expulsar a un usuario |
| `/mute @usuario cantidad unidad` | Silenciar usuario (seg/min/horas/días) |
| `/unmute @usuario` | Quitar silencio a un usuario |
| `/warn @usuario [razón]` | Advertir a un usuario (5 warns = ban automático) |
| `/unwarn @usuario [número]` | Quitar una advertencia específica o la última |
| `/warnings [@usuario]` | Ver advertencias de un usuario |
| `/clear cantidad` | Eliminar mensajes (filtra automáticos los >14 días) |
| `/setnick @usuario [apodo]` | Cambiar el apodo de un miembro |

### 👔 Gestión de Roles

| Comando | Descripción |
|---------|-------------|
| `/role create nombre [color]` | Crear un rol con color personalizado |
| `/role delete rol` | Eliminar un rol |
| `/role add @usuario rol` | Añadir un rol a un usuario |
| `/role remove @usuario rol` | Quitar un rol a un usuario |
| `/role list` | Listar todos los roles del servidor |

### 🔐 Permisos de Canal

| Comando | Descripción |
|---------|-------------|
| `/perm view canal rol estado` | Configurar permiso para ver canal |
| `/perm send canal rol estado` | Configurar permiso para enviar mensajes |
| `/perm embed canal rol estado` | Configurar permiso para insertar enlaces |
| `/perm manage canal rol estado` | Configurar permiso para gestionar canal |
| `/perm speak canal rol estado` | Configurar permiso para hablar en voz |

**Estados:** `allow` (permitir) / `deny` (denegar) / `reset` (resetear)

### 🔒 Control de Canales

| Comando | Descripción |
|---------|-------------|
| `/lock` | Bloquear el canal actual |
| `/unlock` | Desbloquear el canal actual |
| `/slowmode [segundos]` | Configurar modo lento (0-21600s) |

### 📝 Sistema de Logs

| Comando | Descripción |
|---------|-------------|
| `/logs set #canal` | Cambiar el canal de logs |
| `/logs enable` | Activar el sistema de logs |
| `/logs disable` | Desactivar el sistema de logs |
| `/logs status` | Ver estado actual de logs |

### 👤 Información

| Comando | Descripción |
|---------|-------------|
| `/avatar [@usuario]` | Ver el avatar de un usuario |
| `/userinfo [@usuario]` | Ver información detallada de un usuario |
| `/serverinfo` | Ver información del servidor |

### 📊 Utilidades

| Comando | Descripción |
|---------|-------------|
| `/ping` | Ver latencia del bot |
| `/help` | Mostrar lista de todos los comandos |

---

## ⚙️ Características Técnicas

- **Framework:** Discord.js v14
- **Servidor Web:** Express v4
- **Lenguaje:** JavaScript (ES Modules)
- **Persistencia:** Configuración y warnings guardados en JSON
- **Logs:** Registro automático de acciones de moderación
- **Slash Commands:** Todos los comandos usan la API moderna de Discord
- **Dashboard:** Panel web con OAuth2 de Discord
- **API REST:** Endpoints para stats, guilds, warnings y configuración

---

## 🚀 Instalación y Uso

```bash
npm install        # Instalar dependencias
npm run deploy     # Registrar slash commands en Discord
npm start          # Iniciar bot + servidor web (http://localhost:3000)
npm run dev        # Iniciar en modo desarrollo (con reload automático)
```

---

## 🔧 Configuración Requerida (.env)

```env
TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id
GUILD_ID=id_del_servidor          # Opcional - para comandos de servidor
CLIENT_SECRET=secret_de_oauth2    # Para el dashboard web
SESSION_SECRET=cadena_aleatoria   # Para sesiones del dashboard
BASE_URL=http://localhost:3000    # URL base del servidor web
```

### Configurar OAuth2 en Discord
1. Ve a https://discord.com/developers/applications → tu aplicación
2. En **OAuth2 > General**, agrega la Redirect URI: `http://localhost:3000/auth/callback`
3. Copia el **Client Secret** y agrégalo al `.env`

---

## 📝 Notas

- El bot crea automáticamente el rol **"Silenciado"** y el canal **"logs-moderacion"** al unirse a un servidor
- El sistema de warnings acumula 5 advertencias antes de banear automáticamente
- Los logs solo se envían si el canal de logs existe y está activado
- Los mensajes de más de 14 días no se pueden eliminar (limitación de Discord)
- El servidor web corre en el mismo proceso que el bot, compartiendo datos en tiempo real
- El dashboard solo muestra servidores donde el usuario tiene permisos de Admin o Manage Guild
- Si planeas hostear publicamente, cambia `BASE_URL` en `.env` y actualiza la Redirect URI en Discord
