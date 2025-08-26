const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接配置
const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr_dashboard',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: false,
  namedPlaceholders: false
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

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

// 简单的API测试端点
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM employee_basic_info');
    connection.release();
    res.json({ message: '数据库连接正常', employeeCount: result[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '人事数据看板API运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  testDatabaseConnection();
});
