# Resumen del Despliegue del Bot en WispByte

Este documento resume todos los pasos realizados y las soluciones aplicadas para migrar el Bot de Moderación de un entorno local (Windows) a un hosting profesional (Linux - WispByte).

## 🛠️ Cambios en el Código
- **Puerto Dinámico:** Se modificó `src/web/server.js` para que el Dashboard sea compatible con hosts que asignan puertos aleatorios. 
  - *Código:* `const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;`

## 🧹 Limpieza del Repositorio (Git/GitHub)
- **.gitignore:** Se actualizó con una lista profesional para Node.js, incluyendo logs, archivos de sistema y protegiendo el archivo `.env`.
- **node_modules:** Se eliminó la carpeta del repositorio de GitHub usando `git rm -r --cached node_modules`. Esto es vital porque los módulos de Windows no funcionan en Linux.

## 🚀 Configuración en WispByte (Pterodactyl)
Para que el bot funcione correctamente en este host, se aplicaron los siguientes ajustes:

### 1. Gestión de Archivos
- Se subieron los archivos mediante el Administrador de Archivos de WispByte (vía ZIP o arrastrando).
- Se aseguró que los archivos (`src`, `package.json`, etc.) estuvieran en la raíz `/home/container/` y no dentro de subcarpetas.
- Se eliminó cualquier resto de `node_modules` de Windows antes de iniciar.

### 2. Variables de Entorno (.env)
Se creó un archivo `.env` en el host con los siguientes datos esenciales:
- `TOKEN`, `CLIENT_ID`, `CLIENT_SECRET`, `GUILD_ID`.
- `BASE_URL`: Actualizada a la IP pública del host (`http://212.227.7.153:10820`).
- `SESSION_SECRET`: Para la seguridad del Dashboard.

### 3. Ajuste de Inicio (Startup)
Se configuró el **Startup Command** para solucionar el error de "Módulo no encontrado" y automatizar el registro de comandos:
- **Archivo de inicio:** `src/index.js`
- **Comando completo:**
  ```bash
  if [[ -d .git ]] && [[ 0 == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/npm run deploy && /usr/local/bin/node /home/container/src/index.js
  ```

### 4. Discord Developer Portal
Se actualizó el **Redirect URI** en la sección OAuth2 para permitir el inicio de sesión en el Dashboard:
- `http://212.227.7.153:10820/auth/callback`

## ✅ Estado Actual
- **Estado del Bot:** Online bajo el nombre **ARMANDO**.
- **Servidores:** Funcionando en 3 servidores simultáneos.
- **Dashboard:** Accesible vía IP pública y puerto asignado.
- **Comandos:** Se actualizan automáticamente en cada reinicio para la `GUILD_ID` configurada.

---
*¡Resumen generado con éxito! El bot está listo para operar 24/7.*
