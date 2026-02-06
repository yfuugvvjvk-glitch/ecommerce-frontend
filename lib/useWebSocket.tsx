'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';

interface WebSocketHookOptions {
  onInventoryUpdate?: (data: any) => void;
  onFinancialUpdate?: (data: any) => void;
  onOrderUpdate?: (data: any) => void;
  onNewOrder?: (data: any) => void;
  onLowStockAlert?: (data: any) => void;
  onContentUpdate?: (data: any) => void;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const { token, user } = useAuth();
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user || typeof window === 'undefined') return;

    let mounted = true;

    // Import dinamic pentru a evita probleme SSR
    const connectWebSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        
        if (!mounted) return;

        // Conectează la WebSocket
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        socketRef.current = socket;

        // Event listeners
        socket.on('connect', () => {
          console.log('🔌 Connected to WebSocket');
          if (mounted) setIsConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('🔌 Disconnected from WebSocket');
          if (mounted) setIsConnected(false);
        });

        socket.on('inventory_update', (data: any) => {
          console.log('📦 Inventory update:', data);
          if (mounted) options.onInventoryUpdate?.(data);
        });

        socket.on('financial_update', (data: any) => {
          console.log('💰 Financial update:', data);
          if (mounted) options.onFinancialUpdate?.(data);
        });

        socket.on('order_update', (data: any) => {
          console.log('🛒 Order update:', data);
          if (mounted) options.onOrderUpdate?.(data);
        });

        socket.on('new_order', (data: any) => {
          console.log('🆕 New order:', data);
          if (mounted) options.onNewOrder?.(data);
        });

        socket.on('low_stock_alert', (data: any) => {
          console.log('⚠️ Low stock alert:', data);
          if (mounted) options.onLowStockAlert?.(data);
        });

        socket.on('content_update', (data: any) => {
          console.log('📝 Content update:', data);
          if (mounted) options.onContentUpdate?.(data);
        });

        socket.on('connect_error', (error: any) => {
          console.error('❌ WebSocket connection error:', error);
          if (mounted) setIsConnected(false);
        });

      } catch (error) {
        console.error('Failed to load socket.io-client:', error);
        if (mounted) setIsConnected(false);
      }
    };

    // Delay connection to ensure component is mounted
    const timer = setTimeout(connectWebSocket, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, user]);

  return {
    socket: socketRef.current,
    isConnected
  };
}