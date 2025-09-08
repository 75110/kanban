const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'kanban',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkData() {
  try {
    console.log('=== 检查华南地区数据 ===');
    
    // 检查广西
    const [rows1] = await pool.execute('SELECT DISTINCT hometown FROM employee_roster WHERE hometown LIKE "%广西%" LIMIT 10');
    console.log('包含广西的hometown数据:');
    rows1.forEach(row => console.log(row.hometown));
    
    // 检查海南
    const [rows2] = await pool.execute('SELECT DISTINCT hometown FROM employee_roster WHERE hometown LIKE "%海南%" LIMIT 10');
    console.log('\n包含海南的hometown数据:');
    rows2.forEach(row => console.log(row.hometown));
    
    // 检查香港
    const [rows3] = await pool.execute('SELECT DISTINCT hometown FROM employee_roster WHERE hometown LIKE "%香港%" LIMIT 10');
    console.log('\n包含香港的hometown数据:');
    rows3.forEach(row => console.log(row.hometown));
    
    // 检查澳门
    const [rows4] = await pool.execute('SELECT DISTINCT hometown FROM employee_roster WHERE hometown LIKE "%澳门%" LIMIT 10');
    console.log('\n包含澳门的hometown数据:');
    rows4.forEach(row => console.log(row.hometown));
    
    // 检查广东
    const [rows5] = await pool.execute('SELECT DISTINCT hometown FROM employee_roster WHERE hometown LIKE "%广东%" LIMIT 10');
    console.log('\n包含广东的hometown数据:');
    rows5.forEach(row => console.log(row.hometown));
    
    // 统计华南地区总人数
    const [countRows] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN hometown LIKE '%广东%' THEN 1 ELSE 0 END) as 广东人数,
        SUM(CASE WHEN hometown LIKE '%海南%' THEN 1 ELSE 0 END) as 海南人数,
        SUM(CASE WHEN hometown LIKE '%广西%' THEN 1 ELSE 0 END) as 广西人数,
        SUM(CASE WHEN hometown LIKE '%香港%' THEN 1 ELSE 0 END) as 香港人数,
        SUM(CASE WHEN hometown LIKE '%澳门%' THEN 1 ELSE 0 END) as 澳门人数
      FROM employee_roster 
      WHERE hometown IS NOT NULL AND hometown != ''
    `);
    
    console.log('\n=== 华南地区人数统计 ===');
    console.log(countRows[0]);
    
  } catch (error) {
    console.error('查询错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();




