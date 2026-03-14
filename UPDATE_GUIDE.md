# ✏️ 内容更新指南

## 快速更新（最简单的方式）
直接告诉我你想改什么，我来帮你编辑提交！比如：
- "把首页的欢迎语改成'欢迎回到我们的小家'"
- "在相册里添加上周去海边的照片"
- "给日程里加下周六去看牙医的安排"
- "在备忘录里加买卫生纸的清单"

## 手动编辑方式
如果你想自己改：

### 1. 修改现有页面
编辑 `docs/` 下对应的 Markdown 文件：
| 页面 | 文件路径 |
|------|----------|
| 首页 | `docs/index.md` |
| 相册 | `docs/album.md` |
| 日程 | `docs/schedule.md` |
| 备忘录 | `docs/memo.md` |

### 2. 添加新页面
比如要加一个「家庭食谱」页面：
1. 创建 `docs/recipe.md` 文件，写内容
2. 编辑 `docs/.vitepress/config.mts`，在 nav 里添加：
   ```javascript
   { text: '食谱', link: '/recipe' }
   ```

### 3. 添加图片
1. 创建 `docs/public/images` 目录
2. 把图片放进去，比如 `family-photo.jpg`
3. 在 Markdown 里引用：`![家庭照片](/images/family-photo.jpg)`

### 4. 提交更新
```bash
git add .
git commit -m "更新：添加海边照片"
git push
```
提交后等待1-2分钟，网站就会自动更新。

## Markdown 语法参考
### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 图片
```markdown
![图片说明](图片链接或路径)
```

### 列表
```markdown
- 列表项1
- 列表项2
- [x] 已完成的待办
- [ ] 未完成的待办
```

### 表格
```markdown
| 列1 | 列2 |
|-----|-----|
| 内容1 | 内容2 |
| 内容3 | 内容4 |
```
