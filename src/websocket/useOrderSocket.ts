'use client';

import { useEffect } from 'react';
import { socketClient } from './socket';
import { WS_EVENTS } from './events';

export function useOrderSocket({
  onNewOrder,
  onStatusUpdated,
  onOrderCreated,
}: {
  onNewOrder?: (payload: any) => void;
  onStatusUpdated?: (payload: any) => void;
  onOrderCreated?: (payload: any) => void;
}) {
  useEffect(() => {
    if (onNewOrder) socketClient.on(WS_EVENTS.NEW_ORDER, onNewOrder);
    if (onOrderCreated) socketClient.on(WS_EVENTS.ORDER_CREATED, onOrderCreated);
    if (onStatusUpdated) {
      socketClient.on(WS_EVENTS.ORDER_STATUS_UPDATE, onStatusUpdated);
      socketClient.on(WS_EVENTS.ORDER_STATUS_UPDATED, onStatusUpdated);
    }

    return () => {
      if (onNewOrder) socketClient.off(WS_EVENTS.NEW_ORDER, onNewOrder);
      if (onOrderCreated) socketClient.off(WS_EVENTS.ORDER_CREATED, onOrderCreated);
      if (onStatusUpdated) {
        socketClient.off(WS_EVENTS.ORDER_STATUS_UPDATE, onStatusUpdated);
        socketClient.off(WS_EVENTS.ORDER_STATUS_UPDATED, onStatusUpdated);
      }
    };
  }, [onNewOrder, onOrderCreated, onStatusUpdated]);
}
