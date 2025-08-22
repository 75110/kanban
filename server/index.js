const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Jinlian123..',
  database: process.env.DB_NAME || 'hr_dashboard',
  waitForConnections: true,
  connectionLimit: 20, // 增加连接数以提高并发性能
  queueLimit: 0,
  acquireTimeout: 30000, // 30秒超时
  timeout: 30000, // 查询超时
  reconnect: true,
  idleTimeout: 300000, // 5分钟空闲超时
  maxIdle: 10, // 增加最大空闲连接数
  // 添加性能优化配置
  charset: 'utf8mb4',
  multipleStatements: false,
  namedPlaceholders: false
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 监控连接池状态
pool.on('connection', function (connection) {
  console.log('新的数据库连接建立: ' + connection.threadId);
});

pool.on('error', function(err) {
  console.error('数据库连接池错误:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('数据库连接丢失，尝试重新连接...');
  }
});

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接测试成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
}

// 启动时测试连接
testDatabaseConnection();

// 导入路由
const dashboardRoutes = require('./routes/dashboard');
const employeeRoutes = require('./routes/employee');

// 将数据库连接池传递给路由
app.use('/api/dashboard', (req, res, next) => {
  req.pool = pool;
  next();
}, dashboardRoutes);

app.use('/api/employee', (req, res, next) => {
  req.pool = pool;
  next();
}, employeeRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '人事数据看板API运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 导出数据库连接池供其他模块使用
module.exports = { pool };
