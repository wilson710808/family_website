# FamilyWebsite 开发状态

## 最近更新 (2026-04-06)

### 已完成
- ✅ AI 家族管家插件 (上下文理解 + 家族记忆)
  - 触发检测 7 种场景
  - NVIDIA NIM API 集成
  - 家族独立记忆存储
  - 模型升级为 llama-3.3-70b-instruct
  - 上下文消息增加到 15 条
- ✅ **管家专属管理页面** (记忆查看/添加/删除)
- ✅ **管家 AI 打招呼** (每日首次进入)
- ✅ **事件日历插件** (月历、6种事件类型)
- ✅ **家族树插件** (成员 CRUD、树形视图)
  - ✅ **图形化可视化视图** (新增 2026-04-06)
    - SVG 绘制的家族树结构图
    - 支持拖曳和缩放
    - 配偶关系粉色虚线连接
    - 父子关系蓝色实线连接
- ✅ **StockAI 整合** (iframe 嵌入)
- ✅ **用户认证 + 家族数据隔离**
- ✅ **成员退出家族功能**
- ✅ **数据导出功能**

### 正在开发
- 无

### 待开发
- ⏳ 照片上传功能 (album 插件)
- ⏳ 权限系统增强 (更细粒度控制)

## 修改记录

| 日期 | Agent | 修改内容 | Commit |
|------|-------|----------|--------|
| 2026-04-06 | OpenClaw | 家族树图形化可视化视图 | c2e9838 |
| 2026-04-06 | OpenClaw | 更新开发状态 | a033776 |
| 2026-04-06 | OpenClaw | 新增退出家族和数据导出功能 | 9b5d5c2 |
| 2026-04-06 | OpenClaw | 修复认证和中间件问题 | 6ad660f |

## 文件结构

```
family_website/
├── app/
│   ├── api/
│   │   ├── chat/              # 聊天 API
│   │   ├── families/[familyId]/
│   │   │   ├── leave/         # 退出家族 API
│   │   │   └── export/        # 数据导出 API
│   │   └── plugins/
│   │       ├── butler/        # 管家 API
│   │       ├── calendar/      # 日历 API
│   │       ├── tree/          # 家族树 API
│   │       └── stock/         # StockAI 配置
│   └── plugins/
│       ├── butler/            # 管家管理页面
│       ├── calendar/          # 日历页面
│       ├── tree/              # 家族树页面 (支持图形视图)
│       └── stock/             # StockAI 页面
├── components/
│   ├── LeaveFamilyButton.tsx  # 退出家族按钮
│   ├── ExportDataButton.tsx   # 数据导出按钮
│   └── FamilyTreeGraph.tsx    # 家族树图形化组件 (新增)
├── plugins/
│   ├── birthday-reminder/     # 生日提醒
│   ├── family-album/          # 家族相册
│   ├── growth-column/         # 成长专栏
│   ├── message-board/         # 留言板
│   ├── family-butler/         # AI 管家核心
│   ├── event-calendar/        # 事件日历
│   ├── family-tree/           # 家族树
│   └── stock-assistant/       # StockAI 整合
└── DEV_STATUS.md              # 本文件
```

## 已知问题

| 问题 | 状态 | 说明 |
|------|------|------|
| 照片上传 | ⏳ | album 插件 TODO |
