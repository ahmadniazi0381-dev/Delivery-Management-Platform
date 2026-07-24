import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import prisma from '../config/db';

export type SocketUser = {
  id: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'RIDER';
  phoneVerified: boolean;
};

export interface StaffPresence {
  userId: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastSeen: string;
  currentTask: string;
  activeOrderCount: number;
}

const onlineStaffMap = new Map<string, { socketId: string; presence: StaffPresence }>();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required.');
  return secret;
}

export function verifySocketToken(token: string): SocketUser {
  const decoded = jwt.verify(token, getJwtSecret()) as SocketUser;
  if (!decoded?.id || !decoded?.role) {
    throw new Error('Invalid token payload.');
  }
  return decoded;
}

export async function authorizeSocketJoin(
  token: string,
  options: { requiredRole?: 'CUSTOMER' | 'ADMIN' | 'RIDER'; expectedUserId?: string } = {}
): Promise<SocketUser | null> {
  try {
    const decoded = verifySocketToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.blockedAt) return null;
    if (options.requiredRole && user.role !== options.requiredRole) return null;
    if (options.expectedUserId && user.id !== options.expectedUserId) return null;
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      phoneVerified: user.phoneVerified,
    };
  } catch {
    return null;
  }
}

export function broadcastStaffPresence(io: import('socket.io').Server) {
  const list = Array.from(onlineStaffMap.values()).map((item) => item.presence);
  io.to('admin').emit('staff:presence', list);
}

export function registerAuthenticatedSocketHandlers(io: import('socket.io').Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('admin:join', async (data: { token?: string }) => {
      if (!data?.token) {
        socket.emit('admin:joined', { status: 'error', error: 'Authentication token required.' });
        return;
      }
      const user = await authorizeSocketJoin(data.token, { requiredRole: 'ADMIN' });
      if (!user) {
        socket.emit('admin:joined', { status: 'error', error: 'Invalid or unauthorized token.' });
        return;
      }
      socket.join('admin');
      socket.data.user = user;

      // Track presence
      const userDetails = await prisma.user.findUnique({
        where: { id: user.id },
        include: { staffProfile: true },
      });

      const presence: StaffPresence = {
        userId: user.id,
        name: userDetails?.name || 'Staff Member',
        role: userDetails?.staffProfile?.staffRole || 'MANAGER',
        isOnline: true,
        lastSeen: new Date().toISOString(),
        currentTask: 'Managing Orders',
        activeOrderCount: await prisma.order.count({
          where: { status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] } },
        }),
      };

      onlineStaffMap.set(user.id, { socketId: socket.id, presence });
      console.log(`[SOCKET] Admin ${user.id} (${presence.name}) joined admin room: ${socket.id}`);
      socket.emit('admin:joined', { status: 'ok', presence });

      broadcastStaffPresence(io);
    });

    socket.on('user:join', async (data: { token?: string; userId?: string }) => {
      if (!data?.token || !data?.userId) {
        socket.emit('user:joined', { status: 'error', error: 'Token and userId are required.' });
        return;
      }
      const user = await authorizeSocketJoin(data.token, {
        requiredRole: 'CUSTOMER',
        expectedUserId: data.userId,
      });
      if (!user) {
        socket.emit('user:joined', { status: 'error', error: 'Invalid or unauthorized token.' });
        return;
      }
      socket.join(`user:${user.id}`);
      socket.data.user = user;
      console.log(`[SOCKET] Customer ${user.id} joined personal room: ${socket.id}`);
      socket.emit('user:joined', { status: 'ok' });
    });

    socket.on('rider:join', async (data: { token?: string; riderId?: string }) => {
      if (!data?.token || !data?.riderId) {
        socket.emit('rider:joined', { status: 'error', error: 'Token and riderId are required.' });
        return;
      }
      const user = await authorizeSocketJoin(data.token, {
        requiredRole: 'RIDER',
        expectedUserId: data.riderId,
      });
      if (!user) {
        socket.emit('rider:joined', { status: 'error', error: 'Invalid or unauthorized token.' });
        return;
      }
      socket.join(`rider:${user.id}`);
      socket.data.user = user;
      console.log(`[SOCKET] Rider ${user.id} joined rider room: ${socket.id}`);
      socket.emit('rider:joined', { status: 'ok' });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.data.user?.id && onlineStaffMap.has(socket.data.user.id)) {
        const item = onlineStaffMap.get(socket.data.user.id);
        if (item) {
          item.presence.isOnline = false;
          item.presence.lastSeen = new Date().toISOString();
        }
        onlineStaffMap.delete(socket.data.user.id);
        broadcastStaffPresence(io);
      }
    });
  });
}
