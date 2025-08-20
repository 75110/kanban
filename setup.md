# 人事数据看板系统部署指南

## 系统要求

- Node.js 16.0+
- MySQL 8.0+
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装所有项目依赖
npm run install:all
```

### 2. 数据库配置

1. 创建MySQL数据库：
```sql
CREATE DATABASE hr_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p hr_dashboard < server/database/schema.sql
```

3. 导入示例数据（可选）：
```bash
mysql -u root -p hr_dashboard < server/database/sample_data.sql
```

4. 配置数据库连接：
```bash
# 复制环境变量文件
cp server/.env.example server/.env

# 编辑 server/.env 文件，配置数据库连接信息
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hr_dashboard
```

### 3. 启动服务

#### 开发模式
```bash
# 同时启动前端和后端开发服务器
npm run dev
```

#### 生产模式
```bash
# 构建前端
npm run client:build

# 启动后端服务器
npm run server:start
```

## 访问地址

- 前端开发服务器: http://localhost:3000
- 后端API服务器: http://localhost:3001
- API文档: http://localhost:3001/api/health

## 功能特性

### 数据看板
- 📊 实时人事数据统计
- 📈 同比环比数据分析
- 🔍 多维度数据筛选
- 📱 响应式专业界面

### 数据管理
- 👥 员工花名册管理
- 📋 离职监控跟踪
- 🔄 人员异动记录

### 数据转换
- **工龄转换**: 月份自动转换为年龄段（1年以下、1-2年...10年以上）
- **学历转换**: 学历标准化分类（高中及以下、大专、本科、硕士及以上、其他）
- **区域转换**: 区域自动映射到组织区域（华东、华北、华南）

### 筛选功能
- 组织区域筛选
- 区域筛选
- 部门筛选
- 年份筛选
- 月份筛选

## 技术栈

### 前端
- Vue 3 - 渐进式JavaScript框架
- Element Plus - Vue 3组件库
- ECharts - 数据可视化图表库
- Vue Router - 路由管理
- Pinia - 状态管理
- Axios - HTTP客户端

### 后端
- Node.js - JavaScript运行时
- Express - Web应用框架
- MySQL2 - MySQL数据库驱动
- Moment.js - 日期处理库
- CORS - 跨域资源共享

## 项目结构

```
hr-dashboard/
├── client/                 # Vue前端项目
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # Pinia状态管理
│   │   ├── api/            # API接口
│   │   ├── router/         # 路由配置
│   │   └── style/          # 样式文件
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js后端项目
│   ├── routes/             # API路由
│   ├── utils/              # 工具函数
│   ├── database/           # 数据库文件
│   ├── package.json
│   └── index.js
├── package.json            # 根目录配置
└── README.md
```

## 开发说明

### 添加新的数据转换规则
在 `server/utils/dataTransform.js` 中添加新的转换函数。

### 添加新的API接口
在 `server/routes/` 目录下创建新的路由文件。

### 添加新的前端页面
1. 在 `client/src/views/` 中创建页面组件
2. 在 `client/src/router/index.js` 中添加路由配置
3. 在 `client/src/components/Layout.vue` 中添加菜单项

## 常见问题

### 1. 数据库连接失败
检查 `server/.env` 文件中的数据库配置是否正确。

### 2. 前端无法访问后端API
确保后端服务器正在运行，检查端口配置。

### 3. 图表不显示
检查ECharts依赖是否正确安装，确保数据格式正确。

## 支持

如有问题，请查看项目文档或联系开发团队。
