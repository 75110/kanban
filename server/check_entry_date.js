const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr_dashboard',
  charset: 'utf8mb4'
};

async function checkEntryDates() {
  let connection;
  
  try {
    console.log('===== 检查入职时间数据 =====\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功!\n');

    // 检查入职时间字段的数据类型和实际值
    console.log('1. 检查 employee_position_info 表结构:');
    const [columns] = await connection.execute('SHOW FULL COLUMNS FROM employee_position_info');
    const entryDateColumn = columns.find(col => col.Field === 'entry_date');
    console.log('entry_date 字段信息:', entryDateColumn);
    console.log('');

    // 查看前10条记录的入职时间
    console.log('2. 查看前10条记录的入职时间:');
    const [records] = await connection.execute(`
      SELECT 
        ebi.id,
        ebi.name,
        epi.entry_date,
        DATE_FORMAT(epi.entry_date, '%Y-%m-%d') as formatted_date,
        TIMESTAMPDIFF(MONTH, epi.entry_date, CURDATE()) as work_months
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      ORDER BY ebi.id
      LIMIT 10
    `);

    records.forEach((record, index) => {
      console.log(`${index + 1}. ${record.name} (ID: ${record.id})`);
      console.log(`   原始入职时间: ${record.entry_date}`);
      console.log(`   格式化时间: ${record.formatted_date}`);
      console.log(`   工作月数: ${record.work_months}`);
      console.log('');
    });

    // 检查入职时间的分布情况
    console.log('3. 检查入职时间分布:');
    const [distribution] = await connection.execute(`
      SELECT 
        YEAR(entry_date) as year,
        MONTH(entry_date) as month,
        COUNT(*) as count
      FROM employee_position_info
      WHERE entry_date IS NOT NULL
      GROUP BY YEAR(entry_date), MONTH(entry_date)
      ORDER BY year DESC, month DESC
      LIMIT 20
    `);

    console.log('入职时间分布 (年-月: 人数):');
    distribution.forEach(dist => {
      console.log(`${dist.year}-${String(dist.month).padStart(2, '0')}: ${dist.count}人`);
    });
    console.log('');

    // 检查是否有异常的入职时间
    console.log('4. 检查异常入职时间:');
    const [abnormal] = await connection.execute(`
      SELECT 
        ebi.name,
        epi.entry_date,
        CASE 
          WHEN epi.entry_date > CURDATE() THEN '未来日期'
          WHEN epi.entry_date < '1900-01-01' THEN '过早日期'
          WHEN epi.entry_date IS NULL THEN '空值'
          ELSE '正常'
        END as status
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      WHERE epi.entry_date > CURDATE() 
         OR epi.entry_date < '1900-01-01' 
         OR epi.entry_date IS NULL
      LIMIT 10
    `);

    if (abnormal.length > 0) {
      console.log('发现异常入职时间:');
      abnormal.forEach(record => {
        console.log(`- ${record.name}: ${record.entry_date} (${record.status})`);
      });
    } else {
      console.log('未发现异常入职时间');
    }

  } catch (error) {
    console.error('检查失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行检查
checkEntryDates();
