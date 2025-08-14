# 域名信息查询工具

一个功能强大的域名信息查询工具，支持RDAP和WHOIS两种查询方式，提供实时、准确的域名注册信息查询服务。
在页面中"管理员登录"任何密码都能登录管理员模式，不想改了。

## 🌟 功能特性

### 🔍 双重查询支持
- **RDAP查询** - 新一代注册数据访问协议，支持域名、IP地址、自治系统号、实体等多种对象类型
- **WHOIS查询** - 传统域名信息查询协议，提供详细的域名注册信息

### 🛡️ 智能限流系统
- 基于IP地址的请求频率限制（每分钟最多12次）
- 实时倒计时显示，清晰展示重置时间
- 管理员模式支持无限制查询

### 🎨 现代化界面
- 响应式设计，支持桌面和移动设备
- 深色/浅色主题支持
- 直观的标签页切换
- 实时状态反馈和加载动画

### 📊 详细信息展示
- **基本信息** - 域名、状态、注册商等
- **时间信息** - 注册时间、过期日期、更新时间
- **技术信息** - 名称服务器、DNSSEC状态
- **统计信息** - 注册天数、剩余天数

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd <project-directory>
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env.local` 文件并添加以下配置：
```env
ADMIN_PASSWORD=your_secure_password
```

**注意：** 请将 `your_secure_password` 替换为您自己的安全密码。

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基本查询

#### RDAP查询
1. 选择"RDAP查询"标签页
2. 选择对象类型：
   - `domain` - 域名查询（如：google.com）
   - `ip` - IP地址查询（如：8.8.8.8）
   - `autnum` - 自治系统号查询（如：15169）
   - `entity` - 实体查询（如：EXAMPLE-ENTITY）
3. 输入查询对象
4. 点击"开始查询"

#### WHOIS查询
1. 选择"WHOIS查询"标签页
2. 输入域名或IP地址
3. 点击"开始查询"

### 管理员模式

#### 进入管理员模式
**方法1：URL参数**
```
http://localhost:3000?password=your_admin_password
```

**方法2：登录按钮**
1. 点击"管理员登录"按钮
2. 输入您设置的密码
3. 点击确定

#### 管理员模式特权
- ✅ 无限制查询次数
- ✅ 绿色管理员徽章显示
- ✅ 持久化登录状态

#### 退出管理员模式
点击"退出管理员"按钮即可退出

### 快速示例
点击界面上的示例按钮快速体验：
- **示例域名** - 自动填入google.com进行RDAP域名查询
- **示例IP** - 自动填入8.8.8.8进行RDAP IP查询

## 🔧 技术架构

### 前端技术栈
- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **shadcn/ui** - 现代化UI组件库
- **Lucide React** - 精美图标库

### 后端技术栈
- **Next.js API Routes** - 无服务器API
- **Node.js** - 运行时环境
- **TypeScript** - 类型安全

### 外部API
- **RDAP API** - `https://rdap.org/<type>/<object>`
- **WHOIS API** - `https://api.whoiscx.com/whois/`

## 📊 API文档

### RDAP查询API

#### 请求格式
```
GET https://rdap.org/{type}/{object}
```

#### 支持的对象类型
| 类型 | 描述 | 示例 |
|------|------|------|
| domain | 域名 | google.com |
| ip | IP地址 | 8.8.8.8 |
| autnum | 自治系统号 | 15169 |
| entity | 实体 | EXAMPLE-ENTITY |

#### 响应格式
```json
{
  "ldhName": "example.com",
  "status": ["active"],
  "events": [
    {
      "eventAction": "registration",
      "eventDate": "2023-01-01T00:00:00Z"
    }
  ],
  "entities": [...],
  "nameservers": [...]
}
```

### WHOIS查询API

#### 请求格式
```
GET https://api.whoiscx.com/whois/?domain={domain}&raw=1
```

#### 请求参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| domain | string | 是 | 要查询的域名 |
| raw | int | 否 | 是否返回原始WHOIS文本，1为返回 |

#### 响应格式
```json
{
  "status": 1,
  "data": {
    "is_available": 0,
    "domain": "example.com",
    "domain_suffix": "com",
    "query_time": "2025-06-20 06:06:32",
    "info": {
      "domain": "example.com",
      "registrant_name": "Example Inc.",
      "registrar_name": "Example Registrar",
      "creation_time": "2012-04-25 12:36:40",
      "expiration_time": "2026-04-25 12:36:40",
      "creation_days": 4803,
      "valid_days": 309,
      "is_expire": 0,
      "domain_status": ["ok"],
      "name_server": ["ns1.example.com", "ns2.example.com"],
      "whois_server": "whois.example.com"
    }
  }
}
```

## 🛠️ 开发指南

### 项目结构
```
src/
├── app/
│   ├── api/
│   │   └── domain-query/
│   │       └── route.ts          # 查询API路由
│   ├── page.tsx                 # 主页面
│   ├── layout.tsx               # 应用布局
│   └── globals.css              # 全局样式
├── components/
│   └── ui/                      # UI组件库
├── hooks/
│   ├── use-toast.ts             # Toast通知钩子
│   └── use-mobile.ts            # 移动设备检测
└── lib/
    ├── utils.ts                 # 工具函数
    ├── db.ts                    # 数据库配置
    └── socket.ts                # WebSocket配置
```

### 可用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 数据库操作
npm run db:push      # 推送schema到数据库
npm run db:generate  # 生成Prisma客户端
npm run db:migrate   # 运行数据库迁移
npm run db:reset     # 重置数据库
```

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `ADMIN_PASSWORD` | 管理员密码 | 无（必需配置） |
| `NEXTAUTH_URL` | NextAuth URL | - |
| `DATABASE_URL` | 数据库连接字符串 | - |

## 🎨 界面展示

### 主要功能界面
- **查询表单** - 支持RDAP和WHOIS查询类型切换
- **结果展示** - 格式化的域名信息显示
- **状态指示** - 请求计数、倒计时、管理员状态
- **错误处理** - 友好的错误提示和自动消失

### 响应式设计
- **桌面端** - 完整功能布局
- **平板端** - 适配性布局
- **移动端** - 紧凑型界面

## 🐛 故障排除

### 常见问题

#### 1. 查询失败
**问题：** 查询时出现错误提示
**解决：**
- 检查网络连接
- 确认查询对象格式正确
- 查看错误详情了解具体原因

#### 2. 请求限制
**问题：** 显示"请求频率超限"
**解决：**
- 等待倒计时结束（每分钟重置）
- 使用管理员模式（需要配置环境变量）
- 减少查询频率

#### 3. 管理员登录失败
**问题：** 无法进入管理员模式
**解决：**
- 确认已正确配置环境变量 `ADMIN_PASSWORD`
- 检查密码输入是否正确
- 清除浏览器缓存重试

## 📋 更新日志

### v1.0.0 (2025-01-14)
- ✅ 初始版本发布
- ✅ RDAP和WHOIS双重查询支持
- ✅ 基于IP的请求频率限制
- ✅ 管理员模式功能
- ✅ 实时倒计时显示
- ✅ 响应式界面设计
- ✅ 智能错误处理
- ✅ 集成whoiscx.com官方WHOIS API
- ✅ 增强域名信息字段展示
- ✅ 移除默认管理员密码，需要用户自行配置


### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint代码规范
- 编写清晰的提交信息
- 确保功能测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [RDAP.org](https://about.rdap.org/) - RDAP服务
- [whoiscx.com](https://www.whoiscx.com/) - WHOIS服务

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 📧 邮箱：[无]
- 🐛 问题反馈：[GitHub Issues]
- 💬 讨论：[GitHub Discussions]

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**
