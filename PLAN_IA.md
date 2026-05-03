# Plan de Implementacion de IA para el Bot

## Objetivo

Implementar IA de forma progresiva, util y segura, sin convertir el bot en algo impredecible o caro de mantener.

La idea no es meter IA "por meterla", sino usarla donde realmente sube la calidad:

- tickets mas profesionales,
- respuestas mas utiles,
- moderacion mas inteligente,
- anti-raid mas avanzado,
- y extras divertidos como un `/8ball` mejorado.

---

## Principios del proyecto

### 1. La IA debe empezar como asistente, no como juez

En moderacion y anti-raid, la IA no deberia banear ni castigar fuerte por si sola al inicio.

Primero debe:

- analizar,
- clasificar,
- resumir,
- alertar,
- sugerir acciones.

Despues, si funciona bien, podria pasar a automatizar acciones suaves.

### 2. Priorizar funciones de alto valor y bajo riesgo

Lo primero debe ser lo que:

- ayude mucho al staff,
- tenga pocos falsos positivos,
- no rompa el servidor,
- y se vea premium.

### 3. Todo debe ser configurable

Cada modulo con IA deberia poder:

- activarse o desactivarse,
- tener limites de uso,
- registrar logs,
- definir si solo sugiere o tambien actua.

---

## Prioridades recomendadas

## Fase 1 - IA segura y premium

Estas son las funciones que mas valen la pena para empezar.

### A. Resumen automatico de tickets cerrados

#### Objetivo

Cuando se cierre un ticket, la IA genera un resumen corto y profesional del caso.

#### Resultado esperado

- motivo principal,
- problema reportado,
- acciones realizadas,
- resultado final,
- resumen de 3 a 5 lineas.

#### Donde encaja

- sistema de tickets,
- logs de tickets,
- transcript final.

#### Beneficios

- se ve premium,
- ayuda al staff,
- facilita auditoria,
- muy bajo riesgo.

#### Modo recomendado

- `v1`: resumen opcional al cerrar ticket.
- `v2`: resumen automatico en logs de tickets.

---

### B. Sugerencias de respuesta para staff en tickets

#### Objetivo

La IA propone respuestas utiles para soporte, apelaciones, compras, bugs o reportes.

#### Resultado esperado

- 1 a 3 respuestas sugeridas,
- tono claro y profesional,
- respuestas editables por el staff,
- nunca enviar automaticamente al principio.

#### Beneficios

- acelera soporte,
- ayuda a staff nuevo,
- sube la calidad de atencion.

#### Modo recomendado

- comando tipo `/ticket ia_respuesta`
- o boton interno para staff

---

### C. Clasificacion automatica de reportes

#### Objetivo

Cuando alguien use `/report`, la IA clasifica el caso.

#### Categorias sugeridas

- spam
- acoso
- contenido inapropiado
- apelacion
- bug
- compra
- conflicto entre usuarios
- otro

#### Beneficios

- organiza mejor los casos,
- ayuda a priorizar,
- sirve para dashboard y estadisticas.

#### Modo recomendado

- solo clasificar y loggear,
- no castigar automaticamente.

---

### D. `/8ball` con IA

#### Objetivo

Volver `/8ball` mas divertido, con respuestas dinamicas y personalidad.

#### Opciones

- respuestas sarcasticas,
- respuestas dramaticas,
- respuestas "sabias",
- respuestas troll suaves,
- modo clasico y modo IA.

#### Recomendacion

Mantener dos modos:

- `clasico`: respuestas fijas rapidas
- `ia`: respuestas generadas segun la pregunta

#### Beneficios

- muy divertido,
- bajo riesgo,
- buena forma de probar IA sin tocar sistemas criticos.

---

## Fase 2 - IA de apoyo para moderacion

Estas funciones son utiles, pero deben empezar en modo asistido.

### E. Analisis de mensajes sospechosos

#### Objetivo

Analizar mensajes para detectar:

- toxicidad,
- amenazas,
- acoso,
- spam disimulado,
- estafas,
- links engañosos,
- comportamientos raros.

#### Importante

La IA no deberia banear ni mutear por si sola en esta fase.

#### Salida recomendada

- score de riesgo,
- categoria del riesgo,
- explicacion corta,
- accion sugerida.

#### Modo recomendado

- `monitor`: solo log
- `assist`: sugerir accion a staff

---

### F. Resumen de incidentes de moderacion

#### Objetivo

Cuando haya varios warns, mutes, reports o actividad anti-raid, la IA resume lo ocurrido.

#### Ejemplo

"En los ultimos 15 minutos hubo 3 usuarios con flood, 2 cuentas nuevas sospechosas y 1 pico de menciones masivas en #general."

#### Beneficios

- da contexto rapido,
- ayuda a admins,
- se ve muy profesional.

---

### G. Explicacion automatica para acciones del staff

#### Objetivo

Generar textos claros y consistentes para logs o DMs de moderacion.

#### Ejemplo

En vez de un texto seco, la IA puede redactar:

"Tu mensaje fue eliminado porque activaste el filtro anti-spam por repeticion excesiva en poco tiempo."

#### Beneficios

- mas claridad,
- mas consistencia,
- menos trabajo manual.

---

## Fase 3 - IA avanzada para anti-raid

Esto ya es nivel mas serio y debe hacerse con mucho cuidado.

### H. Deteccion contextual de raids

#### Objetivo

Que la IA detecte patrones que no se ven solo con umbrales:

- mensajes parecidos pero no identicos,
- ataques coordinados por varias cuentas,
- olas de cuentas nuevas con nombres similares,
- comportamiento sospechoso por contexto.

#### Modo recomendado

- `v1`: score de riesgo
- `v2`: subir temporalmente el nivel del anti-raid
- `v3`: accionar solo respuestas suaves

#### Nunca de entrada

- auto-ban solo por IA
- auto-kick fuerte sin confirmacion

---

### I. Escalado inteligente del anti-raid

#### Objetivo

Que la IA ayude a decidir si conviene:

- mantener `Monitor`,
- subir a `Clean`,
- pasar a `Contain`,
- activar `Panic`.

#### Idea

La IA no reemplaza reglas duras; las complementa.

#### Ejemplo

Si detecta que el "raid" son realmente usuarios normales hablando mucho por un evento, evita endurecer demasiado.

---

## Fase 4 - Automatizacion controlada

Solo cuando todo lo anterior ya funcione bien.

### J. Acciones automaticas suaves con IA

Posibles acciones:

- borrar mensaje,
- mandar alerta,
- recomendar timeout,
- subir nivel del anti-raid temporalmente.

#### Regla

La IA puede ejecutar acciones suaves primero.

Para acciones fuertes:

- ban,
- kick,
- lockdown automatico completo,

deberia requerirse confirmacion del staff o un nivel de confianza muy alto mas reglas duras tradicionales.

---

## Arquitectura recomendada

## 1. Crear un modulo central de IA

Archivo sugerido:

- `src/utils/ai.js`

Responsabilidades:

- cliente de proveedor IA,
- prompts base,
- manejo de errores,
- limites,
- sanitizacion de entradas,
- logs.

## 2. Crear submodulos por dominio

Archivos sugeridos:

- `src/utils/aiTickets.js`
- `src/utils/aiModeration.js`
- `src/utils/aiAntiRaid.js`
- `src/utils/aiFun.js`

## 3. Configuracion por servidor

Agregar en `config.json` algo tipo:

```json
{
  "ai": {
    "enabled": false,
    "provider": "openai",
    "features": {
      "ticketSummary": true,
      "ticketReplyAssist": false,
      "reportClassification": true,
      "smartModeration": false,
      "smartAntiRaid": false,
      "fun8ball": true
    },
    "moderationMode": "assist",
    "antiRaidMode": "assist",
    "maxRequestsPerHour": 100,
    "logPrompts": false
  }
}
```

## 4. Modos recomendados

### Tickets

- `off`
- `manual`
- `auto`

### Moderacion

- `off`
- `monitor`
- `assist`
- `soft-action`

### Anti-raid

- `off`
- `monitor`
- `assist`
- `adaptive`

---

## Integraciones concretas sugeridas

## Tickets

### 1. Resumen al cerrar ticket

Punto de integracion:

- flujo de `/ticket close`

Salida:

- embed resumen
- texto en logs
- adjunto opcional junto al transcript

### 2. Respuesta sugerida

Punto de integracion:

- comando nuevo
- boton dentro del ticket

Ejemplos de comandos:

- `/ticket ia_resumen`
- `/ticket ia_respuesta`

---

## 8ball

### Idea de implementacion

- mantener una lista clasica local
- añadir subcomando o modo IA

Ejemplos:

- `/8ball pregunta:... modo:clasico`
- `/8ball pregunta:... modo:ia`

### Extras

- personalidades
- respuestas segun tema
- modo "caotico"

---

## Moderacion

### 1. Analisis de mensaje reportado

Comando posible:

- `/modai analizar mensaje`

Salida:

- nivel de riesgo
- categoria
- resumen
- accion sugerida

### 2. Asistente para staff

Comandos posibles:

- `/modai contexto usuario`
- `/modai sugerir_accion`

---

## Anti-Raid

### 1. Resumen de incidente

Comando posible:

- `/antiraid resumen`

Salida:

- que paso,
- cuantos usuarios,
- patron detectado,
- accion recomendada.

### 2. Evaluacion inteligente

La IA revisa:

- joins,
- mensajes,
- menciones,
- edad de cuentas,
- similitud entre mensajes.

Y devuelve:

- `riesgo bajo`
- `riesgo medio`
- `riesgo alto`
- `activar panic sugerido`

---

## Lo que NO recomiendo al inicio

- auto-ban con IA
- auto-kick con IA
- warns automaticos por IA sin validacion
- lockdown completo disparado solo por IA
- borrar mensajes solo por "sensacion" del modelo sin reglas base

---

## Orden real de implementacion

## Dia 1

- base del modulo `ai.js`
- configuracion base
- proveedor IA conectado

## Dia 2

- resumen de tickets cerrados

## Dia 3

- respuestas sugeridas para staff

## Dia 4

- clasificacion de reportes

## Dia 5

- `/8ball` con modo IA

## Dia 6

- resumen de incidentes de moderacion y anti-raid

## Dia 7+

- analisis inteligente de moderacion
- analisis contextual del anti-raid

---

## Variables de entorno sugeridas

```env
OPENAI_API_KEY=tu_api_key
AI_ENABLED=false
AI_PROVIDER=openai
AI_MODEL=gpt-5.4-mini
AI_MAX_INPUT_CHARS=12000
AI_MAX_OUTPUT_TOKENS=500
```

---

## Modelos recomendados por tipo de tarea

### Tareas baratas y frecuentes

- clasificacion
- 8ball
- resúmenes cortos

Modelo recomendado:

- pequeño / mini

### Tareas mas delicadas

- resumen de tickets complejos
- analisis de moderacion
- resumen de incidentes

Modelo recomendado:

- medio

### Tareas criticas

- decisiones de riesgo alto

Recomendacion:

- no automatizar al inicio

---

## Riesgos a vigilar

- falsos positivos en moderacion
- sobrecoste por demasiadas llamadas
- prompts demasiado largos
- usuarios provocando al sistema para gastar tokens
- staff confiando demasiado en la IA

---

## Recomendacion final

Si mañana solo vas a hacer una parte, empieza por esto:

1. IA para resumen de tickets.
2. IA para `/8ball`.
3. IA para clasificar reportes.
4. IA para resumen de incidentes anti-raid.

Y deja para despues:

5. IA aplicada a moderacion asistida.
6. IA aplicada a anti-raid adaptativo.

Ese orden da el mejor equilibrio entre:

- valor,
- seguridad,
- coste,
- y sensacion de producto profesional.
