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
      organizationRegion,
      region,
      department,
      name,
      position
    } = req.query;

    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (organizationRegion) {
      whereConditions.push('organization_region = ?');
      params.push(organizationRegion);
    }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    if (name) {
      whereConditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }

    if (position) {
      whereConditions.push('position LIKE ?');
      params.push(`%${position}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();
    
    try {
      // 获取总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM employee_roster ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const [rows] = await connection.execute(
        `SELECT * FROM employee_roster ${whereClause} ORDER BY entry_date DESC LIMIT ? OFFSET ?`,
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
    console.error('获取员工花名册失败:', error);
    res.status(500).json({ error: '获取员工花名册失败' });
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
      organizationRegion,
      region,
      department,
      name,
      resignationType
    } = req.query;

    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (organizationRegion) {
      whereConditions.push('organization_region = ?');
      params.push(organizationRegion);
    }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    if (name) {
      whereConditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }

    if (resignationType) {
      whereConditions.push('resignation_type = ?');
      params.push(resignationType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();
    
    try {
      // 获取总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM resignation_monitoring ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const [rows] = await connection.execute(
        `SELECT * FROM resignation_monitoring ${whereClause} ORDER BY resignation_date DESC LIMIT ? OFFSET ?`,
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
 */
router.get('/changes', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      department,
      name,
      changeType
    } = req.query;

    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    if (name) {
      whereConditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }

    if (changeType) {
      whereConditions.push('change_reason LIKE ?');
      params.push(`%${changeType}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();
    
    try {
      // 获取总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM personnel_changes ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      
      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const [rows] = await connection.execute(
        `SELECT * FROM personnel_changes ${whereClause} ORDER BY transfer_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      res.json({
        data: rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取人员异动数据失败:', error);
    res.status(500).json({ error: '获取人员异动数据失败' });
  }
});

module.exports = router;
