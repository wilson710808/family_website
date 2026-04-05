# 家族管家插件 - 部署说明

## 功能概述

AI 智能家族管家，具备上下文理解和家族记忆能力。

### 核心能力
- **上下文理解**：理解最近 30 条聊天记录，不重复回答
- **家族记忆**：记住家族的重要信息（生日、偏好等）
- **智能触发**：@管家/问候/问题/感谢/情绪时自动回应
- **冲突化解**：检测到攻击性语言时自动发送安抚消息

### 触发类型
| 类型 | 触发词 | 回复风格 |
|------|--------|----------|
| mention | @管家、小幫手 | 认真回答问题 |
| greeting | 早安、午安、晚安 | 温暖问候 |
| question | 怎麼辦、你覺得、建議 | 提供建议 |
| thanks | 謝謝、感謝 | 礼貌回应 |
| emotion | 好累、好煩、無聊 | 情感支持 |
| conflict | 滾、閉嘴、白癡 | 安抚化解 |

## 部署配置

### 1. 环境变量 (.env)

```bash
# AI API (必需)
BUTLER_API_KEY=nvapi-your-nvidia-api-key
BUTLER_BASE_URL=https://integrate.api.nvidia.com/v1
BUTLER_MODEL=meta/llama-3.1-8b-instruct

# 插件开关（默认启用）
PLUGIN_FAMILY_BUTLER=true
```

### 2. 插件文件

```
plugins/family-butler/
├── config.json      # 配置（触发词、模型参数）
├── schema.sql       # 数据库表
├── prompts.ts       # AI 人设
├── butler.ts        # 核心逻辑
└── index.ts        # 插件入口
```

### 3. 数据库表

```sql
-- 家族管家记忆
CREATE TABLE plugin_butler_memories (
  id INTEGER PRIMARY KEY,
  family_id INTEGER NOT NULL,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME
);

-- 管家回复记录
CREATE TABLE plugin_butler_replies (
  id INTEGER PRIMARY KEY,
  family_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  trigger_type TEXT,
  created_at DATETIME
);
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/plugins/butler/reply` | POST | 手动触发管家回复 |
| `/api/plugins/butler/memories` | GET | 获取家族记忆 |
| `/api/plugins/butler/memories` | POST | 添加家族记忆 |
| `/api/plugins/butler/memories` | DELETE | 删除记忆 |

## 禁用插件

```bash
PLUGIN_FAMILY_BUTLER=false
```

然后重启服务即可。
