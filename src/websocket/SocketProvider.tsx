'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { socketClient } from './socket';
import { WS_EVENTS } from './events';

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, updateUser } = useAuth();

  useEffect(() => {
    if (!socketClient) return;

    if (!token) {
      socketClient.disconnect();
      return;
    }

    socketClient.connect(token);

    const handleAvatar = (payload: any) => {
      if (payload?.user) updateUser(payload.user);
    };

    socketClient.on(WS_EVENTS.USER_AVATAR_UPDATED, handleAvatar);

    return () => {
      socketClient.off(WS_EVENTS.USER_AVATAR_UPDATED, handleAvatar);
      socketClient.disconnect();
    };
  }, [token, updateUser]);

  return <>{children}</>;
}
