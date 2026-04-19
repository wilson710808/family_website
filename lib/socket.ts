import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { db } from './db';
import {
  getEarlyNotifications,
  getTodaysAnnouncements,
  getTodaysReminders,
  markEarlyNotified,
  markTodayNotified,
  markReminderSent,
  getUpcomingAnnouncements,
  getUpcomingReminders,
  isTodayHoliday,
  saveButlerReply,
  saveChatMessage,
  getTodayChatMessages,
  getFamilyMemberProfiles,
  getRecentDailySummaries,
} from '../plugins/family-butler';
import { getTodaysBirthdays } from '../plugins/birthday-reminder';
import {
  generateButlerReply,
  generateBirthdayGreeting,
  generateHolidayGreeting,
  generateDailySummary,
} from '../plugins/family-butler/ai-service';

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

        // 离开之前的房间(如果有)
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

        // 家族管家:新成員進入聊天室,熱烈歡迎 + 友情提醒相關未過期事項
        this.welcomeNewMember(familyId, userId, userName);
      });

      // 发送聊天消息
      socket.on('chat-message', async (data: {
        familyId: number;
        userId: number;
        userName: string;
        avatar: string;
        content: string;
        messageId: number;
        createdAt: string;
    messageType?: 'text' | 'image' | 'sticker';
      }) => {
        const { familyId, ...messageData } = data;
        // 广播给房间里所有人(包括发送者)
        this.io?.to(`family:${familyId}`).emit('chat-message', messageData);

        // 更新用户最后活跃时间
        const user = this.onlineUsers.get(socket.id);
        if (user) {
          user.lastActive = Date.now();
          this.onlineUsers.set(socket.id, user);

    // 只处理文本消息的管家回复（图片和表情不触发AI）
    const msgType = (data.messageType || 'text') as 'text' | 'image' | 'sticker';
    if (msgType !== 'text') return;
        }

        // 家族管家:檢查是否需要回覆
        // 規則:
        // 1. 如果消息包含 "管家" 或者 "@管家" → 一定回覆,開始對話
        // 2. 如果最近 10 分鐘內已經有管家回覆 → 繼續對話,自動回覆
        // 3. 如果超過 2 分鐘沒有人回覆這條消息 → 管家主動接話鼓勵
        // 4. 如果聊天室只有一位成員在線 → 默認所有對話都是跟管家互動,必須回覆
        // 這樣不需要每次都@管家,可以連續對話
        const onlineCount = this.getOnlineUsersForFamily(data.familyId).length;
        const shouldReply =
          data.content.includes('管家') ||
          this.hasRecentButlerReply(data.familyId) ||
          this.shouldInitiateReply(data.familyId) ||
          onlineCount <= 1; // 只有一位成員在線,默認和管家對話

        if (shouldReply) {
          console.log(`[FamilyButler] 需要回覆: ${data.content} (by ${data.userName}), online=${onlineCount}`);
          console.log(`[FamilyButler] 需要回覆: ${data.content} (by ${data.userName})`);
          try {
            // 獲取最近10條消息作為上下文
            const recentMessages = this.getRecentMessagesForButler(data.familyId);
            console.log(`[FamilyButler] 獲取到 ${recentMessages.length} 條最近消息作為上下文`);

            // 獲取上下文信息
            const upcomingEvents = getUpcomingAnnouncements(db, data.familyId);
            const upcomingReminders = getUpcomingReminders(db, data.familyId);
            const todaysBirthdays = getTodaysBirthdays(data.familyId);
            const { isHoliday, name: holidayName } = isTodayHoliday();
            console.log(`[FamilyButler] 上下文: events=${upcomingEvents.length}, reminders=${upcomingReminders.length}, birthdays=${todaysBirthdays.length}, holiday=${isHoliday}`);
      // 獲取家庭畫像和歷史摘要
      const memberProfiles = getFamilyMemberProfiles(db, data.familyId);
      const recentSummaries = getRecentDailySummaries(db, data.familyId, 3);
      console.log(`[FamilyButler] 家庭畫像: members=${memberProfiles.length}, summaries=${recentSummaries.length}`);
      
      // 直接調用 AI 生成回覆
      const reply = await generateButlerReply({
        familyId: data.familyId,
        userId: data.userId,
        userName: data.userName,
        message: data.content,
        recentMessages: recentMessages,
        context: {
          hasBirthdayToday: todaysBirthdays.length > 0,
          birthdayPerson: todaysBirthdays.length > 0 ? todaysBirthdays[0].title : undefined,
          isHoliday,
          holidayName: isHoliday ? holidayName : undefined,
          upcomingEvents,
          upcomingReminders,
        },
        familyProfile: {
          memberProfiles: memberProfiles.map((p: any) => ({
            user_name: p.user_name,
            personality_traits: p.personality_traits ? JSON.parse(p.personality_traits) : [],
            concerns: p.concerns ? JSON.parse(p.concerns) : [],
            achievements: p.achievements ? JSON.parse(p.achievements) : [],
          })),
          recentSummaries: recentSummaries.map((s: any) => s.summary_text),
        },
      });

            console.log(`[FamilyButler] 生成回覆成功: ${reply.slice(0, 50)}...`);
            // 廣播管家回覆到聊天室
            this.sendButlerMessage(data.familyId, reply);
          } catch (error) {
            console.error('[FamilyButler] 生成回覆失敗:', error);
            console.error('[FamilyButler] Error stack:', (error as Error).stack);
            this.sendButlerMessage(data.familyId, '抱歉,我現在有點反應遲鈍,請稍後再試試看😊');
          }
        }
      });

      // 管家打招呼
      socket.on('butler-greeting', (data: { familyId: number; content: string }) => {
        const { familyId, content } = data;
        // 广播给房间所有人,显示管家欢迎信息
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

    // 啟動定時任務檢查 - 每小時檢查一次需要發送的提醒
    this.startScheduledTasks();
  }

  // 啟動定時任務
  private startScheduledTasks() {
    console.log('[FamilyButler] 啟動定時任務檢查');

    // 每小時檢查一次
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60 * 60 * 1000);

    // 啟動時立即檢查一次
    setTimeout(() => {
      this.checkScheduledNotifications();
    }, 10 * 1000);
  }

  // 檢查需要發送的通知
  // 使用台北時區 (GMT+8)
  private async checkScheduledNotifications() {
    try {
      const currentTime = new Date();
      // 轉換到 GMT+8 獲取正確日期
      const taipeiNow = new Date(currentTime.getTime() + 8 * 60 * 60 * 1000);
      const year = taipeiNow.getUTCFullYear();
      const month = String(taipeiNow.getUTCMonth() + 1).padStart(2, '0');
      const day = String(taipeiNow.getUTCDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      // 1. 提前通知即將到來的公告
      const earlyNotifications = getEarlyNotifications(db, today);
      for (const notification of earlyNotifications) {
        this.sendButlerMessage(notification.family_id,
          `📢 【提前提醒】${notification.title} 將在 ${notification.notify_days_before} 天后(${notification.event_date})舉行:\n${notification.content}`
        );
        markEarlyNotified(db, notification.id);
        console.log(`[FamilyButler] 已發送提前提醒: ${notification.title}`);
      }

      // 2. 今天舉行的活動通知
      const todaysAnnouncements = getTodaysAnnouncements(db, today);
      for (const announcement of todaysAnnouncements) {
        let timeText = '';
        if (announcement.event_time) {
          timeText = ` 時間:${announcement.event_time}`;
        }
        this.sendButlerMessage(announcement.family_id,
          `📅 【今日活動】${announcement.title} 今天舉行!${timeText}\n${announcement.content}`
        );
        markTodayNotified(db, announcement.id);
        console.log(`[FamilyButler] 已發送今日活動通知: ${announcement.title}`);
      }

      // 3. 今天需要提醒的事項
      const todaysReminders = getTodaysReminders(db, today);
      for (const reminder of todaysReminders) {
        let timeText = '';
        if (reminder.remind_time) {
          timeText = ` 時間:${reminder.remind_time}`;
        }
        this.sendButlerMessage(reminder.family_id,
          `⏰ 【今日提醒】${reminder.content} (由 ${reminder.creator_name} 添加)${timeText}`
        );
        markReminderSent(db, reminder.id);
        console.log(`[FamilyButler] 已發送今日提醒: ${reminder.content}`);
      }

      // 4. 今天生日祝賀
      // 收集所有當前有在線用戶的家族,檢查生日
      const activeFamilies = new Set<number>();
      for (const user of this.onlineUsers.values()) {
        activeFamilies.add(user.familyId);
      }
      for (const familyId of activeFamilies) {
        const todaysBirthdays = getTodaysBirthdays(familyId);
        for (const birthday of todaysBirthdays) {
          // 獲取該提醒所在家族,發送生日祝賀
          const greeting = await generateBirthdayGreeting(birthday.title);
          this.sendButlerMessage(familyId, greeting);
          console.log(`[FamilyButler] 已發送生日祝賀: ${birthday.title} (家族 ${familyId})`);
        }
      }

      // 5. 今天是否節日
      const { isHoliday, name } = isTodayHoliday();
      if (isHoliday) {
        // 這裡需要找出所有家族,發送祝福
        // 簡化版本:只發給當前有在綫用戶的家族
        const activeFamilies = new Set<number>();
        for (const user of this.onlineUsers.values()) {
          activeFamilies.add(user.familyId);
        }
        const greeting = await generateHolidayGreeting(name);
        activeFamilies.forEach(familyId => {
          this.sendButlerMessage(familyId, greeting);
        });
        console.log(`[FamilyButler] 已發送${name}祝福`);
      }

// 6. 檢查是否年底,生成年度總結(台北時區)
    const isLastDayOfYear = taipeiNow.getUTCMonth() === 11 && taipeiNow.getUTCDate() === 31;
    if (isLastDayOfYear) {
      console.log('[FamilyButler] 今天是年底,準備生成年度總結');
    }

    // 7. 每天凌晨2點生成昨日摘要(台北時區)
    const hour = taipeiNow.getUTCHours();
    if (hour === 2) {
      // 重新獲取所有活躍家族
      const allFamilyIds = new Set<number>();
      for (const user of this.onlineUsers.values()) {
        allFamilyIds.add(user.familyId);
      }

      for (const familyId of allFamilyIds) {
        try {
          const { saveDailySummary } = await import('../plugins/family-butler');

          // 檢查是否已經有昨日的摘要
          const yesterday = new Date(taipeiNow.getTime() - 24 * 60 * 60 * 1000);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          // 獲取昨日的聊天消息
          const yesterdayMessages = getTodayChatMessages(db, familyId);

          if (yesterdayMessages.length > 5) {
            // 只有足夠的聊天才生成摘要
            const summaryResult = await generateDailySummary(
              yesterdayMessages.map((m: any) => ({
                user_name: m.user_name,
                content: m.content,
                created_at: m.created_at,
              }))
            );

            saveDailySummary(db, {
              family_id: familyId,
              summary_date: yesterdayStr,
              summary_text: summaryResult.summary_text,
              key_topics: summaryResult.key_topics,
              key_members: summaryResult.key_members,
              mood_score: summaryResult.mood_score,
            });

            console.log(`[FamilyButler] 已為家族 ${familyId} 生成昨日摘要`);
          }
        } catch (error) {
          console.error(`[FamilyButler] 生成家族 ${familyId} 摘要失敗:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[FamilyButler] 定時通知檢查失敗:', error);
  }
}
  private sendButlerMessage(familyId: number, content: string) {
    const messageId = Date.now() + Math.random();
    const createdAt = new Date().toISOString();
    
    // 廣播到聊天室
    this.io?.to(`family:${familyId}`).emit('chat-message', {
      userId: 0,
      userName: '聊天室管家',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=butler',
      content,
      messageId,
      createdAt,
      isButler: true,
    });
    
    // 保存管家回覆到 chat_messages 表（這樣用戶可以看到歷史）
    try {
      const stmt = db.prepare(`
        INSERT INTO chat_messages (family_id, user_id, content, created_at)
        VALUES (?, 0, ?, ?)
      `);
      stmt.run(familyId, content, createdAt);
    } catch (error) {
      console.error('[FamilyButler] 保存管家消息到 chat_messages 失敗:', error);
    }
    
    // 同時保存到管家專用表
    try {
      saveButlerReply(db, {
        family_id: familyId,
        message_id: Math.floor(messageId),
        content,
        trigger_type: 'auto',
      });
    } catch (error) {
      console.error('[FamilyButler] 保存管家回覆失敗:', error);
    }
  }

  // 獲取最近消息給管家作為上下文
  private getRecentMessagesForButler(familyId: number): Array<{userName: string; content: string}> {
    // 從數據庫獲取最近10條消息(better-sqlite3 是同步 API)
    try {
      const stmt = db.prepare(`
          SELECT cm.user_id, cm.content, u.name as user_name FROM chat_messages cm LEFT JOIN users u ON cm.user_id = u.id
          WHERE family_id = ?
          ORDER BY created_at DESC
          LIMIT 10
        `);
      const rows = stmt.all(familyId);
      // 反轉回正確順序(最早到最新)
      return rows.reverse().map((row: any) => ({
        userName: row.user_id === 0 ? '聊天室管家' : row.user_name,
        content: row.content,
      }));
    } catch (error) {
      console.error('[FamilyButler] 獲取最近消息失敗:', error);
      return [];
    }
  }

  // 檢查最近是否已經有管家回覆,如果有則繼續對話
  private hasRecentButlerReply(familyId: number): boolean {
    // 檢查最近 10 分鐘內是否有管家(user_id = 0)
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM chat_messages
        WHERE family_id = ? AND user_id = 0
        AND created_at >= datetime('now', '-10 minutes')
      `);
      const result = stmt.get(familyId) as any;
      return result.count > 0;
    } catch (error) {
      return false;
    }
  }

  // 檢查是否需要管家主動接話:
  // 如果最後一條消息是普通成員發的,且 2 分鐘內沒有人回覆 → 管家主動接話
  // 使用台北時區(GMT+8)
  private shouldInitiateReply(familyId: number): boolean {
    try {
      // 獲取最後一條消息
      const stmt = db.prepare(`
        SELECT user_id, created_at FROM chat_messages
        WHERE family_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const lastMessage = stmt.get(familyId) as any;

      // 如果最後一條已經是管家發的,不需要
      if (!lastMessage || lastMessage.user_id === 0) {
        return false;
      }

      // 檢查是否超過 2 分鐘沒人回覆
      // SQLite 存儲的是 UTC 時間,需要加上 8 小時
      const lastTime = new Date(lastMessage.created_at).getTime();
      const now = Date.now();
      const diffMinutes = (now - lastTime) / (1000 * 60);

      // 2-10 分鐘內沒人回覆 → 管家主動接話
      const should = diffMinutes >= 2 && diffMinutes <= 10;
      console.log(`[FamilyButler] shouldInitiateReply: family=${familyId}, diff=${diffMinutes.toFixed(1)}min, should=${should}`);
      return should;
    } catch (error) {
      console.error('[FamilyButler] shouldInitiateReply error:', error);
      return false;
    }
  }

  getIO(): Server | null {
    return this.io;
  }

  // 获取家族在线用户列表
  getOnlineUsersForFamily(familyId: number): OnlineUser[] {
    const result: OnlineUser[] = [];
    const seenUserIds = new Set<number>();

    // 同一个用户可能多个设备在线,只显示一次
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

  // 新成員進入聊天室歡迎 + 友情提醒
  private async welcomeNewMember(familyId: number, userId: number, userName: string) {
    // 檢查是否今天已經歡迎過這個用戶了(避免每次進入都彈歡迎)
    // 用緩存記錄,每天只歡迎一次
    const cacheKey = `${familyId}-${userId}-${new Date().toDateString()}`;
    const welcomeCache = (this as any)._welcomeCache || new Set();
    if (welcomeCache.has(cacheKey)) {
      return;
    }
    welcomeCache.add(cacheKey);
    (this as any)._welcomeCache = welcomeCache;

    console.log(`[FamilyButler] 新成員 ${userName} 進入家族 ${familyId},準備發送歡迎`);

    // 1. 查詢與該成員相關的未過期公告(從家族管家插件的公告表)
    const relatedAnnouncements: any[] = [];
    try {
      const stmt = db.prepare(`
        SELECT * FROM plugin_butler_announcements
        WHERE family_id = ?
        AND (event_date >= date('now') OR event_date IS NULL)
        AND content LIKE ?
        ORDER BY event_date ASC
      `);
      const rows = stmt.all(familyId, `%${userName}%`);
      relatedAnnouncements.push(...rows);
    } catch (error) {
      // 如果表不存在,忽略錯誤
      console.log('[FamilyButler] 查詢公告提醒失敗(可能表不存在):', error);
    }

    // 2. 查詢留言板(message-board 插件)中與該成員相關的未過期主題
    const relatedMessages: any[] = [];
    try {
      // 留言板本身沒有過期概念,但可以查找最近 30 天內提到該用戶的消息
      const stmt = db.prepare(`
        SELECT id, content, created_at FROM messages
        WHERE family_id = ?
        AND content LIKE ?
        AND created_at >= datetime('now', '-30 days')
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(familyId, `%${userName}%`);
      relatedMessages.push(...rows);
    } catch (error) {
      console.log('[FamilyButler] 查詢留言板提醒失敗(可能表不存在):', error);
    }

    // 3. 查詢與該成員相關的未來提醒事項
    const relatedReminders: any[] = [];
    try {
      const stmt = db.prepare(`
        SELECT * FROM plugin_butler_scheduled_reminders
        WHERE family_id = ?
        AND remind_date >= date('now')
        AND (content LIKE ? OR created_by = ?)
        ORDER BY remind_date ASC
      `);
      const rows = stmt.all(familyId, `%${userName}%`, userId);
      relatedReminders.push(...rows);
    } catch (error) {
      console.log('[FamilyButler] 查詢提醒事項失敗(可能表不存在):', error);
    }

    // 構建歡迎消息
    const greetings = [
      `🎉 熱烈歡迎 **${userName}** 進入家族聊天室!`,
      `👋 歡迎 ${userName} 來到我們溫馨的家族聊天室!`,
      `🌟 哇~ ${userName} 來了!熱烈歡迎!`,
      `💖 歡迎 ${userName} 加入聊天室,今天也要開心哦!`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    let welcomeMessage = greeting;
    let hasReminder = false;

    // 添加友情提醒
    if (relatedAnnouncements.length > 0 || relatedReminders.length > 0 || relatedMessages.length > 0) {
      welcomeMessage += '\n\n📋 這裡有幾項和你有關的事項提醒你:';
      hasReminder = true;

      // 公告提醒
      relatedAnnouncements.forEach(ann => {
        const dateStr = ann.event_date ? ` (${ann.event_date})` : '';
        welcomeMessage += `\n• 📢 ${ann.title}${dateStr}`;
      });

      // 提醒事項
      relatedReminders.forEach(rem => {
        const dateStr = rem.remind_date ? ` (${rem.remind_date})` : '';
        welcomeMessage += `\n• ⏰ ${rem.content}${dateStr}`;
      });

      // 留言板提及(最近30天內)
      if (relatedMessages.length > 0) {
        welcomeMessage += `\n• 💬 最近留言板有 ${relatedMessages.length} 條消息提到你哦`;
      }
    }

    if (!hasReminder) {
      welcomeMessage += '\n\n歡迎隨時和大家聊聊天,有什麼需要幫忙的隨時找我哦😊';
    } else {
      welcomeMessage += '\n\n有什麼問題隨時問我,祝你聊天愉快😊';
    }

    // 延遲 1 秒發送,讓用戶體驗更好
    setTimeout(() => {
      this.sendButlerMessage(familyId, welcomeMessage);
    }, 1000);
  }
}

export const socketManager = new SocketManager();
export default socketManager;
