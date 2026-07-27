import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface OrderEventPayload {
  orderId: number;
  status: string;
  previousStatus?: string;
  [key: string]: any;
}

interface UseOrderWebSocketOptions {
  onOrderCreated?: (data: OrderEventPayload) => void;
  onOrderUpdated?: (data: OrderEventPayload) => void;
  onOrderCancelled?: (data: OrderEventPayload) => void;
  onOrderPreparing?: (data: OrderEventPayload) => void;
  onOrderReady?: (data: OrderEventPayload) => void;
  onOrderDelivered?: (data: OrderEventPayload) => void;
  onDeliveryAgentAssigned?: (data: OrderEventPayload) => void;
}

/**
 * Hook for real-time order updates via WebSocket
 * Subscribes to restaurant-specific order events
 */
export function useOrderWebSocket(
  restaurantId: number | null,
  options: UseOrderWebSocketOptions = {},
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // Subscribe to restaurant room
      if (restaurantId) {
        socket.emit('subscribe:restaurant', { restaurantId });
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', {
        message: error.message,
        type: 'connection_error',
        url: SOCKET_URL,
        restaurantId,
        rawError: error,
      });
      setIsConnected(false);
    });

    // Order event listeners
    socket.on('order.created', (data) => {
      console.log('Order created event:', data);
      setLastEvent({ event: 'order.created', data });
      optionsRef.current.onOrderCreated?.(data);
    });

    socket.on('order.updated', (data) => {
      console.log('Order updated event:', data);
      setLastEvent({ event: 'order.updated', data });
      optionsRef.current.onOrderUpdated?.(data);
    });

    socket.on('order.cancelled', (data) => {
      console.log('Order cancelled event:', data);
      setLastEvent({ event: 'order.cancelled', data });
      optionsRef.current.onOrderCancelled?.(data);
    });

    socket.on('order.preparing', (data) => {
      console.log('Order preparing event:', data);
      setLastEvent({ event: 'order.preparing', data });
      optionsRef.current.onOrderPreparing?.(data);
    });

    socket.on('order.ready', (data) => {
      console.log('Order ready event:', data);
      setLastEvent({ event: 'order.ready', data });
      optionsRef.current.onOrderReady?.(data);
    });

    socket.on('order.delivered', (data) => {
      console.log('Order delivered event:', data);
      setLastEvent({ event: 'order.delivered', data });
      optionsRef.current.onOrderDelivered?.(data);
    });

    socket.on('order.assigned', (data) => {
      console.log('Delivery agent assigned event:', data);
      setLastEvent({ event: 'order.assigned', data });
      optionsRef.current.onDeliveryAgentAssigned?.(data);
    });

    socket.on('subscribed', (data) => {
      console.log('Subscribed to restaurant:', data.restaurantId);
    });

    socket.on('error', (error) => {
      console.error('WebSocket runtime error:', {
        message: typeof error === 'object' ? JSON.stringify(error) : error,
        type: 'runtime_error',
        url: SOCKET_URL,
        restaurantId,
        socketId: socket.id,
        connected: socket.connected,
      });
    });

    socketRef.current = socket;
  }, [restaurantId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Re-subscribe when restaurant changes
  useEffect(() => {
    if (socketRef.current?.connected && restaurantId) {
      socketRef.current.emit('subscribe:restaurant', { restaurantId });
    }
  }, [restaurantId]);

  return {
    isConnected,
    lastEvent,
    socket: socketRef.current,
  };
}
