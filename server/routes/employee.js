const express = require('express');
const router = express.Router();
const { transformWorkAge, transformEducation, transformRegion } = require('../utils/dataTransform');

/**
 * 获取员工花名册列表
 */
router.get('/roster', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      region,
      department,
      name,
      position
    } = req.query;

    console.log('收到员工花名册请求:', { page, pageSize, region, department, name, position });

    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (region) {
      whereConditions.push('sr.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('sd.department = ?');
      params.push(department);
    }

    if (name) {
      whereConditions.push('ebi.name LIKE ?');
      params.push(`%${name}%`);
    }

    if (position) {
      whereConditions.push('sp.position LIKE ?');
      params.push(`%${position}%`);
    }

    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '';

    const connection = await pool.getConnection();

    try {
      // 先测试简单查询
      console.log('开始执行数据库查询...');

      // 获取总数 - 简化查询
      const countSql = `SELECT COUNT(*) as total FROM employee_basic_info ebi JOIN employee_position_info epi ON ebi.id = epi.employee_id`;
      const [countResult] = await connection.execute(countSql);
      const total = countResult[0].total;
      console.log('总记录数:', total);

      // 获取分页数据 - 简化查询
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT
          ebi.id, ebi.name, ebi.gender, ebi.birth_date,
          sr.region, sd.department, sp.position,
          epi.entry_date, epi.employee_type
        FROM employee_basic_info ebi
        JOIN employee_position_info epi ON ebi.id = epi.employee_id
        LEFT JOIN sys_region sr ON epi.region_id = sr.id
        LEFT JOIN sys_department sd ON epi.department_id = sd.id
        LEFT JOIN sys_position sp ON epi.position_id = sp.id
        ORDER BY epi.entry_date DESC
        LIMIT ? OFFSET ?
      `;

      console.log('执行查询SQL:', dataSql);
      console.log('查询参数:', [parseInt(pageSize), parseInt(offset)]);

      const [rows] = await connection.execute(dataSql, [parseInt(pageSize), parseInt(offset)]);

      console.log('数据库查询结果:', rows.length, '条记录');

      // 转换数据 - 简化版本
      const transformedRows = rows.map((row, index) => {
        console.log(`处理第 ${index + 1} 行:`, row.name);
        return {
          ...row,
          gender: row.gender === 'M' ? '男' : (row.gender === 'F' ? '女' : '其他'),
          region: row.region || '未知',
          department: row.department || '未知',
          position: row.position || '未知',
          employee_type: {1: '正式', 2: '试用', 3: '实习'}[row.employee_type] || '未知',
          // 添加一些默认值以满足前端需求
          hometown: '未知',
          political_status: '未知',
          education: '未知',
          education_method: '未知',
          marital_status: '未知',
          insurance_type: '无',
          work_age_group: '1年以下',
          education_group: '本科',
          organization_region: row.region || '未知'
        };
      });

      console.log('数据处理完成，返回结果');

      res.json({
        data: transformedRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取员工花名册失败:', error);
    res.status(500).json({ error: '获取员工花名册失败', message: error.message });
  }
});

/**
 * 获取离职监控列表
 */
router.get('/resignation', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      region,
      department,
      name,
      resignationType
    } = req.query;

    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (region) {
      whereConditions.push('sr.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('sd.department = ?');
      params.push(department);
    }

    if (name) {
      whereConditions.push('ebi.name LIKE ?');
      params.push(`%${name}%`);
    }

    if (resignationType) {
      whereConditions.push('srt.resign_type = ?');
      params.push(resignationType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      // 获取总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN sys_resign_type srt ON eri.resignation_type_id = srt.id
         ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const [rows] = await connection.execute(
        `SELECT
           ebi.id,
           ebi.name,
           CASE ebi.gender
             WHEN 'M' THEN '男'
             WHEN 'F' THEN '女'
             ELSE '其他'
           END as gender,
           ebi.birth_date,
           ebi.native_place as hometown,
           sr.region,
           sd.department,
           sp.position,
           CASE epi.employee_type
             WHEN 1 THEN '正式'
             WHEN 2 THEN '试用'
             WHEN 3 THEN '实习'
             ELSE '未知'
           END as employee_type,
           epi.entry_date,
           eri.resignation_date,
           srt.resign_type as resignation_type,
           eri.resignation_reason,
           se.education,
           TIMESTAMPDIFF(MONTH, epi.entry_date, eri.resignation_date) as work_age_months,
           TIMESTAMPDIFF(YEAR, ebi.birth_date, CURDATE()) as age
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN sys_resign_type srt ON eri.resignation_type_id = srt.id
         ${whereClause}
         ORDER BY eri.resignation_date DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );

      // 转换数据
      const transformedRows = rows.map(row => ({
        ...row,
        work_age_group: transformWorkAge(row.work_age_months),
        education_group: transformEducation(row.education),
        organization_region: transformRegion(row.region)
      }));

      res.json({
        data: transformedRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职监控数据失败:', error);
    res.status(500).json({ error: '获取离职监控数据失败' });
  }
});

/**
 * 获取人员异动明细
 * 注意：新数据库结构中暂时没有异动表，返回空数据
 */
router.get('/changes', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20
    } = req.query;

    // 新数据库结构中暂时没有异动表，返回空数据
    res.json({
      data: [],
      total: 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: 0
    });
  } catch (error) {
    console.error('获取人员异动数据失败:', error);
    res.status(500).json({ error: '获取人员异动数据失败' });
  }
});

module.exports = router;
