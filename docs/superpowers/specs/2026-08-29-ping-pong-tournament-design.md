# Ping Pong — torneo y marcador (v1)

Fecha: 2026-08-29  
Plataforma: Cloudflare Workers + Durable Objects  
Audiencia: torneo informal entre amigos (sin cuentas)

## 1. Problema

Hace falta una página que arme un torneo de ping pong (nombres, llave, randomize) y un marcador que se pueda mover desde el celular mientras otra pantalla (laptop/TV) muestra lo mismo. También hace falta un modo de **solo marcador** para un partido suelto, reutilizando las mismas reglas.

No hay login. El link de la sala es el acceso.

## 2. Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Forma | Página web (no app de tienda), usable en celular y pantalla grande |
| Hosting | Cloudflare |
| Estado | Sala compartida (no solo localStorage). localStorage no es fuente de verdad |
| Quién edita | Cualquiera con el link |
| Formato de torneo | Eliminación directa |
| Jugadores | 2–16; byes automáticos |
| Quién recibe bye | El random de nombres; no se elige a mano |
| Sets | Al crear: 1 set, o mejor de 3, o mejor de 5 |
| Puntos por set | 7 u 11 |
| Ganar por 2 | Siempre (no es opcional) |
| 3er puesto | No |
| Cuentas / PIN / roles | No en v1 |
| Historial de torneos | No en v1 |

Default al crear: **mejor de 3**, **a 11**, ganar por 2.

## 3. Dos modos, un motor

Ambos modos crean una **sala** con URL `/t/{id}` (id corto, ~5–8 caracteres URL-safe).

### 3.1 Torneo (principal)

1. Lista de nombres (agregar / quitar).
2. Elegir reglas de partido (sets y puntos).
3. **Randomizar** baraja nombres y regenera la llave.
4. Crear → llave + link para copiar.
5. Abrir un partido → marcador.
6. Al terminar el partido, el ganador se escribe en el siguiente cruce.
7. El ganador de la final es el campeón.

### 3.2 Solo marcador

Setup: dos nombres + mismas reglas de partido. Sin llave. Mismo marcador. Botón **Reset** (puntos y sets a 0; nombres y reglas se quedan) para el siguiente partido suelto.

## 4. Pantallas

### 4.1 Inicio

Tres acciones:

- Nuevo torneo
- Solo marcador
- Unirse (pegar URL o el código `{id}`)

### 4.2 Setup de torneo

- Lista 2–16 nombres; no se puede crear con menos de 2.
- Nombre vacío no se acepta.
- Nombres duplicados (mismo texto, sin distinguir mayúsculas) se resuelven al crear/randomizar añadiendo sufijo ` 2`, ` 3`, …
- Controles de reglas: modo (1 set / mejor de 3 / mejor de 5) y puntos (7 / 11).
- **Randomizar**: baraja y muestra la llave previa (o al menos el orden de siembra).
- **Crear**: persiste la sala y navega a la llave.

Después de que **cualquier partido tenga al menos un punto**, Randomizar se **desactiva**. No se confirma y no se pisan resultados.

### 4.3 Llave

- Cruces por ronda. Un bye se ve como “pasa” / sin rival, no como partido jugable.
- Un partido sin dos jugadores reales no se puede abrir (salvo que uno sea bye: no hay partido).
- Tocar un partido listo (dos nombres, no finalizado) abre el marcador.
- Un partido ya cerrado muestra el resultado y no se reabre para seguir sumando (el deshacer del marcador solo aplica mientras el partido está abierto y no se ha confirmado el cierre… ver §6.4).
- Copiar link visible. Sin QR en v1.

### 4.4 Marcador

Pensado para mesa (dedos grandes) y para proyección:

- Dos lados: nombre, puntos del set actual, sets ganados (si aplica).
- `+` / `−` por lado. `−` no baja de 0.
- **Deshacer**: revierte el último evento de este partido (punto o, si el último evento cerró un set, reabre ese set).
- Indicación clara cuando el set o el partido ya terminó.
- En modo torneo: al cerrar el partido, volver a la llave con el ganador ya colocado.
- En modo solo marcador: estado “ganó X” + Reset.

No hay indicador de saque en v1.

### 4.5 Error de sala

Si el id no existe o la sala expiró: “No existe o expiró” + ir al inicio.

## 5. Reglas de la llave

Tamaño de llave = siguiente potencia de 2 ≥ número de jugadores: 2, 4, 8 o 16.

Número de byes = tamaño − jugadores.

Ejemplos:

| Jugadores | Llave | Byes | Partidos reales en ronda 1 |
|-----------|-------|------|----------------------------|
| 2 | 2 | 0 | 1 |
| 3 | 4 | 1 | 1 |
| 5 | 8 | 3 | 1 |
| 6 | 8 | 2 | 2 |
| 7 | 8 | 1 | 3 |
| 9 | 16 | 7 | 1 |

Colocación (determinista tras el shuffle):

1. Barajar la lista de jugadores (Fisher–Yates). El índice post-shuffle es la **semilla** 1…n.
2. Semillas que no existen (n+1 … tamaño) son byes.
3. Colocar semillas en la ronda 1 con posiciones estándar de single-elim (1 vs último, 2 vs penúltimo, etc.). Así los byes no se acumulan todos en un lado.

Un bye **no se juega**: esa persona ya ocupa el slot de la siguiente ronda.

Randomizar (solo si nadie ha anotado puntos) vuelve a barajar y regenera toda la llave desde cero.

## 6. Reglas del partido

El servidor es la autoridad. El cliente envía intenciones (`point`, `undo`); el servidor aplica y retransmite el estado.

### 6.1 Set

Un set termina cuando un lado tiene **puntosObjetivo** (7 o 11) **y** ventaja de **al menos 2**.  
Ejemplos a 11: 11–9 cierra; 11–10 no; 12–10 cierra.

### 6.2 Partido

- 1 set: gana quien gana ese set.
- Mejor de 3: primero a **2** sets.
- Mejor de 5: primero a **3** sets.

Al ganar un set, los puntos del set vuelven a 0–0 y se incrementan los sets de ese lado, salvo que ese set haya cerrado el partido.

### 6.3 Avance en torneo

Al cerrar el partido, el ganador se copia al slot padre. El perdedor no avanza. El partido de la final no tiene padre: el estado de la sala pasa a `completed` con `championId`.

No se edita a mano el ganador en la llave. Solo el marcador cierra partidos.

### 6.4 Deshacer vs partido cerrado

- Mientras el partido **no** ha cerrado: deshacer puntos y sets de ese partido.
- Cuando el partido **cierra**: el ganador ya está en el siguiente cruce. Deshacer **un** cierre (reabrir el partido y quitar al ganador del padre) está permitido **solo si** el partido siguiente **aún no tiene puntos**. Si el siguiente ya empezó, no se puede deshacer el anterior.

En modo solo marcador no hay padre: deshacer puede reabrir el partido mientras no se haya pulsado Reset. Reset borra el historial de undo de ese partido.

## 7. Arquitectura

```
[Browser]  --HTTPS / WS-->  [Worker]
                               |
                               +--> Durable Object "Room" (un id = una sala)
```

- **Worker**: estáticos (HTML/JS/CSS) + API HTTP + upgrade WebSocket hacia el DO.
- **Durable Object `Room`**: estado del torneo o marcador; un objeto por `{id}`.
- **WebSocket**: cada cliente conectado recibe snapshots o diffs tras cada mutación.
- **Persistencia**: `state.storage` del DO.
- **Expiración**: si no hay **escrituras** en 30 días, la siguiente petición puede responder 404 y el DO borrar storage. (Sin cron obligatorio en v1: chequeo lazy al abrir.)

No D1, no KV como fuente de verdad, no autenticación.

### 7.1 Concurrencia y red

- Mutaciones serializadas en el DO (un hilo por objeto): dos `+` seguidos de dos dispositivos = +2.
- Sin conexión, el cliente no aplica el punto en local como verdad. Muestra “sin conexión”; al reconectar pide snapshot y reintenta o descarta toques no acked.
- Reconexión: `GET` snapshot o primer mensaje WS = estado completo.

### 7.2 Identificador de sala

Generado en el Worker (no secuencial). Choque: reintentar. El `{id}` es el nombre del DO.

## 8. Modelo de datos (sala)

Campos conceptuales (nombres exactos al implementar):

```
Room {
  id: string
  mode: "tournament" | "scoreboard"
  createdAt: number
  lastWrittenAt: number
  rules: {
    pointsTo: 7 | 11
    matchType: "one_set" | "best_of_3" | "best_of_5"
  }
  players: [{ id, name }]
  bracket: null | {
    size: 2 | 4 | 8 | 16
    matches: [{
      id
      round          // 0 = primera ronda
      slot           // índice en la ronda
      playerAId      // null = bye o TBD
      playerBId
      winnerId       // null si no cerrado
      matchState     // ver abajo
    }]
  }
  activeMatchId: string | null
  championId: string | null
}
```

`matchState` por partido (también el partido del modo scoreboard, que es un único match sin bracket):

```
{
  pointsA, pointsB,
  setsA, setsB,
  status: "pending" | "in_progress" | "completed"
  undoStack: Event[]   // suficiente para deshacer
}
```

Modo scoreboard: `players` longitud 2, `bracket` null, un `matchState` de sala.

## 9. Errores y límites

| Caso | Comportamiento |
|------|----------------|
| Nombre vacío | No se añade / no se crea |
| Duplicados | Sufijo numérico |
| Menos de 2 o más de 16 jugadores en torneo | No crear |
| `−` en 0 | No-op |
| Partido no listo (falta jugador) | No abrir marcador |
| Randomizar con puntos ya jugados | Control desactivado |
| Deshacer sin eventos | No-op |
| Deshacer cierre si el siguiente partido ya tiene puntos | Rechazar, mensaje corto |
| Sala inexistente / expirada | Pantalla de error §4.5 |
| WS caído | Banner “sin conexión”; no divergir el marcador |

## 10. Fuera de v1

Login, PIN, host vs espectador, round-robin, dobles, saque, 3er puesto, estadísticas, persistir torneos para siempre, notificaciones, i18n (UI en **español** solamente).

## 11. Criterio de éxito

Un grupo de 5–12 amigos puede: poner nombres, randomizar, compartir el link, ver la llave en una TV, apuntar puntos en un celular, ver avanzar al ganador, y usar solo el marcador un día que no hay torneo. Sin instalar nada.

## 12. Stack de implementación (orientativo)

- Frontend: HTML + JS (o un bundler mínimo) servido por el Worker; UI móvil primero.
- Backend: Cloudflare Workers + Durable Objects + WebSockets.
- Deploy: Wrangler, cuenta Cloudflare gratuita.

Detalle de tareas: plan de implementación aparte, después de aprobar esta spec.
