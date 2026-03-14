# 🏠 我们的家庭网站

这是我们的家庭专属网站，记录生活的点点滴滴。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 本地预览
```bash
npm run dev
```
访问 http://localhost:5173 即可看到网站

### 构建生产版本
```bash
npm run build
```

### 部署
网站可以直接部署到：
- GitHub Pages
- Vercel
- Netlify
- 自己的服务器

## 📁 目录结构
```
├── docs/
│   ├── index.md          # 首页
│   ├── album.md          # 相册
│   ├── schedule.md       # 日程
│   ├── memo.md           # 备忘录
│   └── .vitepress/
│       └── config.mts    # 网站配置
├── package.json
└── README.md
```

## ✏️ 如何更新内容
所有内容都是 Markdown 格式，直接编辑 `docs/` 下的文件即可，提交到 GitHub 后会自动部署更新。

## 🔒 隐私说明
这个仓库默认是私有的，只有你添加的家庭成员可以访问。
