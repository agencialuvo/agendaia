import { io } from 'socket.io-client';

// Conexión en tiempo real: notificaciones de handoff a humano,
// nuevos mensajes de WhatsApp, cambios de etapa en el Kanban.
export const socketClient = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
  autoConnect: false,
});
