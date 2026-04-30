'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import { Send, Users, MessageSquare, Clock, Bot, Check, CheckCheck, Image, Smile, X } from 'lucide-react';

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
  message_type?: 'text' | 'image' | 'sticker';
  metadata?: string;
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

// 可爱表情贴图集合
const STICKERS = [
  { id: 'heart', emoji: '❤️', label: '愛心' },
  { id: 'sparkle', emoji: '✨', label: '閃亮' },
  { id: 'fire', emoji: '🔥', label: '火熱' },
  { id: 'star', emoji: '⭐', label: '星星' },
  { id: 'cake', emoji: '🎂', label: '生日蛋糕' },
  { id: 'party', emoji: '🎉', label: '派對' },
  { id: 'clap', emoji: '👏', label: '鼓掌' },
  { id: 'rose', emoji: '🌹', label: '玫瑰花' },
  { id: 'sun', emoji: '☀️', label: '太陽' },
  { id: 'rainbow', emoji: '🌈', label: '彩虹' },
  { id: 'butterfly', emoji: '🦋', label: '蝴蝶' },
  { id: 'cat', emoji: '🐱', label: '小貓' },
  { id: 'dog', emoji: '🐶', label: '小狗' },
  { id: 'panda', emoji: '🐼', label: '熊貓' },
  { id: 'bunny', emoji: '🐰', label: '小兔子' },
  { id: 'teddy', emoji: '🧸', label: '泰迪熊' },
  { id: 'gift', emoji: '🎁', label: '禮物' },
  { id: 'balloon', emoji: '🎈', label: '氣球' },
  { id: 'flower', emoji: '🌸', label: '櫻花' },
  { id: 'crown', emoji: '👑', label: '皇冠' },
  { id: 'medal', emoji: '🏅', label: '獎牌' },
  { id: 'trophy', emoji: '🏆', label: '獎盃' },
  { id: 'pizza', emoji: '🍕', label: '披薩' },
  { id: 'icecream', emoji: '🍦', label: '冰淇淋' },
  { id: 'coffee', emoji: '☕', label: '咖啡' },
  { id: 'music', emoji: '🎵', label: '音樂' },
  { id: 'guitar', emoji: '🎸', label: '吉他' },
  { id: 'camera', emoji: '📷', label: '相機' },
  { id: 'book', emoji: '📖', label: '書本' },
  { id: 'love', emoji: '💕', label: '雙心' },
  { id: 'kiss', emoji: '💋', label: '親親' },
  { id: 'hug', emoji: '🤗', label: '擁抱' },
  { id: 'wave', emoji: '👋', label: '打招呼' },
  { id: 'ok', emoji: '👌', label: 'OK' },
  { id: 'thumbsup', emoji: '👍', label: '讚' },
  { id: 'strong', emoji: '💪', label: '加油' },
  { id: 'think', emoji: '🤔', label: '思考' },
  { id: 'laugh', emoji: '😂', label: '大笑' },
  { id: 'happy', emoji: '😊', label: '開心' },
  { id: 'cool', emoji: '😎', label: '酷' },
];

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
  const [showStickers, setShowStickers] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        body: JSON.stringify({ messageId, familyId: Number(familyId), userId: user.id }),
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有未读消息为已读
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
      .then(async data => {
        if (data.user) {
          setUser(data.user);
          if (!familyId) {
            const res = await fetch('/api/families');
            const familiesData = await res.json();
            if (familiesData.families && familiesData.families.length === 1) {
              const singleFamily = familiesData.families[0];
              router.replace(`/chat?familyId=${singleFamily.id}`);
            }
          }
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
      });
  }, [familyId, router]);

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

  // 初始化 Socket.IO
  useEffect(() => {
    if (!familyId || !user) return;

    const socketUrl = window.location.origin;
    socket = io(socketUrl, { path: '/ws/01-family-portal/socket.io/', reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 10 });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
      socket?.emit('join-family', { familyId: Number(familyId), userId: user.id, userName: user.name, avatar: user.avatar });

      if (!hasGreetedToday()) {
        fetch('/api/plugins/butler/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyId: Number(familyId), userName: user.name }),
        }).catch(err => console.error('管家打招呼失败:', err));
        markGreetedToday();
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socket.on('chat-message', (message) => {
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
          message_type: message.messageType || 'text',
          read_count: 1,
        };
        setMessages(prev => [...prev, formattedMessage]);
      }
    });

    socket.on('online-users', (data) => {
      setOnlineUsers(data.users);
      setOnlineCount(data.count);
    });

    socket.on('typing', (data) => {
      setTypingUser(data.userName);
      setTimeout(() => setTypingUser(null), 2000);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [familyId, user]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => markAllMessagesAsRead(), 1000);
    }
  }, [loading, messages]);

  useEffect(() => {
    const handleFocus = () => markAllMessagesAsRead();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [messages]);

  // 发送文本消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !familyId || !user || !socket) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: Number(familyId), content }),
      });
      const data = await res.json();
      if (data.success) {
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

  // 发送表情贴图
  const handleSendSticker = async (sticker: typeof STICKERS[0]) => {
    if (!familyId || !user || !socket) return;
    setShowStickers(false);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          familyId: Number(familyId), 
          content: sticker.emoji,
          messageType: 'sticker'
        }),
      });
      const data = await res.json();
      if (data.success) {
        socket.emit('chat-message', {
          familyId: Number(familyId),
          userId: user.id,
          userName: user.name,
          avatar: user.avatar,
          content: sticker.emoji,
          messageId: data.message.id,
          createdAt: data.message.created_at,
          messageType: 'sticker',
        });
      }
    } catch (error) {
      console.error('发送表情失败:', error);
    }
  };

  // 选择图片文件
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('僅支持 JPG、PNG、GIF、WebP 格式的圖片');
      return;
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB');
      return;
    }

    setSelectedFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setShowImageUpload(true);
    };
    reader.readAsDataURL(file);
  };

  // 上传并发送图片
  const handleUploadImage = async () => {
    if (!selectedFile || !familyId || !user || !socket) return;
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('familyId', String(familyId));

      const res = await fetch('/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        socket.emit('chat-message', {
          familyId: Number(familyId),
          userId: user.id,
          userName: user.name,
          avatar: user.avatar,
          content: data.message.content,
          messageId: data.message.id,
          createdAt: data.message.created_at,
          messageType: 'image',
        });

        // 重置状态
        setShowImageUpload(false);
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(data.error || '上傳失敗');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上傳失敗，請重試');
    } finally {
      setUploadingImage(false);
    }
  };

  // 取消图片上传
  const cancelImageUpload = () => {
    setShowImageUpload(false);
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && familyId && user && newMessage.length === 0) {
      socket.emit('typing', { familyId: Number(familyId), userName: user.name });
    }
  };

  // 渲染消息内容
  const renderMessageContent = (message: ChatMessage) => {
    const msgType = message.message_type || 'text';

    if (msgType === 'image') {
      return (
        <div className="relative">
          <img 
            src={message.content} 
            alt="聊天圖片" 
            className="max-w-[280px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.content, '_blank')}
          />
        </div>
      );
    }

    if (msgType === 'sticker') {
      return (
        <span className="text-5xl leading-none">{message.content}</span>
      );
    }

    return <p className="break-words">{message.content}</p>;
  };

  // 渲染已读状态
  const renderReadStatus = (message: ChatMessage) => {
    if (message.user_id !== user?.id) return null;
    const readCount = message.read_count || 0;
    const unreadCount = totalMembers > 0 ? totalMembers - 1 - readCount : 0;

    if (readCount === 0) {
      return <Check className="w-3 h-3 text-gray-300" />;
    } else if (unreadCount > 0) {
      return <CheckCheck className="w-3 h-3 text-yellow-400" />;
    } else {
      return <CheckCheck className="w-3 h-3 text-green-500 fill-green-500" />;
    }
  };

  const getReadText = (message: ChatMessage) => {
    const readCount = message.read_count || 0;
    const total = totalMembers > 0 ? totalMembers - 1 : 0;
    if (readCount === 0) return '沒有人已讀';
    if (readCount === total) return '全部已讀';
    return `${readCount}/${total} 已讀`;
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請選擇家族</h2>
            <p className="text-gray-500 mb-6">請從家族頁面進入聊天室</p>
            <a href="/families" className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
              前往家族頁面
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
        <p className="text-xl text-gray-500 ml-4">加載中...</p>
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
                  已連接
                </span>
              ) : (
                <span className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  連接中...
                </span>
              )}
            </div>
            {totalMembers > 0 && (
              <span className="text-sm text-gray-500">{totalMembers} 位成員</span>
            )}
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={markAllMessagesAsRead}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">還沒有消息，快來發送第一條消息吧！</p>
              </div>
            ) : (
              messages.map((message) => (
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
                      <img src={message.user_avatar} alt={message.user_name} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className={`rounded-2xl px-4 py-3 max-w-[70%] ${message.message_type === 'sticker' ? 'bg-transparent' : 'bg-green-500 text-white'}`}>
                        {renderMessageContent(message)}
                        {message.message_type !== 'sticker' && message.message_type !== 'image' && (
                          <div className="flex items-center justify-end space-x-1 text-xs text-green-100 mt-1">
                            <span>{getReadText(message)}</span>
                            {renderReadStatus(message)}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // 他人消息
                    <div className="flex items-start space-x-3 max-w-[70%]">
                      <img src={message.user_avatar} alt={message.user_name} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className={`rounded-2xl px-4 py-3 ${message.message_type === 'sticker' ? 'bg-transparent' : 'bg-gray-100 rounded-tl-none'}`}>
                        <div className="font-semibold text-gray-900 mb-1">{message.user_name}</div>
                        {renderMessageContent(message)}
                        {message.message_type !== 'sticker' && message.message_type !== 'image' && (
                          <div className="text-left text-xs text-gray-500 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {typingUser && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm px-4 py-2">
                <span>{typingUser} 正在輸入...</span>
                <span className="animate-pulse">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 表情选择器 */}
          {showStickers && (
            <div className="absolute bottom-24 left-4 right-4 lg:left-auto lg:right-auto lg:w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">選擇表情</h3>
                <button onClick={() => setShowStickers(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleSendSticker(sticker)}
                    className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    title={sticker.label}
                  >
                    {sticker.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 图片预览弹窗 */}
          {showImageUpload && imagePreview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">發送圖片</h3>
                  <button onClick={cancelImageUpload} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <img src={imagePreview} alt="預覽" className="w-full max-h-[300px] object-contain rounded-lg" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={cancelImageUpload}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={uploadingImage}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUploadImage}
                    disabled={uploadingImage}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                  >
                    {uploadingImage ? '發送中...' : '發送'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 发送框 */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {/* 图片上传按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                title="發送圖片"
              >
                <Image className="h-5 w-5" />
              </button>

              {/* 表情按钮 */}
              <button
                type="button"
                onClick={() => setShowStickers(!showStickers)}
                className={`p-3 rounded-full transition-colors ${showStickers ? 'text-yellow-500 bg-yellow-50' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50'}`}
                title="發送表情"
              >
                <Smile className="h-5 w-5" />
              </button>

              {/* 输入框 */}
              <form onSubmit={handleSendMessage} className="flex-1 flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="輸入消息..."
                />
                <button
                  type="submit"
                  disabled={!connected || !newMessage.trim()}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <Send className="h-5 w-5 mr-2" />
                  發送
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 在线用户列表 */}
        <div className="lg:block hidden bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <h3 className="font-bold text-gray-900">在線成員 ({onlineCount})</h3>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100%-60px)]">
            {onlineUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>暫無在線成員</p>
                <p className="text-sm">快來第一個加入聊天吧！</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {onlineUsers.map((onlineUser) => (
                  <div key={onlineUser.userId} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50">
                    <img src={onlineUser.avatar} alt={onlineUser.userName} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {onlineUser.userName}
                        {onlineUser.userId === user?.id && (
                          <span className="text-xs text-gray-500 ml-1">(你)</span>
                        )}
                      </p>
                      <div className="flex items-center text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        在線
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">加載中...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
