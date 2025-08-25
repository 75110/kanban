const mysql = require('mysql2/promise');

async function checkPositionTable() {
  const connection = await mysql.createConnection({
    host: '192.168.24.6',
    user: 'root',
    password: 'JL123456',
    database: 'hr_dashboard',
    charset: 'utf8mb4'
  });

  try {
    console.log('===== 检查 employee_position_info 表 =====');
    
    // 1. 查看表结构
    const [columns] = await connection.execute('SHOW COLUMNS FROM employee_position_info');
    console.log('\n表结构:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || 'NULL'}`);
    });

    // 2. 查看前10条记录的入职时间
    console.log('\n前10条记录的入职时间:');
    const [records] = await connection.execute(`
      SELECT 
        employee_id,
        entry_date,
        actual_regularization_date,
        contract_end_date
      FROM employee_position_info 
      ORDER BY employee_id 
      LIMIT 10
    `);
    
    records.forEach((record, index) => {
      console.log(`${index + 1}. 员工ID: ${record.employee_id}, 入职: ${record.entry_date}, 转正: ${record.actual_regularization_date}, 合同到期: ${record.contract_end_date}`);
    });

    // 3. 统计入职时间分布
    console.log('\n入职时间分布统计:');
    const [stats] = await connection.execute(`
      SELECT 
        DATE(entry_date) as entry_date,
        COUNT(*) as count
      FROM employee_position_info 
      WHERE entry_date IS NOT NULL
      GROUP BY DATE(entry_date)
      ORDER BY entry_date DESC
      LIMIT 20
    `);
    
    stats.forEach(stat => {
      console.log(`${stat.entry_date}: ${stat.count}人`);
    });

    // 4. 检查是否所有入职时间都是连续的
    console.log('\n检查入职时间是否连续:');
    const [continuous] = await connection.execute(`
      SELECT 
        entry_date,
        LAG(entry_date) OVER (ORDER BY entry_date) as prev_date,
        DATEDIFF(entry_date, LAG(entry_date) OVER (ORDER BY entry_date)) as date_diff
      FROM employee_position_info 
      WHERE entry_date IS NOT NULL
      ORDER BY entry_date
      LIMIT 10
    `);
    
    continuous.forEach((record, index) => {
      if (index > 0) {
        console.log(`${record.entry_date} (与前一个相差 ${record.date_diff} 天)`);
      } else {
        console.log(`${record.entry_date} (第一条记录)`);
      }
    });

    // 5. 随机抽取一些记录看看
    console.log('\n随机抽取5条记录:');
    const [random] = await connection.execute(`
      SELECT 
        ebi.name,
        epi.entry_date,
        epi.employee_type,
        sd.department,
        sp.position
      FROM employee_position_info epi
      JOIN employee_basic_info ebi ON epi.employee_id = ebi.id
      LEFT JOIN sys_department sd ON epi.department_id = sd.id
      LEFT JOIN sys_position sp ON epi.position_id = sp.id
      ORDER BY RAND()
      LIMIT 5
    `);
    
    random.forEach(record => {
      console.log(`${record.name}: ${record.entry_date} (${record.department} - ${record.position})`);
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await connection.end();
  }
}

checkPositionTable();
