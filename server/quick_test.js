console.log('开始测试...');

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr'
};

async function quickTest() {
  try {
    console.log('连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM employee_basic_info');
    console.log('✅ 查询成功，员工总数:', result[0].count);
    
    await connection.end();
    console.log('✅ 测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

quickTest();
