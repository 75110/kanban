const mysql = require('mysql2/promise');

const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr_dashboard',
  charset: 'utf8mb4'
};

async function checkTables() {
  try {
    console.log('连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 查询 employee_basic_info 表结构
    console.log('\n=== employee_basic_info 表结构 ===');
    const [basicInfoDesc] = await connection.execute('DESCRIBE employee_basic_info');
    console.table(basicInfoDesc);
    
    // 查询 employee_position_info 表结构
    console.log('\n=== employee_position_info 表结构 ===');
    const [positionInfoDesc] = await connection.execute('DESCRIBE employee_position_info');
    console.table(positionInfoDesc);
    
    // 查询 employee_resignation_info 表结构
    console.log('\n=== employee_resignation_info 表结构 ===');
    const [resignationInfoDesc] = await connection.execute('DESCRIBE employee_resignation_info');
    console.table(resignationInfoDesc);
    
    // 查询字典表
    console.log('\n=== 字典表数据 ===');

    try {
      const [regions] = await connection.execute('SELECT * FROM sys_region LIMIT 10');
      console.log('sys_region 数据:', regions);
    } catch (error) {
      console.log('sys_region 查询失败:', error.message);
    }

    try {
      const [departments] = await connection.execute('SELECT * FROM sys_department LIMIT 10');
      console.log('sys_department 数据:', departments);
    } catch (error) {
      console.log('sys_department 查询失败:', error.message);
    }

    try {
      const [positions] = await connection.execute('SELECT * FROM sys_position LIMIT 10');
      console.log('sys_position 数据:', positions);
    } catch (error) {
      console.log('sys_position 查询失败:', error.message);
    }

    try {
      const [educations] = await connection.execute('SELECT * FROM sys_education LIMIT 10');
      console.log('sys_education 数据:', educations);
    } catch (error) {
      console.log('sys_education 查询失败:', error.message);
    }

    // 查询示例数据
    console.log('\n=== 示例数据 ===');
    const [basicData] = await connection.execute('SELECT * FROM employee_basic_info LIMIT 3');
    console.log('employee_basic_info 示例数据:', basicData.length, '条');

    const [positionData] = await connection.execute('SELECT * FROM employee_position_info LIMIT 3');
    console.log('employee_position_info 示例数据:', positionData.length, '条');

    const [resignationData] = await connection.execute('SELECT * FROM employee_resignation_info LIMIT 3');
    console.log('employee_resignation_info 示例数据:', resignationData.length, '条')
    
    await connection.end();
    console.log('\n检查完成');
  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

checkTables();
