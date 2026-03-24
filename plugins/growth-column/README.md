# 成长专栏 - AI书籍导读插件

## 功能介绍

基于 [books_group](https://github.com/wilson710808/books_group) 项目集成，提供 AI 智能书籍导读功能。

- 🔍 **智能搜索** - 输入书名，AI 自动生成完整导读
- 📖 **完整导读** - 包含简介、核心观点、读后启发、金句
- ❤️ **收藏功能** - 喜欢的导读一键收藏
- 📚 **阅读历史** - 自动记录浏览过的书籍
- 🎙️ **语音朗读** - 支持文字转语音（需要 API 配置）
- 📱 **手机优先** - 专为手机设计的极简界面

## 环境变量控制

```bash
# 默认启用
# 禁用方式（在 .env.local 中添加：
PLUGIN_GROWTH_COLUMN=false
# 或者
DISABLE_PLUGIN_GROWTH_COLUMN=true
```

## API 配置

需要在环境变量中配置 OpenAI API：

```bash
# OpenAI API Key（必需）
OPENAI_API_KEY=your-api-key
# API 端点（可选，默认使用 OpenAI，可配置 NVIDIA NIM）
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
# 模型（可选）
OPENAI_MODEL=meta/llama-3.1-405b-instruct
# ElevenLabs TTS（可选，更自然的语音）
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

## 访问地址

`/plugins/growth-column?familyId={家族ID}`

## 数据库

- `plugin_growth_book_history` - 用户阅读历史
- `plugin_growth_book_favorites` - 收藏
- `plugin_growth_book_recommendations` - 推荐书单

## 卸载

禁用后，数据库表会保留但不会被访问。如果确定不需要了，可以手动删除这三个表。
