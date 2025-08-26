# HR Dashboard Docker 部署指南

## 快速开始

### 1. 准备环境

确保您的系统已安装：
- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)

### 2. 克隆项目并配置

```bash
# 克隆项目
git clone <your-repo-url>
cd kanban

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量（根据需要修改）
nano .env
```

### 3. 构建和启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f hr-dashboard
```

### 4. 访问应用

- 应用地址：http://localhost:3000
- 通过 Nginx 访问：http://localhost:80
- MySQL 数据库：localhost:3306

## 详细配置

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机 | mysql |
| DB_PORT | 数据库端口 | 3306 |
| DB_NAME | 数据库名称 | hr_dashboard |
| DB_USER | 数据库用户 | hr_user |
| DB_PASSWORD | 数据库密码 | hr_password |
| NODE_ENV | 运行环境 | production |
| PORT | 应用端口 | 3000 |

### 服务说明

#### 1. MySQL 数据库 (mysql)
- 端口：3306
- 数据持久化：使用 Docker volume
- 初始化：自动执行 `表结构.sql`

#### 2. HR Dashboard 应用 (hr-dashboard)
- 端口：3000
- 包含前端和后端
- 健康检查：/api/health

#### 3. Nginx 反向代理 (nginx)
- 端口：80, 443
- 负载均衡和静态文件服务
- Gzip 压缩

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]
```

### 数据库管理

```bash
# 连接到 MySQL
docker-compose exec mysql mysql -u hr_user -p hr_dashboard

# 备份数据库
docker-compose exec mysql mysqldump -u hr_user -p hr_dashboard > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u hr_user -p hr_dashboard < backup.sql
```

### 应用管理

```bash
# 查看应用日志
docker-compose logs -f hr-dashboard

# 进入应用容器
docker-compose exec hr-dashboard sh

# 重新构建应用
docker-compose build hr-dashboard
docker-compose up -d hr-dashboard
```

## 生产环境部署

### 1. 安全配置

```bash
# 修改默认密码
# 编辑 .env 文件，更改：
# - MYSQL_ROOT_PASSWORD
# - DB_PASSWORD
# - JWT_SECRET
# - SESSION_SECRET
```

### 2. SSL 证书配置

```bash
# 创建 SSL 目录
mkdir ssl

# 将证书文件放入 ssl 目录
# ssl/cert.pem
# ssl/key.pem

# 取消注释 nginx.conf 中的 HTTPS 配置
```

### 3. 性能优化

```bash
# 增加 MySQL 内存配置
# 在 docker-compose.yml 中添加：
# command: --innodb-buffer-pool-size=1G --max-connections=200

# 调整 Nginx worker 进程数
# 在 nginx.conf 中修改：
# worker_processes auto;
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查 MySQL 服务状态
   docker-compose logs mysql
   
   # 检查网络连接
   docker-compose exec hr-dashboard ping mysql
   ```

2. **应用启动失败**
   ```bash
   # 查看应用日志
   docker-compose logs hr-dashboard
   
   # 检查端口占用
   netstat -tulpn | grep :3000
   ```

3. **前端资源加载失败**
   ```bash
   # 重新构建前端
   docker-compose build hr-dashboard
   
   # 检查 Nginx 配置
   docker-compose exec nginx nginx -t
   ```

### 监控和维护

```bash
# 查看资源使用情况
docker stats

# 清理未使用的镜像和容器
docker system prune -a

# 备份数据卷
docker run --rm -v kanban_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并部署
docker-compose build
docker-compose up -d

# 清理旧镜像
docker image prune -f
```
