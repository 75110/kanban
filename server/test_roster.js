const mysql = require('mysql2/promise');
const { transformWorkAge, transformEducation, transformRegion } = require('./utils/dataTransform');

// 数据库连接配置
const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr',
  charset: 'utf8mb4'
};

async function testRosterQuery() {
  let connection;
  
  try {
    console.log('===== 测试花名册查询 =====\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功!\n');

    // 测试查询前5条记录
    const dataSql = `
      SELECT 
        ebi.id, 
        ebi.name, 
        ebi.gender, 
        ebi.birth_date, 
        ebi.native_place as hometown,
        sr.region, 
        sd.department, 
        sp.position,
        se.education,
        sem.education_mode as education_method,
        sps.political_status,
        sms.marital_status,
        epi.entry_date, 
        epi.employee_type,
        epi.insurance_type,
        TIMESTAMPDIFF(MONTH, epi.entry_date, CURDATE()) as work_age_months,
        TIMESTAMPDIFF(YEAR, ebi.birth_date, CURDATE()) as age
      FROM employee_basic_info ebi
      JOIN employee_position_info epi ON ebi.id = epi.employee_id
      LEFT JOIN sys_region sr ON epi.region_id = sr.id
      LEFT JOIN sys_department sd ON epi.department_id = sd.id
      LEFT JOIN sys_position sp ON epi.position_id = sp.id
      LEFT JOIN sys_education se ON ebi.education_id = se.id
      LEFT JOIN sys_education_mode sem ON ebi.education_mode_id = sem.id
      LEFT JOIN sys_political_status sps ON ebi.political_status_id = sps.id
      LEFT JOIN sys_marital_status sms ON ebi.marital_status_id = sms.id
      ORDER BY epi.entry_date DESC
      LIMIT 5
    `;
    
    console.log('执行查询...');
    const [rows] = await connection.execute(dataSql);
    
    console.log(`查询成功，获取到 ${rows.length} 条记录:\n`);
    
    // 转换数据
    const transformedRows = rows.map((row, index) => {
      console.log(`处理第 ${index + 1} 行: ${row.name}`);
      console.log(`  - 入职日期: ${row.entry_date}`);
      console.log(`  - 工龄月数: ${row.work_age_months}`);
      console.log(`  - 学历: ${row.education}`);
      console.log(`  - 部门: ${row.department}`);
      console.log(`  - 岗位: ${row.position}`);
      
      // 计算工龄分组
      const workAgeGroup = transformWorkAge(row.work_age_months);
      const educationGroup = transformEducation(row.education);
      const organizationRegion = transformRegion(row.region);
      
      console.log(`  - 工龄分组: ${workAgeGroup}`);
      console.log(`  - 学历分组: ${educationGroup}`);
      console.log(`  - 区域分组: ${organizationRegion}\n`);
      
      return {
        ...row,
        gender: row.gender === 'M' ? '男' : (row.gender === 'F' ? '女' : '其他'),
        region: row.region || '未知',
        department: row.department || '未知',
        position: row.position || '未知',
        education: row.education || '未知',
        education_method: row.education_method || '未知',
        political_status: row.political_status || '未知',
        marital_status: row.marital_status || '未知',
        hometown: row.hometown || '未知',
        employee_type: {1: '正式', 2: '试用', 3: '实习'}[row.employee_type] || '未知',
        insurance_type: {1: '社保', 2: '工伤'}[row.insurance_type] || '无',
        work_age_group: workAgeGroup,
        education_group: educationGroup,
        organization_region: organizationRegion
      };
    });

    console.log('===== 转换后的数据示例 =====');
    console.log(JSON.stringify(transformedRows[0], null, 2));

  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行测试
testRosterQuery();
