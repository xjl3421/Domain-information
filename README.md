# 🗡️ 剑之魂域名查询 - 免费的一站式域名信息查询工具

<div align="center">

[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.en.md)

**剑之魂域名查询** 是一个功能强大的在线域名信息查询工具，支持RDAP和WHOIS两种查询方式，为用户提供免费、快速、准确的域名注册信息查询服务。

[![功能演示](https://img.shields.io/badge/功能-在线查询-green.svg)](http://localhost:3000)
[![开源协议](https://img.shields.io/badge/协议-MIT-blue.svg)](LICENSE)
[![维护状态](https://img.shields.io/badge/维护-活跃-brightgreen.svg)](https://jhkj.netlify.app)

</div>

## ✨ 主要功能

### 🔍 多种查询方式
- **RDAP查询** - 基于Registration Data Access Protocol的现代域名查询协议
- **WHOIS查询** - 传统的域名信息查询方式
- **智能切换** - 自动识别域名后缀，RDAP不支持时自动切换到WHOIS查询

### 📊 支持的查询对象
- **域名查询** - 获取域名注册状态、注册商、到期时间等信息
- **IP地址查询** - 查询IP地址的归属地和相关信息
- **自治系统号(ASN)查询** - 获取网络运营商信息
- **实体句柄查询** - 查询注册机构实体信息

### 💰 价格查询功能
- **实时价格** - 查询域名注册、续费、转入价格
- **多平台对比** - 显示多个注册商的价格信息
- **智能排序** - 按价格从低到高排序，推荐最优惠选项

### 🎨 用户体验
- **响应式设计** - 完美适配桌面端和移动端
- **深色模式** - 支持浅色/深色主题切换
- **实时反馈** - 查询结果即时显示，加载状态清晰
- **错误处理** - 友好的错误提示和自动重试机制

## 🚀 技术栈

### 🎯 核心框架
- **⚡ Next.js 15** - 基于App Router的React框架
- **📘 TypeScript 5** - 类型安全的JavaScript开发体验
- **🎨 Tailwind CSS 4** - 实用优先的CSS框架

### 🧩 UI组件与样式
- **🧩 shadcn/ui** - 基于Radix UI的高质量可访问组件
- **🎯 Lucide React** - 美观一致的图标库
- **🌈 Next Themes** - 完美的深色模式支持

### 🔄 状态管理与数据获取
- **🐻 Zustand** - 简单可扩展的状态管理
- **🔄 TanStack Query** - 强大的React数据同步
- **🌐 Axios** - 基于Promise的HTTP客户端

### 🔐 认证与安全
- **🔐 NextAuth.js** - 完整的开源认证解决方案
- **📊 频率限制** - 智能请求频率控制
- **🛡️ 管理员认证** - 支持管理员和自用模式

## 🎯 为什么选择剑之魂域名查询？

- **🏎️ 快速查询** - 优化的查询逻辑，毫秒级响应
- **🎨 美观界面** - 现代化UI设计，操作简单直观
- **🔒 类型安全** - 完整的TypeScript类型定义
- **📱 响应式设计** - 移动优先的设计理念
- **🔄 智能切换** - 自动选择最优查询方式
- **💰 价格透明** - 实时价格查询，帮助用户做出最佳选择
- **🌐 多协议支持** - 同时支持RDAP和WHOIS协议
- **🚀 生产就绪** - 优化的构建和部署配置

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/xjl3421/domain-information.git

# 进入项目目录
cd domain-information

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用

打开 [http://localhost:3000](http://localhost:3000) 即可看到应用运行。

### 可用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库操作
npm run db:push
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页
├── components/            # 可复用 React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── theme-provider.tsx # 主题提供者
├── hooks/                 # 自定义 React hooks
├── lib/                   # 工具函数和配置
│   ├── db.ts             # 数据库客户端
│   └── socket.ts         # WebSocket 配置
└── prisma/                # 数据库架构
    └── schema.prisma      # Prisma 数据模型
```

## 🎨 可用功能与组件

### 🔍 查询功能
- **多协议支持** - RDAP 和 WHOIS 双协议查询
- **智能切换** - 根据域名后缀自动选择查询方式
- **批量查询** - 支持多个域名同时查询
- **历史记录** - 查询历史保存和管理

### 💰 价格查询
- **实时价格** - 获取最新域名注册价格
- **多平台对比** - 显示不同注册商的价格
- **价格趋势** - 价格变化历史和趋势分析
- **优惠提醒** - 价格下降时自动提醒

### 🎨 用户界面
- **主题切换** - 浅色/深色模式无缝切换
- **响应式布局** - 完美适配各种屏幕尺寸
- **加载状态** - 优雅的加载动画和进度指示
- **错误处理** - 友好的错误提示和重试机制

### 🔐 认证与权限
- **管理员模式** - 完整的管理员权限控制
- **自用模式** - 个人使用无限制查询
- **频率限制** - 智能的请求频率控制
- **安全认证** - 基于密码的安全认证机制

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# 管理员密码
ADMIN_PASSWORD=your_secure_password

# 数据库配置
DATABASE_URL="file:./dev.db"

# NextAuth 配置
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 数据库设置

项目使用 Prisma ORM 和 SQLite 数据库：

```bash
# 推送数据库架构
npm run db:push

# 查看数据库
npm run db:studio
```

## 🌐 部署指南

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署并享受自动更新

### Docker 部署

```bash
# 构建镜像
docker build -t domain-query .

# 运行容器
docker run -p 3000:3000 domain-query
```

### 传统服务器部署

```bash
# 构建项目
npm run build

# 启动服务
npm start
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 的代码规范
- 编写清晰的组件和函数文档
- 确保所有功能都有适当的测试覆盖

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

## 🙏 致谢

感谢以下开源项目和社区的支持：

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Prisma](https://prisma.io/) - 数据库 ORM
- [NextAuth.js](https://next-auth.js.org/) - 认证解决方案

## 📞 联系我们

- **项目维护**: [剑之魂科技](https://jhkj.netlify.app)
- **开源仓库**: [GitHub](https://github.com/xjl3421/domain-information)
- **问题反馈**: [GitHub Issues](https://github.com/xjl3421/domain-information/issues)

---

<div align="center">

**剑之魂域名查询** - 让域名查询变得简单高效

由 [剑之魂科技](https://jhkj.netlify.app) 用 ❤️ 维护

</div>