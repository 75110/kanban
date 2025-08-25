const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;

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
    console.log('✅ 数据库连接测试成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

// 简单的API测试端点
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM employee_basic_info');
    connection.release();
    res.json({ 
      message: '数据库连接正常', 
      employeeCount: result[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API测试端点错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 统计数据端点
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // 在职员工数
    const [totalResult] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
      WHERE eri.id IS NULL
    `);
    
    // 离职员工数
    const [resignedResult] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
    `);
    
    connection.release();
    
    res.json({
      totalEmployees: totalResult[0].count,
      newEmployees: 0, // 暂时返回0
      resignedEmployees: resignedResult[0].count,
      transferEmployees: 0, // 暂时返回0
      growth: {
        totalEmployees: { monthOverMonth: 0, yearOverYear: 0 },
        newEmployees: { monthOverMonth: 0, yearOverYear: 0 },
        resignedEmployees: { monthOverMonth: 0, yearOverYear: 0 },
        transferEmployees: { monthOverMonth: 0, yearOverYear: 0 }
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '人事数据看板API运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📊 API地址: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🧪 测试端点: http://localhost:${PORT}/api/test`);
  
  // 测试数据库连接
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log('✅ 服务器启动完成，数据库连接正常');
  } else {
    console.log('⚠️  服务器启动完成，但数据库连接失败');
  }
});
