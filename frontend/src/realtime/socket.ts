import { io, type Socket } from 'socket.io-client';
import { apiClient } from '../api/client';

let realtimeSocket: Socket | null = null;
let connectedToken: string | null = null;

export const connectRealtimeSocket = (token?: string | null): Socket => {
  const accessToken = token || localStorage.getItem('accessToken');
  if (realtimeSocket && connectedToken === accessToken) return realtimeSocket;

  realtimeSocket?.disconnect();
  connectedToken = accessToken;
  const apiBaseUrl = apiClient.defaults.baseURL || window.location.origin;
  const socketUrl = apiBaseUrl.replace(/\/api(?:\/v\d+)?\/?$/, '');
  realtimeSocket = io(socketUrl, accessToken ? { auth: { token: accessToken } } : {});
  return realtimeSocket;
};

export const disconnectRealtimeSocket = () => {
  realtimeSocket?.disconnect();
  realtimeSocket = null;
  connectedToken = null;
};
