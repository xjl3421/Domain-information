# 🤖 GitHub Actions 自动构建说明

本项目配置了GitHub Actions来自动构建项目并将构建输出保存到`./pages`目录中。

## 🚀 工作流 (Build and Deploy Next.js )

**触发条件**:
- 推送到 `pages` 分支
- 针对这些分支的 Pull Request
- 手动触发 (workflow_dispatch)


**构建输出位置**:
```
./pages/
├── .next/              # Next.js构建输出
├── public/             # 静态资源
├── package.json        # 依赖配置
├── package-lock.json   # 依赖锁定文件
└── DEPLOYMENT_INFO.md  # 部署信息
```

**主要功能**:
- ✅ 检查pages目录状态
- ✅ 清理缓存文件
- ✅ 移除测试文件
- ✅ 清理开发依赖
- ✅ 自动提交清理结果



## 🛠️ 部署构建输出

### 从pages目录部署

```bash
# 1. 克隆仓库
git clone <repository-url>
cd <repository-name>

# 2. 进入pages目录
cd pages

# 3. 安装生产依赖
npm install --production

# 4. 启动应用
npm start
```

### 构建产物

 **静态部署**:
   - `./pages/.next/static/` 目录包含静态资源
   - 可以直接部署到任何静态文件服务器




如有问题或建议，请提交Issue或联系项目维护者。