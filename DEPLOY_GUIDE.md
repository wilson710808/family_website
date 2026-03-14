# 🚀 部署指南

## 1. 创建 GitHub 仓库
1. 访问 https://github.com/new
2. 仓库名：`family-website`
3. 选择「Private」（私有，只有你邀请的人可以访问）
4. 不要勾选「Add a README file」「Add .gitignore」「Choose a license」
5. 点击「Create repository」

## 2. 推送代码到 GitHub
运行下面的命令（替换成你自己的 GitHub 用户名）：
```bash
cd family-website
git remote add origin https://github.com/你的用户名/family-website.git
git push -u origin main
```

## 3. 开启 GitHub Pages 自动部署
1. 进入你的 GitHub 仓库 → 点击「Settings」
2. 左侧菜单找到「Pages」
3. 在「Source」下拉菜单中选择「GitHub Actions」
4. 保存设置

## 4. 访问你的网站
- 部署完成后，GitHub 会给你一个网址：`https://你的用户名.github.io/family-website/`
- 以后每次 `git push` 到 main 分支，都会自动更新网站

## 5. 常用命令
```bash
# 本地预览
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 6. 如何更新内容
所有内容都在 `docs/` 目录下，都是 Markdown 格式：
- `index.md` - 首页
- `album.md` - 相册
- `schedule.md` - 家庭日程
- `memo.md` - 备忘录

你可以直接编辑这些文件，然后提交到 GitHub，网站会自动更新。

## 7. 常见问题
### 网站没有更新？
- 进入 GitHub 仓库的「Actions」页面，查看部署是否成功
- 如果失败，查看错误日志，一般是 Markdown 格式有问题

### 想自定义域名？
1. 在域名服务商那里添加 CNAME 记录，指向 `你的用户名.github.io`
2. 在 `docs/public/` 目录下创建 CNAME 文件，内容是你的域名
3. 提交代码，等待部署完成
