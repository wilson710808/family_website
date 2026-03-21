'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import { Send, Users, MessageSquare, Clock, Bot, Check, CheckCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ChatMessage {
  id: number;
  family_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
  isButler?: boolean;
  read_count?: number;
}

interface OnlineUser {
  userId: number;
  userName: string;
  avatar: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  is_admin?: number;
}

let socket: Socket | null = null;

function ChatContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // 记录今天是否已经打招呼
  const hasGreetedToday = (): boolean => {
    if (!familyId || !user) return true;
    const key = `greeted_${familyId}_${user.id}_${new Date().toDateString()}`;
    return localStorage.getItem(key) === 'true';
  };

  const markGreetedToday = () => {
    if (!familyId || !user) return;
    const key = `greeted_${familyId}_${user.id}_${new Date().toDateString()}`;
    localStorage.setItem(key, 'true');
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 标记消息已读
  const markMessageAsRead = async (messageId: number) => {
    if (!familyId || !user) return;

    try {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          familyId: Number(familyId),
          userId: user.id,
        }),
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 当消息可见时，标记所有未读消息为已读
  const markAllMessagesAsRead = () => {
    if (!familyId || !user || !messages.length) return;
    
    messages.forEach(message => {
      if (message.user_id !== user.id) {
        markMessageAsRead(message.id);
      }
    });
  };

  // 获取当前用户
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
      });
  }, []);

  // 加载历史消息
  useEffect(() => {
    if (!familyId || !user) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chat?familyId=${familyId}&userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          setTotalMembers(data.totalMembers || 0);
        }
      } catch (error) {
          console.error('加载消息失败:', error);
        } finally {
          setLoading(false);
        }
      };

      loadMessages();
  }, [familyId, user]);

  // 初始化 Socket.IO 连接
  useEffect(() => {
    if (!familyId || !user) return;

    // 连接 Socket.IO
    const socketUrl = window.location.origin;
    socket = io(socketUrl, {
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
      
      // 加入家族房间
      socket?.emit('join-family', {
        familyId: Number(familyId),
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
      });

      // 检查是否需要管家打招呼
      if (!hasGreetedToday()) {
        const greetings = [
          `🎉 欢迎 ${user.name} 来到我们的家族聊天室！今天过得怎么样呀？😊`,
          `👋 ${user.name} 来了！热烈欢迎～ 今天有什么想跟大家分享的吗？`,
          `💖 ${user.name} 好呀！很高兴你今天来到聊天室，快来跟家人们聊聊天吧！`,
          `🌟 欢迎 ${user.name} 加入我们！今天天气真好，一起来聊聊吧～`,
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        socket?.emit('butler-greeting', {
          familyId: Number(familyId),
          content: randomGreeting,
        });
        markGreetedToday();
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    // 接收新消息
    socket.on('chat-message', (message) => {
      // 如果是已经保存到数据库的消息，转换格式
      if ('messageId' in message) {
        const formattedMessage: ChatMessage = {
          id: message.messageId,
          family_id: Number(familyId),
          user_id: message.userId,
          content: message.content,
          created_at: message.createdAt,
          user_name: message.userName,
          user_avatar: message.avatar,
          isButler: message.isButler,
          read_count: 1, // 发送者自己已读
        };
        setMessages(prev => [...prev, formattedMessage]);
      }
    });

    // 更新在线用户列表
    socket.on('online-users', (data) => {
      setOnlineUsers(data.users);
      setOnlineCount(data.count);
    });

    // 用户正在输入
    socket.on('typing', (data) => {
      setTypingUser(data.userName);
      setTimeout(() => {
        setTypingUser(null);
      }, 2000);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [familyId, user]);

  // 页面加载完成后标记所有消息已读
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        markAllMessagesAsRead();
      }, 1000);
    }
  }, [loading, messages]);

  // 当有新消息进来时，如果窗口已聚焦，标记新消息也标记已读
  useEffect(() => {
    const handleFocus = () => {
      markAllMessagesAsRead();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !familyId || !user || !socket) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      // 先保存到数据库
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 通过 Socket.IO 广播给所有人
        socket.emit('chat-message', {
          familyId: Number(familyId),
          userId: user.id,
          userName: user.name,
          avatar: user.avatar,
          content,
          messageId: data.message.id,
          createdAt: data.message.created_at,
        });
      }
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && familyId && user && newMessage.length === 0) {
      // 开始输入时通知其他人
      socket.emit('typing', {
        familyId: Number(familyId),
        userName: user.name,
      });
    }
  };

  // 渲染已读状态图标
  const renderReadStatus = (message: ChatMessage) => {
    if (message.user_id !== user?.id) return null; // 只给自己的消息显示已读状态
    
    const readCount = message.read_count || 0;
    const unreadCount = totalMembers > 0 ? totalMembers - 1 - readCount : 0; // 减去自己

    if (readCount === 0) {
      return <Check className="w-3 h-3 text-gray-300" />;
    } else if (unreadCount > 0) {
      return <CheckCheck className="w-3 h-3 text-yellow-400" />;
    } else {
      return <CheckCheck className="w-3 h-3 text-green-500 fill-green-500" />;
    }
  };

  // 获取已读文本提示
  const getReadText = (message: ChatMessage) => {
    const readCount = message.read_count || 0;
    const total = totalMembers > 0 ? totalMembers - 1 : 0; // 减去自己

    if (readCount === 0) return '没有人已读';
    if (readCount === total) return '全部已读';
    return `${readCount}/${total} 已读`;
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">请选择家族</h2>
            <p className="text-gray-500 mb-6">请从家族页面进入聊天室</p>
            <a 
              href="/families" 
              className="inline-block px-6 py-3 bg-family-500 text-white rounded-lg hover:bg-family-600 font-medium"
            >
              前往家族页面
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-xl text-gray-500 ml-4">加载中...</p>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)] lg:max-h-[800px]">
        {/* 聊天区域 */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">家族聊天室</h2>
              {connected ? (
                <span className="flex items-center text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                  已连接
                </span>
              ) : (
                <span className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  连接中...
                </span>
              )}
            </div>
            {totalMembers > 0 && (
              <span className="text-sm text-gray-500">
                {totalMembers} 位成员
              </span>
            )}
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" onFocus={markAllMessagesAsRead} onClick={markAllMessagesAsRead}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">还没有消息，快来发送第一条消息吧！</p>
              </div>
            ) : (
              messages.map((message) => 
                <div 
                  key={message.id} 
                  className={`flex items-start space-x-3 ${message.isButler || message.user_id === 0 ? 'justify-center' : ''}`}
                >
                  {message.isButler || message.user_id === 0 ? (
                    // 管家消息
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-3 max-w-[80%] flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-blue-800">聊天室管家</span>
                        </div>
                        <p className="text-blue-900">{message.content}</p>
                      </div>
                    </div>
                  ) : message.user_id === user.id ? (
                    // 我的消息
                    <div className="flex flex-row-reverse items-start space-x-reverse space-x-3 w-full">
                      <img 
                        src={message.user_avatar} 
                        alt={message.user_name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="bg-green-500 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                        <p className="break-words">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 text-xs text-green-100 mt-1">
                          <span>{getReadText(message)}</span>
                          {renderReadStatus(message)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 他人消息 - 显示关系称谓
                    <div className="flex items-start space-x-3 max-w-[70%]">
                      <img 
                        src={message.user_avatar} 
                        alt={message.user_name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="font-semibold text-gray-900 mb-1">{message.user_name}</div>
                        <p className="text-gray-800 break-words">{message.content}</p>
                        <div className="text-left text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
            {typingUser && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm px-4 py-2">
                <span>{typingUser} 正在输入...</span>
                <span className="animate-pulse">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 发送框 */}
          <div className="px-4 py-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="输入消息..."
              />
              <button
                type="submit"
                disabled={!connected || !newMessage.trim()}
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                {t('send')}
              </button>
            </form>
          </div>
        </div>

        {/* 在线用户列表 */}
        <div className="lg:block hidden bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-family-500" />
              <h3 className="font-bold text-gray-900">
                在線成员 ({onlineCount})
              </h3>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100%-60px)]">
            {onlineUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>暂无在线成员</p>
                <p className="text-sm">快来第一个加入聊天吧！</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {onlineUsers.map((onlineUser) => (
                  <div key={onlineUser.userId} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50">
                    <img 
                      src={onlineUser.avatar} 
                      alt={onlineUser.userName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {onlineUser.userName}
                        {onlineUser.userId === user?.id && (
                          <span className="text-xs text-gray-500 ml-1">(你)</span>
                        )}
                      </p>
                      <div className="flex items-center text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        在线
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加载中...</p>
    </div>}>
      <ChatContent />
    </Suspense>
  );
}
