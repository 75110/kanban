const express = require('express');
const router = express.Router();

// 获取员工档案信息（四表联查）
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名参数不能为空' 
      });
    }

    const connection = await req.pool.getConnection();

    // 四表联查SQL
    const query = `
      SELECT 
        -- 员工花名册基础信息
        er.sequence_number,
        er.region,
        er.department,
        er.position,
        er.name,
        er.gender,
        er.ethnicity,
        er.political_status,
        er.employee_type as \`rank\`,
        er.insurance_type as contract_type,
        er.birth_date,
        er.birthday,
        er.entry_date,
        er.actual_regularization_date,
        er.remarks,
        er.contract_end_date,
        er.work_age_months as work_years,
        er.id_card_number,
        er.id_card_address,
        er.age,
        er.hometown as household_registration,
        er.personal_contact as phone,
        NULL as team,
        NULL as job_title,
        NULL as education_start_date,
        er.graduation_date as education_end_date,
        er.graduation_school as education_school,
        er.major as education_major,
        er.education as education_degree,
        er.entry_date as work_start_date,
        er.contract_end_date as work_end_date,
        '当前公司' as work_company,
        er.department as work_department,
        er.position as work_position,
        er.emergency_contact_name,
        er.emergency_contact_phone,
        er.bank_card_number,
        er.bank_branch_info,
        er.labor_relation_affiliation,
        er.social_insurance_affiliation,
        er.non_compete_agreement,
        er.confidentiality_agreement,
        er.remarks1,
        er.remarks2,
        
        -- 离职监控信息
        rm.resignation_date,
        rm.resignation_type,
        rm.resignation_reason,
        rm.resignation_remarks,
        
        -- 人员异动信息
        pc.original_position,
        pc.new_position,
        pc.change_date,
        pc.change_reason,
        pc.remarks as change_remarks,
        
        -- 获奖信息
        ea.award_year,
        ea.award_date,
        ea.award_month,
        ea.award_name,
        ea.award_amount,
        ea.remarks as award_remarks
        
      FROM employee_roster er
      LEFT JOIN resignation_monitoring rm ON er.name = rm.name
      LEFT JOIN personnel_changes pc ON er.name = pc.name
      LEFT JOIN employee_awards ea ON er.name COLLATE utf8mb4_unicode_ci = ea.name
      WHERE er.name = ?
      ORDER BY ea.award_date DESC, pc.change_date DESC
    `;

    const [rows] = await connection.execute(query, [name]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该员工信息' 
      });
    }

    // 数据聚合处理
    const employeeData = {
      basicInfo: rows[0], // 基础信息（取第一条记录）
      awards: [], // 获奖记录
      changes: [] // 异动记录
    };

    // 处理获奖记录
    const awardMap = new Map();
    rows.forEach(row => {
      if (row.award_name) {
        // 使用获奖名称+年份+日期作为唯一键，避免重复
        const awardKey = `${row.award_name}_${row.award_year}_${row.award_date}`;
        if (!awardMap.has(awardKey)) {
          awardMap.set(awardKey, {
            award_year: row.award_year,
            award_date: row.award_date,
            award_month: row.award_month,
            award_name: row.award_name,
            award_amount: row.award_amount,
            remarks: row.award_remarks
          });
        }
      }
    });
    employeeData.awards = Array.from(awardMap.values());

    // 处理异动记录
    const changeMap = new Map();
    rows.forEach(row => {
      if (row.original_position && !changeMap.has(`${row.change_date}_${row.original_position}`)) {
        changeMap.set(`${row.change_date}_${row.original_position}`, {
          original_position: row.original_position,
          new_position: row.new_position,
          change_date: row.change_date,
          change_reason: row.change_reason,
          remarks: row.change_remarks
        });
      }
    });
    employeeData.changes = Array.from(changeMap.values());

    res.json({
      success: true,
      data: employeeData
    });

  } catch (error) {
    console.error('获取员工档案信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: error.message 
    });
  }
});

// 获取员工列表（用于搜索下拉框）
router.get('/search/list', async (req, res) => {
  try {
    const connection = await req.pool.getConnection();
    
    const query = `
      SELECT DISTINCT name, department, position, personal_contact as phone, sequence_number as employee_id
      FROM employee_roster 
      WHERE name IS NOT NULL AND name != ''
      ORDER BY name
    `;
    
    const [rows] = await connection.execute(query);
    connection.release();
    
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: error.message 
    });
  }
});

// 获取统计数据（用于侧边栏）
router.get('/stats/overview', async (req, res) => {
  try {
    const connection = await req.pool.getConnection();
    
    // 获取各部门员工数量
    const deptQuery = `
      SELECT department, COUNT(*) as count 
      FROM employee_roster 
      WHERE department IS NOT NULL 
      GROUP BY department 
      ORDER BY count DESC
    `;
    
    // 获取年龄分布
    const ageQuery = `
      SELECT 
        CASE 
          WHEN age < 25 THEN '25岁以下'
          WHEN age BETWEEN 25 AND 30 THEN '25-30岁'
          WHEN age BETWEEN 31 AND 35 THEN '31-35岁'
          WHEN age BETWEEN 36 AND 40 THEN '36-40岁'
          WHEN age BETWEEN 41 AND 45 THEN '41-45岁'
          WHEN age BETWEEN 46 AND 50 THEN '46-50岁'
          WHEN age > 50 THEN '50岁以上'
          ELSE '未知'
        END as age_group,
        COUNT(*) as count
      FROM employee_roster 
      WHERE age IS NOT NULL 
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '25岁以下' THEN 1
          WHEN '25-30岁' THEN 2
          WHEN '31-35岁' THEN 3
          WHEN '36-40岁' THEN 4
          WHEN '41-45岁' THEN 5
          WHEN '46-50岁' THEN 6
          WHEN '50岁以上' THEN 7
          ELSE 8
        END
    `;
    
    // 获取学历分布
    const educationQuery = `
      SELECT education, COUNT(*) as count 
      FROM employee_roster 
      WHERE education IS NOT NULL AND education != ''
      GROUP BY education 
      ORDER BY count DESC
    `;
    
    // 获取岗位分布
    const positionQuery = `
      SELECT position, COUNT(*) as count 
      FROM employee_roster 
      WHERE position IS NOT NULL AND position != ''
      GROUP BY position 
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const [deptStats] = await connection.execute(deptQuery);
    const [ageStats] = await connection.execute(ageQuery);
    const [educationStats] = await connection.execute(educationQuery);
    const [positionStats] = await connection.execute(positionQuery);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        departmentStats: deptStats,
        ageStats: ageStats,
        educationStats: educationStats,
        positionStats: positionStats
      }
    });
    
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: error.message 
    });
  }
});

module.exports = router;