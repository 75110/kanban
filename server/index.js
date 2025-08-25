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
  host: process.env.DB_HOST || '192.168.24.6',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'JL123456',
  database: process.env.DB_NAME || 'hr_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
const schemaRoutes = require('./routes/schema');

// 将数据库连接池传递给路由
app.use('/api/dashboard', (req, res, next) => {
  req.pool = pool;
  next();
}, dashboardRoutes);

app.use('/api/employee', (req, res, next) => {
  req.pool = pool;
  next();
}, employeeRoutes);

app.use('/api/schema', (req, res, next) => {
  req.pool = pool;
  next();
}, schemaRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '人事数据看板API运行正常' });
});

// 字典API
// 获取部门字典
app.post('/api/sysDepartment/list', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // 首先尝试从规范化表查询
    let result;
    try {
      const [rows] = await connection.execute(`
        SELECT DISTINCT department as department, department as id
        FROM sys_department
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `);
      result = rows;
    } catch (error) {
      // 如果规范化表不存在，从employee_position_info直接查询
      console.log('sys_department表不存在，使用简化查询');
      const [rows] = await connection.execute(`
        SELECT DISTINCT department as department, department as id
        FROM employee_position_info
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `);
      result = rows;
    }

    connection.release();
    res.json(result);
  } catch (error) {
    console.error('获取部门字典失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取区域字典
app.post('/api/sysRegion/list', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // 首先尝试从规范化表查询
    let result;
    try {
      const [rows] = await connection.execute(`
        SELECT DISTINCT region as region, region as id
        FROM sys_region
        WHERE region IS NOT NULL AND region != ''
        ORDER BY region
      `);
      result = rows;
    } catch (error) {
      // 如果规范化表不存在，从employee_position_info直接查询
      console.log('sys_region表不存在，使用简化查询');
      const [rows] = await connection.execute(`
        SELECT DISTINCT region as region, region as id
        FROM employee_position_info
        WHERE region IS NOT NULL AND region != ''
        ORDER BY region
      `);
      result = rows;
    }

    connection.release();
    res.json(result);
  } catch (error) {
    console.error('获取区域字典失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取岗位字典
app.post('/api/sysPosition/list', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // 首先尝试从规范化表查询
    let result;
    try {
      const [rows] = await connection.execute(`
        SELECT DISTINCT position as position, position as id
        FROM sys_position
        WHERE position IS NOT NULL AND position != ''
        ORDER BY position
      `);
      result = rows;
    } catch (error) {
      // 如果规范化表不存在，从employee_position_info直接查询
      console.log('sys_position表不存在，使用简化查询');
      const [rows] = await connection.execute(`
        SELECT DISTINCT position as position, position as id
        FROM employee_position_info
        WHERE position IS NOT NULL AND position != ''
        ORDER BY position
      `);
      result = rows;
    }

    connection.release();
    res.json(result);
  } catch (error) {
    console.error('获取岗位字典失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接测试成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📊 API地址: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);

  // 测试数据库连接
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log('✅ 服务器启动完成，数据库连接正常');
  } else {
    console.log('⚠️  服务器启动完成，但数据库连接失败');
  }
});

// 导出数据库连接池供其他模块使用
module.exports = { pool };
