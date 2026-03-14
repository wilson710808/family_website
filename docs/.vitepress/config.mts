import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "我们的小家",
  description: "我们的家庭专属网站",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '相册', link: '/album' },
      { text: '日程', link: '/schedule' },
      { text: '备忘录', link: '/memo' },
    ],
    sidebar: false,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/family-website' }
    ],
    footer: {
      message: '❤️ Made with love for our family',
      copyright: 'Copyright © 2026 Our Family'
    }
  }
})
