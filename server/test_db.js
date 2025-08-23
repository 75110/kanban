const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr',
  charset: 'utf8mb4'
};

async function testDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 测试基本查询
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库中的表:', tables.map(t => Object.values(t)[0]));

    // 检查员工基本信息表
    const [employeeCount] = await connection.execute('SELECT COUNT(*) as count FROM employee_basic_info');
    console.log('员工基本信息表记录数:', employeeCount[0].count);

    // 检查员工职位信息表
    const [positionCount] = await connection.execute('SELECT COUNT(*) as count FROM employee_position_info');
    console.log('员工职位信息表记录数:', positionCount[0].count);

    // 测试简单的员工查询
    const [employees] = await connection.execute('SELECT id, name FROM employee_basic_info LIMIT 5');
    console.log('前5个员工:', employees);

    // 测试完整的JOIN查询（简化版）
    const [joinResult] = await connection.execute(`
      SELECT 
        ebi.id, ebi.name, ebi.gender,
        sr.region, sd.department, sp.position
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      LEFT JOIN sys_region sr ON epi.region_id = sr.id
      LEFT JOIN sys_department sd ON epi.department_id = sd.id
      LEFT JOIN sys_position sp ON epi.position_id = sp.id
      LIMIT 3
    `);
    console.log('JOIN查询结果:', joinResult);

    await connection.end();
  } catch (error) {
    console.error('数据库测试失败:', error);
  }
}

testDatabase();
