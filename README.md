# Ping Pong

Marcador y torneo de eliminación directa para un grupo de amigos. Sin cuentas: **quien tiene el link entra**.

## Crear una sala

1. Abre la app (en local: `http://localhost:5174/` tras `npm run dev`).
2. Elige el modo:
   - **Nuevo torneo** — 2 a 16 jugadores, llave con byes automáticos si el número no es potencia de 2.
   - **Solo marcador** — un partido suelto, dos nombres, sin llave.
3. Escribe los nombres, elige puntos (7 u 11) y sets (1, 3 o 5).
4. Pulsa **Empezar torneo** o **Empezar**.

Quedas en una URL como `/t/ab3k7x`. Esa es la sala.

## Compartir el link

Copia la URL completa del navegador y mándala (WhatsApp, AirDrop, etc.).

- En la **TV o laptop** abre el mismo link para ver la llave o el marcador grande.
- En el **celular de la mesa** abre el mismo link para anotar puntos.
- Quien llegue tarde puede pegar el link o el código de 6 caracteres en **Unirse a una sala** en la portada.

Todos ven lo mismo en vivo. No hay PIN ni roles: cualquiera con el link puede sumar puntos.

Las salas se borran solas si pasan **30 días** sin que nadie anote.

## Desarrollo

```bash
npm install
npm run dev
```

Tests: `npm test`. Publicar: `npm run deploy` (Cloudflare Workers + Durable Objects).
