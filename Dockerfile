# 多阶段构建 Dockerfile for HR Dashboard
# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制前端 package.json 和 package-lock.json
COPY client/package*.json ./client/
COPY package*.json ./

# 安装前端依赖
RUN cd client && npm ci --only=production

# 复制前端源代码
COPY client/ ./client/

# 构建前端
RUN cd client && npm run build

# 阶段2: 准备后端运行环境
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制根目录的 package.json
COPY package*.json ./

# 复制后端 package.json 和安装依赖
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production && npm cache clean --force

# 复制后端源代码
COPY server/ ./server/

# 从前端构建阶段复制构建好的静态文件
COPY --from=frontend-builder /app/client/dist ./client/dist

# 复制其他必要文件
COPY excel_templates/ ./excel_templates/
COPY *.sql ./
COPY *.md ./

# 创建必要的目录并设置权限
RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000 5173

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 启动命令
CMD ["node", "server/index.js"]
