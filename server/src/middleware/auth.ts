import type { Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    isGuest: boolean;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error('Chybí autentizační token'));
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return next(new Error('Neplatný token'));
  }

  socket.data.userId = user.id;
  socket.data.isGuest = user.is_anonymous ?? false;

  next();
}
