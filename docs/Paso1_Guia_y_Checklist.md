# Paso 1: Estructurar el guión de VELIA (base para todo lo demás)

## Por qué este es el paso 1 exacto

No depende de Meta, WhatsApp ni Google Calendar — se puede hacer hoy mismo, en paralelo a que se gestionen esos accesos (que tardan días en aprobarse). Y es el insumo que necesitan **los otros dos módulos críticos** para funcionar:

- El **motor de scoring automático** necesita las 3 preguntas y su puntaje exacto.
- El **motor conversacional de IA** necesita las variantes de mensaje, las reglas de horario y el banco de objeciones como parte de su contexto (esto reemplaza al Word como "fuente de verdad").

## Qué es exactamente el entregable

Un archivo estructurado (JSON) que traduce **todo** el Word de VELIA a datos — nada de prosa suelta. Ya lo armé con la información real que aparece en tu guión, tus chats y tu brief (`Paso1_guion_estructurado_VELIA.json`, adjunto). Esto es lo que contiene:

| Sección del JSON | De dónde sale | Estado |
|---|---|---|
| `clinica` (nombre, agente IA "Yazmín", ubicación, horario) | Guión + chats (dirección repetida en varios chats) | ✅ Completo |
| `scoring` (3 preguntas, puntajes, rangos caliente/tibio/frío) | Sección 1 del guión | ✅ Completo |
| `regla_horarios` | Sección 1 del guión | ✅ Completo |
| `guiones_primer_contacto` (variantes A/B por caliente/tibio/frío) | Secciones 2-4 del guión | ✅ Completo |
| `apertura_diagnostico` | Sección 5 del guión | ✅ Completo |
| `objeciones` (6 objeciones con respuesta y media asociada) | Sección 6 del guión | ✅ Completo |
| `recordatorios` y `retargeting` | Secciones 8-9 del guión | ✅ Completo |
| `post_visita` (control, reseña, cross-sell) | Sección 10 del guión | ✅ Completo |
| `servicios` (Bótox, full face, IPL, limpieza facial, tatuajes) | Chats + brief | ⚠️ Parcial — precios de IPL, limpieza facial y tatuajes no aparecen en el material, marcados como `null` para que el cliente los confirme |

## Checklist para cerrar el paso 1 (quién hace qué)

1. **Tú / equipo VELIA revisa el JSON adjunto** y confirma que cada mensaje quedó fiel al tono real (no reescribí ningún mensaje, los copié tal cual del Word — solo verifica que no falte ninguna variante que usen y no me hayan compartido).
2. **Completar los campos marcados `null`**: precio de IPL, limpieza facial, eliminación de tatuajes, y si alguno de esos requiere evaluación previa o es directo (la lógica del punto 1.2 que ya definimos).
3. **Confirmar los doctores y su especialidad por servicio** (vi en los chats que la Dra. Jhoana hace Bótox y controles, y el Dr. Jeffrey aparece para tatuajes — confirma si eso es una regla fija o pueden atender cualquier servicio).
4. **Congelar esta versión** (v1.0) — a partir de aquí, cualquier cambio al guión se edita en este archivo, no en un Word nuevo.

## Criterio de aceptación (cómo sabemos que el paso 1 está terminado)

El paso 1 se da por cerrado cuando:
- No queda ningún campo `null` sin resolver (o queda explícitamente marcado como "no aplica").
- El equipo de VELIA lo aprobó como fiel a como venden hoy.
- El archivo queda versionado (ej. en un repositorio o carpeta compartida) como la única fuente de verdad del guión.

Con esto cerrado, el **paso 2** (que sigue en el plan: webhook de Meta Lead Ads + motor de scoring) ya tiene de dónde leer las reglas exactas de puntaje, sin inventar nada.
