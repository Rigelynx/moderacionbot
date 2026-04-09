# 🤖 ARMANDO - Bot de Discord para Moderación

## 📋 Descripción General

**ARMANDO** es un bot de Discord diseñado para facilitar la moderación de servidores. Proporciona herramientas completas para gestionar miembros, roles, canales y permisos mediante slash commands intuitivos.

---

## 📁 Estructura del Proyecto

```
discord-moderation-bot/
├── src/
│   ├── commands/
│   │   ├── moderation/     # 13 comandos de moderación
│   │   ├── info/          # 3 comandos de información
│   │   └── utilities/     # 2 comandos utilitarios
│   ├── events/            # Manejo de eventos
│   └── utils/             # Utilidades y configuración
├── data/                  # Archivos de configuración (JSON)
├── deploy-commands.js     # Script para registrar slash commands
├── index.js               # Punto de entrada
└── .env                   # Variables de entorno
```

---

## 🎮 Comandos Disponibles (19 total)

### 🔨 Moderación

| Comando | Descripción |
|---------|-------------|
| `/ban @usuario [razón]` | Banear a un usuario del servidor |
| `/kick @usuario [razón]` | Expulsar a un usuario |
| `/mute @usuario cantidad unidad` | Silenciar usuario (seg/min/horas/días) |
| `/unmute @usuario` | Quitar silencio a un usuario |
| `/warn @usuario [razón]` | Advertir a un usuario (5 warns = ban automático) |
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
- **Lenguaje:** JavaScript (ES Modules)
- **Persistencia:** Configuración guardada en JSON
- **Logs:** Registro automático de acciones de moderación
- **Slash Commands:** Todos los comandos usan la API moderna de Discord

---

## 🚀 Comandos para Ejecutar

```bash
npm install        # Instalar dependencias
npm run deploy     # Registrar slash commands en Discord
npm start         # Iniciar el bot
npm run dev       # Iniciar en modo desarrollo (con reload automático)
```

---

## 🔧 Configuración Requerida (.env)

```env
TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id
GUILD_ID=id_del_servidor  # Opcional - para comandos de servidor
```

---

## 📝 Notas

- El bot crea automáticamente el rol **"Silenciado"** y el canal **"logs-moderacion"** al unirse a un servidor
- El sistema de warnings acumula 5 advertencias antes de banear automáticamente
- Los logs solo se envían si el canal de logs existe y está activado
- Los mensajes de más de 14 días no se pueden eliminar (limitación de Discord)
