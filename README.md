# 🤖 Bot de Discord - Moderación

Bot de Discord para moderación con múltiples comandos útiles.

## 📋 Requisitos

- Node.js v16.11.0 o superior
- Un bot de Discord con los siguientes permisos:
  - Administrador o permisos específicos según comandos

## 🚀 Instalación

1. Clona o descarga el proyecto
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` con tu token:
   ```
   TOKEN=tu_token_de_discord_aqui
   ```

4. Ejecuta el bot:
   ```bash
   npm start
   ```

## 🔧 Permisos Necesarios

El bot necesita los siguientes permisos en Discord:

- **Gestionar mensajes** - Para purgar mensajes
- **Banear miembros** - Para banear usuarios
- **Expulsar miembros** - Para kick
- **Gestionar canales** - Para lock/unlock/slowmode
- **Moderar miembros** - Para mute/unmute
- **Ver canales** - Para funcionamiento general
- **Enviar mensajes** - Para responder
- **Lectura de historial** - Para comandos

## 📝 Comandos

### 🔨 Moderación
| Comando | Descripción |
|---------|-------------|
| `!ban @usuario [razón]` | Banear a un usuario |
| `!kick @usuario [razón]` | Expulsar a un usuario |
| `!mute @usuario [duración]` | Silenciar (duración: 10s, 5m, 1h, 1d) |
| `!unmute @usuario` | Quitar silencio |
| `!warn @usuario [razón]` | Advertir usuario (5 warns = ban) |
| `!warnings @usuario` | Ver advertencias de un usuario |
| `!clear [cantidad]` | Eliminar mensajes (1-100) |

### 🔒 Canal
| Comando | Descripción |
|---------|-------------|
| `!lock` | Bloquear canal |
| `!unlock` | Desbloquear canal |
| `!slowmode [segundos]` | Activar modo lento (0-21600s) |

### 👤 Usuario
| Comando | Descripción |
|---------|-------------|
| `!avatar [@usuario]` | Ver avatar de un usuario |
| `!userinfo [@usuario]` | Información del usuario |
| `!serverinfo` | Información del servidor |

### 📊 Utilidades
| Comando | Descripción |
|---------|-------------|
| `!ping` | Ver latencia del bot |
| `!help` | Mostrar lista de comandos |

## ⚙️ Configuración Automática

El bot crea automáticamente:
- Rol **"Silenciado"** - Se asigna a usuarios silenciados
- Canal **"logs-moderacion"** - Canal privado para logs de moderación

## 🔒 Seguridad

- Los comandos de moderación requieren permisos de administrador o permisos específicos
- Los logs se envían a un canal privado
- Sistema de advertencias con ban automático a las 5 warns

## 📄 Licencia

MIT
