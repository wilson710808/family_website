import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

interface OnlineUser {
  socketId: string;
  userId: number;
  familyId: number;
  userName: string;
  avatar: string;
  lastActive: number;
}

// 在线用户管理
class SocketManager {
  private io: Server | null = null;
  private onlineUsers: Map<string, OnlineUser> = new Map(); // socketId -> OnlineUser

  init(httpServer: HttpServer) {
    if (this.io) {
      console.log('[Socket] Already initialized');
      return;
    }

    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      path: '/socket.io/',
    });

    console.log('[Socket] Initialized');

    this.io.on('connection', (socket) => {
      console.log('[Socket] User connected:', socket.id);

      // 加入家族聊天室
      socket.on('join-family', (data: { familyId: number; userId: number; userName: string; avatar: string }) => {
        const { familyId, userId, userName, avatar } = data;
        
        // 离开之前的房间（如果有）
        Array.from(socket.rooms).forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // 加入新家族房间
        socket.join(`family:${familyId}`);

        // 记录在线用户
        this.onlineUsers.set(socket.id, {
          socketId: socket.id,
          userId,
          familyId,
          userName,
          avatar,
          lastActive: Date.now(),
        });

        console.log(`[Socket] User ${userName} (${userId}) joined family ${familyId}`);

        // 广播更新在线用户列表
        this.broadcastOnlineUsers(familyId);

        // 检查是否需要管家打招呼（当天第一次进入）
        // 这个检查在客户端处理后通过事件触发
      });

      // 发送聊天消息
      socket.on('chat-message', (data: { 
        familyId: number; 
        userId: number; 
        userName: string; 
        avatar: string;
        content: string;
        messageId: number;
        createdAt: string;
      }) => {
        const { familyId, ...messageData } = data;
        // 广播给房间里所有人（包括发送者）
        this.io?.to(`family:${familyId}`).emit('chat-message', messageData);
        
        // 更新用户最后活跃时间
        const user = this.onlineUsers.get(socket.id);
        if (user) {
          user.lastActive = Date.now();
          this.onlineUsers.set(socket.id, user);
        }
      });

      // 管家打招呼
      socket.on('butler-greeting', (data: { familyId: number; content: string }) => {
        const { familyId, content } = data;
        // 广播给房间所有人，显示管家欢迎信息
        this.io?.to(`family:${familyId}`).emit('chat-message', {
          userId: 0, // 0 表示系统/管家
          userName: '聊天室管家',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=butler',
          content,
          messageId: Date.now(),
          createdAt: new Date().toISOString(),
          isButler: true,
        });
      });

      // 用户正在输入
      socket.on('typing', (data: { familyId: number; userName: string }) => {
        socket.to(`family:${data.familyId}`).emit('typing', { userName: data.userName });
      });

      // 断开连接
      socket.on('disconnect', () => {
        const user = this.onlineUsers.get(socket.id);
        if (user) {
          const familyId = user.familyId;
          this.onlineUsers.delete(socket.id);
          this.broadcastOnlineUsers(familyId);
          console.log(`[Socket] User ${user.userName} disconnected from family ${familyId}`);
        }
        console.log('[Socket] User disconnected:', socket.id);
      });
    });
  }

  getIO(): Server | null {
    return this.io;
  }

  // 获取家族在线用户列表
  getOnlineUsersForFamily(familyId: number): OnlineUser[] {
    const result: OnlineUser[] = [];
    const seenUserIds = new Set<number>();

    // 同一个用户可能多个设备在线，只显示一次
    for (const user of this.onlineUsers.values()) {
      if (user.familyId === familyId && !seenUserIds.has(user.userId)) {
        result.push(user);
        seenUserIds.add(user.userId);
      }
    }

    return result;
  }

  // 广播在线用户列表给家族房间
  broadcastOnlineUsers(familyId: number) {
    const onlineUsers = this.getOnlineUsersForFamily(familyId);
    this.io?.to(`family:${familyId}`).emit('online-users', {
      count: onlineUsers.length,
      users: onlineUsers.map(u => ({
        userId: u.userId,
        userName: u.userName,
        avatar: u.avatar,
      })),
    });
  }

  cleanupInactiveUsers() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const familiesToUpdate = new Set<number>();

    for (const [socketId, user] of this.onlineUsers.entries()) {
      if (now - user.lastActive > fiveMinutes * 2) { // 10分钟不活跃则移除
        familiesToUpdate.add(user.familyId);
        this.onlineUsers.delete(socketId);
      }
    }

    // 更新每个受影响家族的在线列表
    familiesToUpdate.forEach(familyId => {
      this.broadcastOnlineUsers(familyId);
    });
  }
}

export const socketManager = new SocketManager();
export default socketManager;
