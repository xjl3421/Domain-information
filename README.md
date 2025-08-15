#  剑之魂域名查询 - 免费的一站式域名信息查询工具

一个功能强大的域名信息查询工具，支持RDAP和WHOIS两种查询方式，为用户提供免费、快速、准确的域名信息查询服务。

[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.en.md)


## ✨ 主要功能

### 🔍 多种查询方式
- **RDAP查询** - 基于RDAP的现代域名查询协议，新一代注册数据访问协议，支持域名、IP地址、自治系统号、实体等多种对象类型
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

### 🔐 认证与权限
- **管理员模式** - 完整的管理员权限控制
- **自用模式** - 个人使用无限制查询
- **频率限制** - 智能的请求频率控制
- **安全认证** - 基于密码的安全认证机制

### 🛡️ 智能限流系统
- 基于IP地址的请求频率限制（每分钟最多12次）
- 实时倒计时显示，清晰展示重置时间
- 管理员模式支持无限制查询


## 🚀 技术栈

### 🎯 核心框架
- **⚡ Next.js 15** - 基于App Router的React框架
- **📘 TypeScript 5** - 类型安全的JavaScript开发体验
- **🎨 Tailwind CSS 4** - 实用优先的CSS框架


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

### 静态网站部署（如Vercel、netlify、edgeone）

1. fork项目到你GitHub仓库中
2. 在该平台中导入或选择你fork的仓库
3. 填写部署设置
   选择项目类型：Next.js
   安装命令：npm run install
   构建命令：npm run build
   发布目录：./next
4. 配置环境变量
5. 部署

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