'use client';

import { useEffect } from 'react';
import { socketClient } from './socket';

export function useRealtimeRefetch(events: string[], refetch: () => void | Promise<void>) {
  const key = events.join('|');

  useEffect(() => {
    const eventNames = key.split('|').filter(Boolean);
    const handler = () => {
      Promise.resolve(refetch()).catch(() => undefined);
    };

    eventNames.forEach((event) => socketClient.on(event, handler));
    return () => {
      eventNames.forEach((event) => socketClient.off(event, handler));
    };
  }, [key, refetch]);
}
