# 🔍 Family Portal 全面代碼審查報告 V3

**審查日期**: 2026-04-27  
**項目版本**: 最新 commit `3ba5bb3`  
**數據庫**: family.db (675KB, integrity: OK)  
**數據量**: 227 條聊天消息 / 2 用戶 / 1 家族 / 0 通知  

---

## 🔴 嚴重問題（必須修復）

### 1. 🔴 API Key 洩漏 — `/api/debug/env` 暴露密鑰前綴+後綴

**文件**: `app/api/debug/env/route.ts`

```ts
apiKeyPrefix: process.env.OPENAI_API_KEY
  ? process.env.OPENAI_API_KEY.slice(0, 20) + '...' + process.env.OPENAI_API_KEY.slice(-5)
  : null,
```

**風險**: 暴露 API Key 的前 20 字元和後 5 字元，攻擊者可用於推測完整 Key。此 API 無需認證即可訪問。  
**修復**: 移除此 API 或改為只返回布爾值 `hasApiKey: true/false`。

---

### 2. 🔴 Admin API 完全移除認證檢查 — 任何人可刪除用戶/家族

**文件**:
- `app/api/admin/users/route.ts` → comment: `// 完全移除管理员检查 - 允许所有人访问`
- `app/api/admin/stats/route.ts` → 同上
- `app/api/admin/users/[userId]/delete/route.ts` → `// 完全移除管理员检查 - 允许所有人删除用户`
- `app/api/admin/families/[familyId]/delete/route.ts` → 無認證，任何人可刪除家族

**風險**: 任何未登錄用戶無法調用（有 `getCurrentUser`），但任何已登錄用戶都能：
- 查看所有用戶資料（含登錄次數、最近登錄時間）
- 查看系統全局統計
- **刪除任何用戶**（僅 super admin 不可刪）
- **刪除任何家族**

**修復**: 恢復 `is_admin` 權限檢查，所有 admin API 必須驗證 `user.is_admin === 1`。

---

### 3. 🔴 通知 API 完全無認證 — 僅靠 query param userId

**文件**:
- `app/api/notifications/route.ts` (GET/POST)
- `app/api/notifications/read/route.ts` (POST/DELETE)

**問題**: 所有操作僅通過 `userId` query param 或 body 參數，未驗證當前登錄用戶。攻擊者可：
- 讀取任何用戶的通知
- 標記任何用戶的通知為已讀
- 刪除任何用戶的通知
- 偽造通知推送給任何用戶

**修復**: 所有通知操作需通過 `getCurrentUser()` 驗證，並確保操作對象是本人。

---

### 4. 🔴 管家提醒/公告 API 無認證

**文件**:
- `app/api/plugins/family-butler/reminders/route.ts` (GET/POST)
- `app/api/plugins/family-butler/announcements/route.ts` (GET/POST)
- `app/api/plugins/family-butler/detection/route.ts` (POST)

**問題**: 任何人可創建提醒、公告，調用 AI 檢測，消耗 API 額度。  
**修復**: 加入 `getCurrentUser()` 認證 + 家族成員資格驗證。

---

### 5. 🔴 文檔庫 API 無認證 + 文件刪除無權限檢查

**文件**:
- `app/api/plugins/documents/route.ts` (GET/POST/DELETE)
- `app/api/plugins/documents/upload/route.ts` (POST)

**問題**: 任何人可創建文件夾、上傳文件、遞歸刪除文件夾及所有文件。  
**修復**: 加入用戶認證 + 家族成員驗證 + 刪除操作需確認權限。

---

### 6. 🔴 家族樹 PUT/DELETE 無認證

**文件**: `app/api/plugins/tree/route.ts`

**問題**: 
- `GET` 無認證（任何人都可查看家族樹）
- `PUT` 更新成員無認證
- `DELETE` 刪除成員無認證

**修復**: PUT/DELETE 必須要求 `getCurrentUser()` + 家族成員驗證。

---

### 7. 🔴 統計面板 API 無認證

**文件**: `app/api/plugins/stats/route.ts`

**問題**: 任何人可查看家族活躍度、成員排行、詞雲等數據。  
**修復**: 至少加入家族成員驗證。

---

### 8. 🔴 JWT_SECRET 使用硬編碼預設值

**文件**: `lib/auth.ts:15`, `app/api/auth/login/route.ts:7`

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

**風險**: 如果 `JWT_SECRET` 環境變量未設置，任何人都可以用預設密鑰偽造 JWT token，冒充任何用戶。  
**修復**: 生產環境必須強制設置 `JWT_SECRET`，未設置時拒絕啟動。

---

## 🟠 重要問題（建議修復）

### 9. 🟠 留言板/公告 API 缺少家族數據隔離

**文件**: `app/api/messages/route.ts`, `app/api/announcements/route.ts`

**問題**: 當不帶 `familyId` 參數時，返回**所有家族**的留言/公告，已登錄用戶可查看非自己家族的數據。  
**修復**: 強制要求 `familyId` 參數 + 驗證用戶是否屬於該家族。

---

### 10. 🟠 文檔庫文件刪除 — 物理文件路徑不匹配

**文件**: `plugins/document-library/index.ts:deleteFile()`

```ts
if (fs.existsSync(file.file_path)) {
  fs.unlinkSync(file.file_path);
}
```

**問題**: `file_path` 存儲的是 `/uploads/documents/1/xxx.pdf`（相對 URL 路徑），但 `fs.existsSync` 需要絕對路徑（如 `/root/.../uploads/documents/1/xxx.pdf`）。文件永遠無法被物理刪除，只刪了數據庫記錄。  
**修復**: 刪除時拼接 `process.cwd()` + `file_path`。

---

### 11. 🟠 聊天室管家雙重 AI 觸發邏輯衝突

**文件**: `lib/socket.ts` (socket 事件) vs `app/api/chat/send/route.ts` (HTTP API)

**問題**: 聊天消息有兩條 AI 觸發路徑：
1. Socket.IO `chat-message` 事件 → `socket.ts` 中的管家回覆邏輯
2. HTTP `/api/chat/send` → `triggerButlerReply()` 函數

兩條路徑使用不同的 AI 調用方式（`ai-service.ts` vs `butler.ts`），可能導致：
- 同一條消息管家回覆兩次
- 回覆風格不一致（一個用 `ai-service.ts` 的 `generateButlerReply`，一個用 `butler.ts` 的 `generateReply`）

**修復**: 統一為單一觸發路徑。建議 HTTP API 負責消息持久化 + 觸發 AI，Socket 只負責實時廣播。

---

### 12. 🟠 日曆事件 PUT/DELETE 無認證

**文件**: `app/api/plugins/calendar/route.ts`

**問題**: 
- `PUT` 更新事件無認證，任何人可修改
- `DELETE` 刪除事件無認證，任何人可刪除
- `GET` 無認證，任何人可查看

**修復**: PUT/DELETE 加入 `getCurrentUser()` + 家族成員驗證。

---

### 13. 🟠 相冊 DELETE 操作無認證

**文件**: `app/api/plugins/album/albums/route.ts`

**問題**: `DELETE` 操作未驗證用戶身份，任何人可刪除相冊。  
**修復**: 加入 `getCurrentUser()` 驗證。

---

### 14. 🟠 成長專欄 guide API — guide/route.ts 獨立創建 db 連接

**文件**: `app/api/plugins/growth-column/guide/route.ts`

```ts
const db = new Database(dbPath);
// ... 後面 db.close()
```

**問題**: 在已有全局 `db` 連接的情況下，每個請求都新建一個 SQLite 連接，且在 try-catch 的某個分支中 `db.close()` 可能不被執行（若 `existingFavorite` 分支拋錯，db 未 close）。  
**修復**: 使用全局 `db` 連接，或確保所有路徑都有 `db.close()`（用 `finally`）。

---

### 15. 🟠 刪除家族/用戶 API — 獨立創建 db 連接 + 無事務保護

**文件**:
- `app/api/families/[familyId]/delete/route.ts`
- `app/api/admin/families/[familyId]/delete/route.ts`
- `app/api/admin/users/[userId]/delete/route.ts`

**問題**: 
1. 所有刪除 API 都新建 `Database` 連接，與全局 `db` 衝突
2. 多表刪除操作沒有事務包裹，可能刪到一半失敗導致數據不一致
3. Admin 版本和用戶版本的家族刪除邏輯重複但不完全一致

**修復**: 使用全局 `db` + 事務 (`db.transaction()`) 確保原子性。

---

### 16. 🟠 節日列表不完整

**文件**: `plugins/family-butler/index.ts:isTodayHoliday()`

**問題**: 只有 5 個固定節日（元旦、情人節、勞動節、國慶、聖誕），缺少重要華人節日（春節、中秋、端午、重陽等），且不處理農曆節日。  
**修復**: 加入更多華人節日 + 考慮引入農曆轉換庫。

---

### 17. 🟠 管家歡迎消息 — LIKE 查詢效率 + 無限增長風險

**文件**: `lib/socket.ts:welcomeNewMember()`

**問題**: 
1. 使用 `content LIKE '%用戶名%'` 全表掃描，消息量大時性能差
2. 歡迎快取 `_welcomeCache` 使用 Set 存在內存中，永不清理
3. 歡迎快取的 key 用 `toDateString()` 但未考慮跨日重置

**修復**: 
- 為 messages 表 content 添加全文索引或限制掃描範圍
- 定期清理 `_welcomeCache` 或改用 LRU
- 用日期字符串做 key，每日自動過期

---

## 🟡 一般問題（建議改進）

### 18. 🟡 註冊 API 無速率限制

**文件**: `app/api/auth/register/route.ts`

**問題**: 無速率限制和驗證碼，容易被惡意批量註冊。  
**修復**: 加入速率限制（如 IP 限制 5 次/小時）和 CAPTCHA。

---

### 19. 🟡 密碼強度要求過低

**文件**: `app/api/auth/register/route.ts`

**問題**: 僅要求密碼長度 ≥ 6，無大小寫/數字/特殊字符要求。  
**修復**: 至少要求 ≥ 8 位，包含數字和字母。

---

### 20. 🟡 Default Admin 密碼硬編碼

**文件**: `lib/auth.ts:initDefaultUser()`

```ts
const hashedPassword = bcrypt.hashSync('admin123456', 10);
```

**問題**: 默認管理員密碼硬編碼為 `admin123456`，且在非生產環境自動創建。  
**修復**: 生產環境不應自動創建默認用戶；密碼應從環境變量讀取。

---

### 21. 🟡 聊天歷史硬編碼 500 條上限

**文件**: `app/api/chat/route.ts`

```sql
ORDER BY cm.created_at ASC LIMIT 500
```

**問題**: 聊天歷史最多只返回 500 條，不支援分頁/加載更多。  
**修復**: 改為分頁查詢，支援 `before` / `after` 游標。

---

### 22. 🟡 CORS 設置過於寬鬆

**文件**: `lib/socket.ts`

```ts
cors: { origin: '*', methods: ['GET', 'POST'] }
```

**問題**: 允許任何域名連接 Socket.IO。  
**修復**: 限制為項目域名。

---

### 23. 🟡 document-library deleteFile 物理路徑問題（重複 #10）

**文件**: `app/api/plugins/documents/route.ts` DELETE handler

```ts
const fs = require('fs');
if (fs.existsSync(fileInfo.file_path)) {
  fs.unlinkSync(fileInfo.file_path);
}
```

同 #10 問題，`file_path` 是 URL 路徑而非物理路徑。

---

### 24. 🟡 上傳文件無文件類型白名單驗證（文檔庫）

**文件**: `app/api/plugins/documents/upload/route.ts`

**問題**: 文檔庫上傳無文件類型限制，可上傳任何文件（含 .exe, .sh 等）。  
**修復**: 添加文件類型白名單。

---

### 25. 🟡 上傳 API 使用同步 fs 操作

**文件**: `app/api/plugins/documents/upload/route.ts`

```ts
fs.mkdirSync(uploadDir, { recursive: true });
fs.writeFileSync(filePath, buffer);
```

**問題**: 在 Next.js API route 中使用同步 fs 操作會阻塞事件循環。  
**修復**: 改用 `fs/promises` 的 `mkdir` / `writeFile`。

---

### 26. 🟡 管家每日摘要生成時機問題

**文件**: `lib/socket.ts:checkScheduledNotifications()`

**問題**: 每日摘要只在凌晨 2 點且「有在線用戶的家族」才生成。如果無人在線，就永遠不會生成摘要。  
**修復**: 改用定時腳本（cron job）而非依賴在線用戶。

---

### 27. 🟡 birthday_reminders 表名不一致

**文件**: `app/api/families/[familyId]/delete/route.ts`

```ts
db.prepare(`DELETE FROM birthday_reminders WHERE family_id = ?`).run(familyIdNum);
```

**問題**: 實際表名是 `plugin_birthday_reminders`，這條 DELETE 會報錯（被 try-catch 吞掉了）。  
**修復**: 改為 `DELETE FROM plugin_birthday_reminders`。

---

### 28. 🟡 .env.local 中 API Key 明文存儲

**文件**: `.env.local`

**問題**: NVIDIA API Key 和 ElevenLabs API Key 明文存儲。雖然 `.env.local` 在 `.gitignore` 中，但仍是安全風險。  
**修復**: 考慮使用密鑰管理服務或加密存儲。

---

### 29. 🟡 成長專欄 JSON 解析極度複雜

**文件**: `app/api/plugins/growth-column/guide/route.ts`

**問題**: 4 級 JSON 修復邏輯（repair → auto-close → position fix → heuristic extraction），代碼量約 150 行，可維護性差。  
**修復**: 改用 NVIDIA API 的 `response_format: { type: 'json_object' }` 強制 JSON 輸出（已使用但似乎效果不佳），或換用更可靠的模型。

---

### 30. 🟡 Socket.IO 在線用戶管理使用 Map — 重啟丟失

**文件**: `lib/socket.ts`

**問題**: `onlineUsers` Map 存在內存中，服務重啟後全部丟失。  
**修復**: 可接受（重啟後用戶重新連接即可），但需注意 `cleanupInactiveUsers` 的 10 分鐘超時可能過於激進。

---

## ✅ 做得好的地方

1. **路徑遍歷防護** — uploads API 有 `path.normalize` + `startsWith` 檢查 ✅
2. **密碼加密** — 使用 bcryptjs + SALT_ROUNDS=10 ✅
3. **JWT 認證** — 基本架構正確，httpOnly + sameSite=lax ✅
4. **插件可插拔設計** — 環境變量控制啟用/禁用，架構清晰 ✅
5. **數據庫索引** — 已為常用查詢添加索引 ✅
6. **XSS 防護** — Next.js 默認轉義，聊天消息未使用 dangerouslySetInnerHTML ✅
7. **上傳文件大小限制** — 聊天 5MB / 相冊 10MB / 類型白名單 ✅
8. **家族退出邏輯** — 權限檢查完整，管理員自動轉讓邏輯合理 ✅
9. **家族數據導出** — 有成員資格驗證，數據完整 ✅

---

## 📋 修復優先級排序

| 優先級 | 問題編號 | 描述 | 預估工時 |
|--------|---------|------|---------|
| P0-立即 | #1 | debug/env 暴露 API Key | 10min |
| P0-立即 | #2 | Admin API 無認證 | 30min |
| P0-立即 | #3 | 通知 API 無認證 | 20min |
| P0-立即 | #8 | JWT_SECRET 硬編碼 | 15min |
| P1-本週 | #4 | 管家提醒/公告 API 無認證 | 20min |
| P1-本週 | #5 | 文檔庫 API 無認證 | 20min |
| P1-本週 | #6 | 家族樹 PUT/DELETE 無認證 | 15min |
| P1-本週 | #7 | 統計面板 API 無認證 | 10min |
| P1-本週 | #12 | 日曆 PUT/DELETE 無認證 | 15min |
| P1-本週 | #13 | 相冊 DELETE 無認證 | 10min |
| P2-本月 | #10/#23 | 文檔庫物理路徑不匹配 | 20min |
| P2-本月 | #11 | 管家雙重 AI 觸發 | 1hr |
| P2-本月 | #15 | 刪除 API 事務保護 | 1hr |
| P2-本月 | #9 | 數據隔離 | 30min |
| P2-本月 | #27 | birthday_reminders 表名錯誤 | 5min |
| P3-擇期 | #16-30 | 其他改進項 | 3-4hr |

---

**總計**: 🔴 8 個嚴重問題 / 🟠 9 個重要問題 / 🟡 13 個一般問題
