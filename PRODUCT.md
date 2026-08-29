# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite + Workers + Durable Objects

## Users

Amigos en un garage o club de ping pong. Un celular en la mesa para anotar puntos; a veces una laptop o TV proyectando la llave o el marcador. Sin cuentas ni roles: quien tiene el link participa.

## Product Purpose

Armar un torneo de eliminación directa (nombres, llave, randomize) y un marcador compartido por URL que se actualice en vivo entre dispositivos. Incluye modo solo marcador para partidos sueltos con las mismas reglas de set.

Éxito: un grupo de 5–12 personas puede crear la sala, compartir el link, ver la llave en pantalla grande, sumar puntos desde el celular y ver avanzar al ganador sin instalar nada.

## Positioning

Sala en vivo sin cuentas: el link es el acceso y el servidor es la autoridad del estado. No es un marcador local ni una app de tienda.

## Operating Context

Torneo informal entre amigos. Uso típico: setup en celular, proyección en TV, anotación en la mesa durante el partido. UI en español.

## Capabilities and Constraints

Ver spec: `docs/superpowers/specs/2026-08-29-ping-pong-tournament-design.md`

- Torneo single-elim, 2–16 jugadores, byes automáticos
- Modo solo marcador (dos nombres, sin llave)
- Sets: 1, mejor de 3 o mejor de 5; puntos 7 u 11; ganar por 2 siempre
- Sin login, PIN, roles ni historial de torneos en v1
- Estado en Durable Object por sala; WebSocket para sincronización
- Expiración lazy tras 30 días sin escrituras

## Brand Commitments

Nombre: **Ping Pong**. Voz directa en español, sin jerga innecesaria.

## Evidence on Hand

Ninguno. No inventar testimonios, métricas ni casos de uso fabricados.

## Product Principles

1. **El servidor manda** — el cliente envía intenciones; el DO aplica y retransmite.
2. **Un toque = un punto** — controles grandes, sin gestos complejos en el marcador.
3. **Llave legible a 2 m** — cruces claros en pantalla grande; bye visible sin confundir con partido jugable.

## Accessibility & Inclusion

Targets táctiles grandes para uso en mesa. Contraste mínimo AA. Diferenciar bye vs partido real con más que solo color (texto/ícono).
