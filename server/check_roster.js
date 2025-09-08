const mysql = require('mysql2/promise');

async function checkRoster() {
  try {
    const connection = await mysql.createConnection({
      host: '192.168.24.6',
      user: 'root',
      password: 'JL123456',
      database: 'hr_dashboard'
    });

    console.log('连接数据库成功');

    // 检查表是否存在
    const [tables] = await connection.execute('SHOW TABLES LIKE "employee_roster"');
    if (tables.length === 0) {
      console.log('employee_roster表不存在');
      return;
    }

    // 检查记录数
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM employee_roster');
    console.log('employee_roster表记录数:', countResult[0].count);

    if (countResult[0].count > 0) {
      // 获取样本数据
      const [sample] = await connection.execute('SELECT * FROM employee_roster LIMIT 3');
      console.log('样本数据:');
      sample.forEach((row, index) => {
        console.log(`第${index + 1}行:`, row);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkRoster();

