import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function initSocket() {
      const token = await AsyncStorage.getItem('@naseeb_token');
      const socket = io(SOCKET_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to socket gateway');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from socket gateway');
      });

      socketRef.current = socket;
    }

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const subscribe = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const unsubscribe = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return { isConnected, subscribe, unsubscribe, socket: socketRef.current };
}
