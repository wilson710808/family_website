# 成長專欄 - AI書籍導讀插件

## 功能介紹

提供 AI 智能書籍導讀功能。

- 🔍 **智能搜索** - 輸入書名，AI 自動生成完整導讀
- 📖 **完整導讀** - 包含簡介、核心觀點、讀後啟發、金句
- ❤️ **收藏功能** - 喜歡的導讀一鍵收藏
- 📚 **閱讀歷史** - 自動記錄瀏覽過的書籍
- 🎙️ **語音朗讀** - 支持文字轉語音（需要 API 配置）
- 📱 **手機優先** - 專為手機設計的極簡界面
- 🎲 **AI推薦** - 點擊按鈕隨機推薦熱門書單，保證30次不重複
- 📅 **每日推薦** - 基於日期自動每日更換推薦書籍

## 環境變量控制

```bash
# 默認啟用
# 禁用方式（在 .env.local 中添加：
PLUGIN_GROWTH_COLUMN=false
# 或者
DISABLE_PLUGIN_GROWTH_COLUMN=true
```

## API 配置

需要在環境變量中配置 OpenAI API（兼容 NVIDIA NIM）：

```bash
# OpenAI API Key（必需）
OPENAI_API_KEY=your-api-key
# API 端點（可選，默認使用 OpenAI，可配置 NVIDIA NIM）
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
# 模型（可選，推薦使用較小模型獲得更快速度）
OPENAI_MODEL=meta/llama-3.1-8b-instruct
# ElevenLabs TTS（可選，更自然的語音）
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

## 訪問地址

`/plugins/growth-column?familyId={家族ID}`

## 數據庫

- `plugin_growth_book_history` - 用戶閱讀歷史
- `plugin_growth_book_favorites` - 收藏
- `plugin_growth_book_recommendations` - 推薦書單

## 卸載

禁用後，數據庫表會保留但不會被訪問。如果確定不需要了，可以手動刪除這三個表。
