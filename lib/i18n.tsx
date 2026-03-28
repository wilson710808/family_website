'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh-CN' | 'zh-TW';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  'zh-CN': {
    // Navigation
    'home': '首页',
    'family': '家族',
    'announcements': '公告栏',
    'messages': '留言板',
    'chat': '即时聊天',
    'system_admin': '系统管理',
    'logout': '退出登录',
    'welcome_back': '欢迎回来',
    'family_center': '家族中心',
    
    // Auth
    'login': '登录',
    'register': '注册',
    'email': '邮箱',
    'password': '密码',
    'confirm_password': '确认密码',
    'name': '姓名',
    'avatar': '头像',
    'invitation_code': '家人邀请码',
    'invitation_code_optional': '家人邀请码（选填）',
    'if_family_gave_code': '如果家人给了您邀请码，请填写在这里',
    'invitation_code_helper': '填写后可以直接加入对应家族',
    'remember_me': '记住我',
    'forgot_password': '忘记密码？',
    'no_account_yet': '还没有账号？',
    'have_account_already': '已有账号？',
    'create_account': '创建账号',
    'full_name': '全名',
    'your_full_name': '请输入您的全名',
    'join_family_space': '加入我们，开启家族专属空间',
    'welcome_back_to_family': '欢迎回来，登录您的账号，进入家族空间',
    'loading': '加载中...',
    'login_failed': '登录失败',
    'register_failed': '注册失败',
    'network_error': '网络错误，请重试',
    'password_not_match': '两次输入的密码不一致',
    'password_length_min': '密码长度至少6位',
    'please_fill_all': '请填写完整信息',
    'register_success': '注册成功，正在跳转...',
    'already_have_account': '已有账号？',
    'login_now': '立即登录',
    'register_to_join_family': '注册加入家族空间',
    
    // Demo account
    'demo_account': '📋 测试账号',
    'demo_email': '邮箱: admin@family.com',
    'demo_password': '密码: admin123456',
    
    // Avatar
    'select_your_avatar': '选择您的头像',
    'click_avatar_change': '点击头像可以更换哦',
    'click_select_avatar': '点击选择头像：',
    'close': '关闭',
    
    // Home page
    'welcome_to_family_space': '欢迎来到我们的家族专属空间',
    'connect_family_members': '连接每一位家庭成员，记录生活点滴，分享美好时光，让亲情更近一步',
    'family_group': '家族群组',
    'create_family_group': '创建专属家族群组，邀请亲人加入，所有信息安全隔离，保护家族隐私',
    'announcement_board': '公告栏',
    'publish_family_announcements': '发布家族重要通知，所有人及时知晓，不错过任何重要家庭活动',
    'instant_chat': '即时聊天',
    'real_time_chat': '家族成员实时在线聊天，分享生活，互动交流，让亲情时刻在线',
    'join_family_community': '立即加入我们的家族社区',
    'simple_steps_create_space': '只需简单几步，就能创建属于你们家族的专属空间，记录每一个温馨时刻',
    'free_register': '免费注册',
    'have_account_login': '已有账号，直接登录',
    
    // Dashboard
    'welcome': '你好，',
    'welcome_message': '欢迎回到家族中心，今天有什么新消息？',
    'create_new_family': '创建新家族',
    'view_all_announcements': '查看公告',
    'my_families': '我的家族',
    'pending_invitations': '待处理邀请',
    'total_announcements': '公告总数',
    'total_messages': '留言总数',
    'number_of_members': '位成员',
    'created_at': '创建于',
    'no_families_yet': '还没有加入任何家族',
    'create_first_family': '创建一个新家族，或者邀请家人加入吧',
    'recent_activities': '最新动态',
    'no_activities_yet': '暂无动态',
    'announcement': '公告',
    'message': '留言',
    'by': '发布者',
    
    // Families page
    'my_families_title': '我的家族',
    'pending_invitation': '待处理邀请',
    'pending': '待审核',
    'accept': '接受',
    'reject': '拒绝',
    'enter_family': '进入家族',
    'admin': '管理员',
    'member': '成员',
    
    // Create family
    'create_new_family_title': '创建新家族',
    'family_name': '家族名称',
    'family_name_placeholder': '请输入家族名称，例如：快乐一家人',
    'family_description': '家族描述',
    'family_description_placeholder': '简单介绍一下这个家族吧，例如：我们是一个温暖的大家庭...',
    'creating': '创建中...',
    'create_family_btn': '创建家族',
    'after_create_you_can': '创建家族后您可以：',
    'invite_family_members': '邀请家人加入，共同管理家族空间',
    'publish_announcements': '发布家族公告，通知重要事项',
    'share_life_notes': '使用留言板记录生活点滴',
    'chat_with_family': '和家族成员实时在线聊天',
    
    // Family detail
    'family_members': '家族成员',
    'total_members': '成员总数',
    'latest_announcements': '最新公告',
    'view_all': '查看全部 →',
    'latest_messages': '最新留言',
    'view_all_messages': '查看全部 →',
    'no_announcements': '暂无公告',
    'no_messages': '暂无留言，快来发表第一条留言吧！',
    'family_referral_code': '家族邀请码',
    'copy_referral_code': '把这个码发给家人，他们注册时输入就能加入家族',
    'copy': '复制',
    'copied': '已复制！',
    'start_chat': '开始聊天',
    'view_members': '查看成员列表',
    
    // Announcements
    'publish_announcement': '发布公告',
    'announcement_title': '公告标题',
    'announcement_content': '公告内容',
    'cancel': '取消',
    'publish': '发布公告',
    'no_announcements_yet': '暂无公告',
    
    // Messages
    'leave_a_message': '发表留言',
    'write_your_message': '写下你的留言...',
    'send': '发送',
    'no_messages_yet': '暂无留言，快来发表第一条留言吧！',
    
    // Chat
    'chat_room': '家族聊天室',
    'connected': '已连接',
    'connecting': '连接中...',
    'online_members': '在线成员',
    'no_online_members': '暂无在线成员',
    'be_first_to_chat': '快来第一个加入聊天吧！',
    'butler_welcome': '聊天室管家',
    
    // Footer
    'copyright': '© 2025 家族中心. 用心连接每一个家庭.',
    
    // Buttons
    'ok': '确定',
    'back': '返回',
    
    // Errors
    'error_occurred': '发生错误',
    'please_try_again': '请重试',
    
    // Language switch
    'language': '语言',
    'simplified_chinese': '简体中文',
    'traditional_chinese': '繁體中文',
    'no_description': '暂无描述',
  },
  'zh-TW': {
    // Navigation
    'home': '首頁',
    'family': '家族',
    'announcements': '公告欄',
    'messages': '留言板',
    'chat': '即時聊天',
    'system_admin': '系統管理',
    'logout': '登出',
    'welcome_back': '歡迎回來',
    'family_center': '家族中心',
    
    // Auth
    'login': '登入',
    'register': '註冊',
    'email': '信箱',
    'password': '密碼',
    'confirm_password': '確認密碼',
    'name': '姓名',
    'avatar': '大頭貼',
    'invitation_code': '家人邀請碼',
    'invitation_code_optional': '家人邀請碼（選填）',
    'if_family_gave_code': '如果家人給了你邀請碼，請填寫在這裡',
    'invitation_code_helper': '填寫後可以直接加入對應家族',
    'remember_me': '記住我',
    'forgot_password': '忘記密碼？',
    'no_account_yet': '還沒有帳號？',
    'have_account_already': '已經有帳號？',
    'create_account': '建立帳號',
    'full_name': '全名',
    'your_full_name': '請輸入你的全名',
    'join_family_space': '加入我們，開啟家族專屬空間',
    'welcome_back_to_family': '歡迎回來，登入你的帳號，進入家族空間',
    'loading': '載入中...',
    'login_failed': '登入失敗',
    'register_failed': '註冊失敗',
    'network_error': '網路錯誤，請重試',
    'password_not_match': '兩次輸入的密碼不一致',
    'password_length_min': '密碼長度至少6位',
    'please_fill_all': '請填寫完整資訊',
    'register_success': '註冊成功，正在跳轉...',
    'already_have_account': '已經有帳號？',
    'login_now': '立即登入',
    'register_to_join_family': '註冊加入家族空間',
    
    // Demo account
    'demo_account': '📋 測試帳號',
    'demo_email': '信箱: admin@family.com',
    'demo_password': '密碼: admin123456',
    
    // Avatar
    'select_your_avatar': '選擇你的大頭貼',
    'click_avatar_change': '點擊大頭貼可以更換哦',
    'click_select_avatar': '點擊選擇大頭貼：',
    'close': '關閉',
    
    // Home page
    'welcome_to_family_space': '歡迎來到我們的家族專屬空間',
    'connect_family_members': '連結每一位家庭成員，記錄生活點滴，分享美好時光，讓親情更近一步',
    'family_group': '家族群組',
    'create_family_group': '建立專屬家族群組，邀請親人加入，所有資訊安全隔離，保護家族隱私',
    'announcement_board': '公告欄',
    'publish_family_announcements': '發布家族重要通知，所有人及時知曉，不錯過任何重要家庭活動',
    'instant_chat': '即時聊天',
    'real_time_chat': '家族成員即時線上聊天，分享生活，互動交流，讓親情時常在線',
    'join_family_community': '立即加入我們的家族社區',
    'simple_steps_create_space': '只需簡單幾步，就能建立屬於你們家族的專屬空間，記錄每一個溫馨時刻',
    'free_register': '免費註冊',
    'have_account_login': '已經有帳號，直接登入',
    
    // Dashboard
    'welcome': '你好，',
    'welcome_message': '歡迎回到家族中心，今天有什麼新消息？',
    'create_new_family': '建立新家族',
    'view_all_announcements': '查看公告',
    'my_families': '我的家族',
    'pending_invitations': '待處理邀請',
    'total_announcements': '公告總數',
    'total_messages': '留言總數',
    'number_of_members': '位成員',
    'created_at': '建立於',
    'no_families_yet': '還沒有加入任何家族',
    'create_first_family': '建立一個新家族，或者邀請家人加入吧',
    'recent_activities': '最新動態',
    'no_activities_yet': '暫無動態',
    'announcement': '公告',
    'message': '留言',
    'by': '發布者',
    
    // Families page
    'my_families_title': '我的家族',
    'pending_invitation': '待處理邀請',
    'pending': '待審核',
    'accept': '接受',
    'reject': '拒絕',
    'enter_family': '進入家族',
    'admin': '管理員',
    'member': '成員',
    
    // Create family
    'create_new_family_title': '建立新家族',
    'family_name': '家族名稱',
    'family_name_placeholder': '請輸入家族名稱，例如：快樂一家人',
    'family_description': '家族描述',
    'family_description_placeholder': '簡單介紹一下這個家族吧，例如：我們是一個溫暖的大家庭...',
    'creating': '建立中...',
    'create_family_btn': '建立家族',
    'after_create_you_can': '建立家族後你可以：',
    'invite_family_members': '邀請家人加入，共同管理家族空間',
    'publish_announcements': '發布家族公告，通知重要事項',
    'share_life_notes': '使用留言板記錄生活點滴',
    'chat_with_family': '和家族成員即時線上聊天',
    
    // Family detail
    'family_members': '家族成員',
    'total_members': '成員總數',
    'latest_announcements': '最新公告',
    'view_all': '查看全部 →',
    'latest_messages': '最新留言',
    'view_all_messages': '查看全部 →',
    'no_announcements': '暫無公告',
    'no_messages': '暫無留言，快來發表第一條留言吧！',
    'family_referral_code': '家族邀請碼',
    'copy_referral_code': '把這個碼給家人，他們註冊時輸入就能加入家族',
    'copy': '複製',
    'copied': '已複製！',
    'start_chat': '開始聊天',
    'view_members': '查看成員列表',
    
    // Announcements
    'publish_announcement': '發布公告',
    'announcement_title': '公告標題',
    'announcement_content': '公告內容',
    'cancel': '取消',
    'publish': '發布公告',
    'no_announcements_yet': '暫無公告',
    
    // Messages
    'leave_a_message': '發表留言',
    'write_your_message': '寫下你的留言...',
    'send': '送出',
    'no_messages_yet': '暫無留言，快來發表第一條留言吧！',
    
    // Chat
    'chat_room': '家族聊天室',
    'connected': '已連線',
    'connecting': '連線中...',
    'online_members': '在線成員',
    'no_online_members': '暫無在線成員',
    'be_first_to_chat': '快來第一個加入聊天吧！',
    'butler_welcome': '聊天室管家',
    
    // Footer
    'copyright': '© 2025 家族中心. 用心連結每一個家庭.',
    
    // Buttons
    'ok': '確定',
    'back': '返回',
    
    // Errors
    'error_occurred': '發生錯誤',
    'please_try_again': '請重試',
    
    // Language switch
    'language': '語言',
    'simplified_chinese': '简体中文',
    'traditional_chinese': '繁體中文',
    'no_description': '暂无描述',
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'zh-CN',
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    // 从cookie读取保存的语言，默认繁体中文
    if (typeof window !== 'undefined') {
      const saved = document.cookie.split('; ').find(row => row.startsWith('language='));
      if (saved) {
        const value = saved.split('=')[1];
        if (value === 'zh-CN' || value === 'zh-TW') {
          return value;
        }
      }
    }
    return 'zh-TW';
  });

  useEffect(() => {
    // 保存选择到cookie
    document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key as keyof typeof translations[typeof lang]] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
