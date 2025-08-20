const express = require('express');
const router = express.Router();
const {
  transformWorkAge,
  transformEducation,
  transformRegion,
  calculateYearOverYear,
  calculateMonthOverMonth,
  getDateRange,
  getPreviousDateRange,
  getLastYearDateRange
} = require('../utils/dataTransform');

/**
 * 获取看板统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationRegion, region, department, year, month } = req.query;
    console.log('Dashboard stats request:', { organizationRegion, region, department, year, month });
    const pool = req.pool;

    // 构建查询条件
    let whereConditions = [];
    let params = [];

    // 暂时注释掉，因为字段不存在
    // if (organizationRegion) {
    //   whereConditions.push('organization_region = ?');
    //   params.push(organizationRegion);
    // }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取当前期数据
    const currentStats = await getCurrentStats(whereClause, params, pool, { department, year, month });
    
    // 获取对比期数据（环比和同比）
    let previousStats = null;
    let lastYearStats = null;
    
    if (year && month) {
      // 环比：上个月数据
      const prevDateRange = getPreviousDateRange(parseInt(year), parseInt(month));
      if (prevDateRange) {
        const prevParams = [...params.slice(0, -2), prevDateRange.start, prevDateRange.end];
        previousStats = await getCurrentStats(whereClause, prevParams, pool, { department, year: parseInt(year), month: parseInt(month) - 1 });
      }

      // 同比：去年同月数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year), parseInt(month));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(whereClause, lastYearParams, pool, { department, year: parseInt(year) - 1, month: parseInt(month) });
      }
    } else if (year) {
      // 同比：去年数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(whereClause, lastYearParams, pool, { department, year: parseInt(year) - 1, month });
      }
    }
    
    // 计算增长率
    const stats = {
      ...currentStats,
      growth: {
        monthOverMonth: previousStats ? {
          totalEmployees: calculateMonthOverMonth(currentStats.totalEmployees, previousStats.totalEmployees),
          newEmployees: calculateMonthOverMonth(currentStats.newEmployees, previousStats.newEmployees),
          resignedEmployees: calculateMonthOverMonth(currentStats.resignedEmployees, previousStats.resignedEmployees),
          transferEmployees: calculateMonthOverMonth(currentStats.transferEmployees, previousStats.transferEmployees)
        } : null,
        yearOverYear: lastYearStats ? {
          totalEmployees: calculateYearOverYear(currentStats.totalEmployees, lastYearStats.totalEmployees),
          newEmployees: calculateYearOverYear(currentStats.newEmployees, lastYearStats.newEmployees),
          resignedEmployees: calculateYearOverYear(currentStats.resignedEmployees, lastYearStats.resignedEmployees),
          transferEmployees: calculateYearOverYear(currentStats.transferEmployees, lastYearStats.transferEmployees)
        } : null
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取看板统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

/**
 * 获取当前统计数据
 */
async function getCurrentStats(whereClause, params, pool, { department, year, month }) {
  const connection = await pool.getConnection();
  
  try {
    // 在职员工数（完全受筛选条件影响）
    const [totalResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM employee_roster ${whereClause}`,
      params
    );
    
    // 新入职人数（当月或当年）
    let newResult;
    if (year && month) {
      // 如果指定了年月，只统计该月入职的员工
      const newEmployeeQuery = `SELECT COUNT(*) as count FROM employee_roster ${whereClause.replace('entry_date BETWEEN ? AND ?', 'YEAR(entry_date) = ? AND MONTH(entry_date) = ?')}`;
      const newParams = [...params.slice(0, -2), year, month];
      [newResult] = await connection.execute(newEmployeeQuery, newParams);
    } else if (year) {
      // 如果只指定了年，统计该年入职的员工
      const newEmployeeQuery = `SELECT COUNT(*) as count FROM employee_roster ${whereClause.replace('entry_date BETWEEN ? AND ?', 'YEAR(entry_date) = ?')}`;
      const newParams = [...params.slice(0, -2), year];
      [newResult] = await connection.execute(newEmployeeQuery, newParams);
    } else {
      // 如果没有指定时间，统计所有入职员工（等同于在职员工）
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster ${whereClause}`,
        params
      );
    }
    
    // 离职人数
    const resignedWhereClause = whereClause.replace('entry_date', 'resignation_date');
    const [resignedResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM resignation_monitoring ${resignedWhereClause}`,
      params
    );
    
    // 异动人数 - 简化查询，暂时只统计总数
    let transferResult;
    try {
      // 尝试查询异动表，如果表不存在或字段不存在则返回0
      if (department) {
        [transferResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM personnel_changes WHERE department = ?`,
          [department]
        );
      } else {
        [transferResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM personnel_changes`
        );
      }
    } catch (error) {
      console.log('Personnel changes table query failed, using 0:', error.message);
      transferResult = [{ count: 0 }];
    }
    
    const result = {
      totalEmployees: totalResult[0].count,
      newEmployees: newResult[0].count,
      resignedEmployees: resignedResult[0].count,
      transferEmployees: transferResult[0].count
    };

    console.log('Stats result:', result);
    return result;
  } finally {
    connection.release();
  }
}

/**
 * 获取工龄分布数据
 */
router.get('/work-age-distribution', async (req, res) => {
  try {
    const { organizationRegion, region, department, year, month } = req.query;
    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    // 暂时注释掉，因为字段不存在
    // if (organizationRegion) {
    //   whereConditions.push('organization_region = ?');
    //   params.push(organizationRegion);
    // }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    // 年/月时间范围（按入职日期 entry_date 过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT work_age_months FROM employee_roster ${whereClause}`,
        params
      );
      
      // 统计各工龄段人数
      const distribution = {
        '1年以下': 0,
        '1-2年': 0,
        '2-3年': 0,
        '3-4年': 0,
        '4-5年': 0,
        '5-6年': 0,
        '6-7年': 0,
        '7-8年': 0,
        '8-9年': 0,
        '9-10年': 0,
        '10年以上': 0
      };
      
      rows.forEach(row => {
        const workAgeGroup = transformWorkAge(row.work_age_months);
        if (workAgeGroup && distribution.hasOwnProperty(workAgeGroup)) {
          distribution[workAgeGroup]++;
        }
      });
      
      res.json(distribution);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取工龄分布数据失败:', error);
    res.status(500).json({ error: '获取工龄分布数据失败' });
  }
});

/**
 * 获取学历分布数据
 */
router.get('/education-distribution', async (req, res) => {
  try {
    const { organizationRegion, region, department, year, month } = req.query;
    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    // 暂时注释掉，因为字段不存在
    // if (organizationRegion) {
    //   whereConditions.push('organization_region = ?');
    //   params.push(organizationRegion);
    // }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    // 年/月时间范围（按入职日期 entry_date 过滤）
    const dateRange2 = getDateRange(year, month);
    if (dateRange2) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      params.push(dateRange2.start, dateRange2.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT education FROM employee_roster ${whereClause}`,
        params
      );

      // 统计各学历段人数
      const distribution = {
        '高中及以下': 0,
        '大专': 0,
        '本科': 0,
        '硕士及以上': 0,
        '其他': 0
      };

      rows.forEach(row => {
        const educationGroup = transformEducation(row.education);
        if (educationGroup && distribution.hasOwnProperty(educationGroup)) {
          distribution[educationGroup]++;
        }
      });

      res.json(distribution);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取学历分布数据失败:', error);
    res.status(500).json({ error: '获取学历分布数据失败' });
  }
});

/**
 * 获取各部门在职人数
 */
router.get('/department-stats', async (req, res) => {
  try {
    const { organizationRegion, region, year, month } = req.query;
    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    // 暂时注释掉，因为字段不存在
    // if (organizationRegion) {
    //   whereConditions.push('organization_region = ?');
    //   params.push(organizationRegion);
    // }

    if (region) {
      whereConditions.push('region = ?');
      params.push(region);
    }

    // 年/月时间范围（按入职日期 entry_date 过滤）
    const dateRange3 = getDateRange(year, month);
    if (dateRange3) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      params.push(dateRange3.start, dateRange3.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count FROM employee_roster ${whereClause} GROUP BY department ORDER BY count DESC`,
        params
      );

      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取部门统计数据失败:', error);
    res.status(500).json({ error: '获取部门统计数据失败' });
  }
});

/**
 * 获取筛选选项
 */
router.get('/filter-options', async (req, res) => {
  try {
    const pool = req.pool;
    const connection = await pool.getConnection();

    try {


      // 获取所有组织区域 - 暂时注释掉，因为字段不存在
      // const [orgRegions] = await connection.execute(
      //   'SELECT DISTINCT organization_region FROM employee_roster WHERE organization_region IS NOT NULL ORDER BY organization_region'
      // );
      const orgRegions = []; // 临时空数组

      // 获取所有区域
      const [regions] = await connection.execute(
        'SELECT DISTINCT region FROM employee_roster WHERE region IS NOT NULL ORDER BY region'
      );

      // 获取所有部门
      const [departments] = await connection.execute(
        'SELECT DISTINCT department FROM employee_roster WHERE department IS NOT NULL ORDER BY department'
      );

      // 获取年份范围
      const [years] = await connection.execute(
        'SELECT DISTINCT YEAR(entry_date) as year FROM employee_roster WHERE entry_date IS NOT NULL ORDER BY year DESC'
      );

      res.json({
        organizationRegions: [], // 暂时返回空数组
        regions: regions.map(row => row.region),
        departments: departments.map(row => row.department),
        years: years.map(row => row.year)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: '获取筛选选项失败', details: error.message });
  }
});

module.exports = router;
