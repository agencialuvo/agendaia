import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'esPublico';

// Marca una ruta como accesible sin JWT — usar solo en webhooks externos (Meta, WhatsApp)
// y en /auth/login, que es justamente donde se obtiene el token.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
