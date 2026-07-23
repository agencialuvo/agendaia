// `Cita.fecha` se guarda como medianoche UTC del día calendario intencionado (ver
// citas.service.ts) — por eso hay que leer sus componentes en UTC, no en local, antes
// de combinarlos con la hora. Si se usara `.setHours()` directo sobre el Date tal cual,
// en zonas con offset negativo (ej. Perú, UTC-5) el día calendario local se corre uno atrás.
export function combinarFechaHoraLocal(fecha: Date, hora: string): Date {
  const [horas, minutos] = hora.split(':').map(Number);
  return new Date(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), horas, minutos, 0, 0);
}
