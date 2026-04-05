# 家族网站插件说明

本网站采用**可插拔插件架构**，所有插件可以通过环境变量独立控制启用/禁用，轻松禁用不需要的功能。

## 已安装插件

### 1. 生日/纪念日提醒 (`birthday-reminder`)

**功能：**
- 支持生日、结婚纪念日、自定义提醒
- 每年自动提醒，可设置提前几天提醒
- 首页仪表板展示即将到来的提醒
- 独立管理页面添加/编辑/删除

**环境变量控制：**
```bash
# 默认启用
# 禁用方式：
PLUGIN_BIRTHDAY_REMINDER=false
# 或者
DISABLE_PLUGIN_BIRTHDAY=true
```

**访问地址：** `/plugins/birthday?familyId={家族ID}`

**数据库：** 独立表 `plugin_birthday_reminders`, `plugin_birthday_settings`，禁用后可直接删除表。

---

### 2. 家族相册 (`family-album`)

**功能：**
- 创建多个相册分类
- 照片上传、存储、展示
- 点赞和评论互动
- 首页展示最新照片

**环境变量控制：**
```bash
# 默认启用
# 禁用方式：
PLUGIN_FAMILY_ALBUM=false
# 或者
DISABLE_PLUGIN_FAMILY_ALBUM=true
```

**访问地址：** `/plugins/album?familyId={家族ID}`

**数据库：** 独立表 `plugin_album_albums`, `plugin_album_photos`, `plugin_album_likes`, `plugin_album_comments`，禁用后可直接删除表。

---

## 添加新插件开发指南

遵循可插拔设计原则：

1. **目录结构：**
   ```
   plugins/
     plugin-name/
       index.ts        # 插件逻辑入口
       schema.sql      # 数据库结构（如果需要）
       README.md       # 插件说明（可选）
   ```

2. **API 路由：**
   ```
   app/api/plugins/{plugin-name}/{endpoint}/route.ts
   ```
   在每个路由入口先检查 `isEnabled()`，禁用返回 404 即可。

3. **页面：**
   ```
   app/plugins/{plugin-name}/page.tsx
   ```

4. **必须实现：**
   - `isEnabled()` 函数 - 读取环境变量判断是否启用
   - `initDatabase()` 函数 - 自动初始化数据库表（不存在时创建）
   - 所有数据表使用 `plugin_` 前缀，独立于核心表

5. **首页组件（可选）：**
   ```
   components/plugins/{WidgetName}.tsx
   ```
   组件内部判断插件是否启用，禁用或无数据时返回 `null` 不占位。

这样用户不需要修改核心代码，只需要改环境变量就能启用/禁用功能，真·插拔！

## 如何禁用插件

不需要删除代码，只需要在环境变量中设置：
```bash
# .env.local 文件
PLUGIN_BIRTHDAY_REMINDER=false
PLUGIN_FAMILY_ALBUM=false
```

重启服务即可生效，数据表会保留但不会被访问。如果确定不需要了，可以手动删除对应的表。
