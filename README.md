# ModBot - Discord Moderation Bot

![ModBot Cover](https://cdn.discordapp.com/avatars/1491566928945352735/2220bf566d67fe58dcc665d04902ae6c.webp?size=1024)

ModBot es un bot de moderación robusto y avanzado para Discord con un panel de control en la web (Dashboard) integrado. Construido con `discord.js` y `express`.

## 🚀 Características Principales

- **48 Comandos Slash** organizados en Moderación, Información, Utilidades y Diversión.
- **Panel Web / Dashboard** (Express + OAuth2) para gestionar visualmente tus servidores.
- **Sistema de Tickets Empresarial** con soporte para generación de Historial HTML visual enviado directamente al log.
- **Tarjetas de Bienvenida/Despedida Premium** editables desde Discord y generadas dinámicamente con `@napi-rs/canvas`.
- **Sistema Persistente de Advertencias** que auto-banea a los usuarios tras sumar 5 penalizaciones.
- **Bans Temporales** (Softbans, Tempbans, Massbans).
- **Log Automático** de todas las actividades.
- Snipe, perfiles registrados, control de roles avanzado y manipulación directa de permisos de canal (12 variables).

## 🛠 Instalación y Configuración

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/tu-usuario/modbot.git
cd modbot
npm install
```

### 2. Variables de Entorno (`.env`)
Debes crear un archivo `.env` en la raíz de tu proyecto e introducir la información de las credenciales de tu aplicación alojada en el [Portal de Discord Developers](https://discord.com/developers/applications).
```env
TOKEN=tu_token_discord
GUILD_ID=id_del_servidor_de_pruebas (opcional)
CLIENT_ID=id_del_bot_discord
CLIENT_SECRET=secret_de_discord_oauth2
SESSION_SECRET=cadena_hiper_segura_para_cookiessession
BASE_URL=http://localhost:3000
```

### 3. Registrar Comandos
Antes de ejecutar tu bot, debes registrar todos sus comandos slash con las APIs nativas de Discord.
```bash
npm run deploy
```

### 4. Iniciar el Servidor
Usa el comando `npm start` para arrancar el Bot en el terminal y de manera adjunta iniciar tu Servidor EXPRESS en el puerto 3000.
```bash
npm start
```

---

## 📡 Lista de Comandos Destacados

### 🔨 Moderación
- `/ban`, `/softban`, `/tempban`, `/unban`, `/untimeban`, `/massban`, `/massunban` - Herramientas exclusivas de ban.
- `/mute`, `/unmute`, `/kick` - Sanciones y bloqueos de mensajes.
- `/warn`, `/unwarn`, `/warnings` - Control de penalizaciones.
- `/welcome`, `/goodbye` - Control avanzado de canales o fotos de inicio del servidor.
- `/ticket` - Lanzará paneles embed nativos e infraestructuras HTML.
- `/setnick`, `/removenick` - Manipulación de apodos inmediata.
- `/clear`, `/slowmode` - Limpieza de chat.
- `/lock`, `/unlock`, `/lockdown` - Bloqueo de canales y cierre del servidor en emergencias.
- `/nuke` - Limpieza radical del historial clonando el canal de texto.
- `/vckick` - Expulsión directa de usuarios en un chat de Voz.
- `/role`, `/perm` - Sub-configuración del entorno.

### 👥 Utilidades & Info
- `/announce`, `/poll` - Crear plantillas y mensajes formales.
- `/snipe` - Acceder temporalmente al último mensaje de texto eliminado del canal.
- `/register`, `/profile`, `/unregister` - Sistema Web/Bot.
- `/report` - Envío privado de reportes a Logs.
- `/afk` - Marcar tu estado como ausente.
- `/sugerencias` - Sistema configurable híbrido de propuestas con votación.
- `/userinfo`, `/serverinfo`, `/channelinfo`, `/roleinfo` - Check avanzado. 
 
### 🎮 Diversión
- `/8ball`, `/coinflip`, `/rps`.

---

## 🌐 Panel Web (Dashboard)
Abre [http://localhost:3000](http://localhost:3000) (o tu propio servidor) en el navegador para ingresar tu App:
- **Landing Page**: Presentación completa, métricas en vivo.
- **Login OAuth2**: Validación oficial de tu cliente de Discord.
- **Resumen**: Estadísiticas visuales.
- **Configuración de Logs**: Alternar on/off, elegir canal meta.
- **Advertencias & Usuarios**: Listas JSON interactivas con funciones de eliminación mediante APIs REST propias.

---
© 2026 ModBot — Hecho con ❤️ para Discord
