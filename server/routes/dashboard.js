const express = require('express');
const router = express.Router();
const {
  transformWorkAge,
  transformEducation,
  reverseTransformEducation,
  transformRegion,
  calculateYearOverYear,
  calculateMonthOverMonth,
  getDateRange,
  getPreviousDateRange,
  getLastYearDateRange
} = require('../utils/dataTransform');

/**
 * 获取在职时间筛选条件
 */
function getTenureCondition(tenure) {
  switch (tenure) {
    case '1-3月':
      return { condition: 'DATEDIFF(resignation_date, entry_date) <= 90' };
    case '3-6月':
      return { condition: 'DATEDIFF(resignation_date, entry_date) > 90 AND DATEDIFF(resignation_date, entry_date) <= 180' };
    case '6-12月':
      return { condition: 'DATEDIFF(resignation_date, entry_date) > 180 AND DATEDIFF(resignation_date, entry_date) <= 365' };
    case '1年以上':
      return { condition: 'DATEDIFF(resignation_date, entry_date) > 365' };
    default:
      return null;
  }
}

/**
 * 获取看板统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationRegion, region, department, workAge, education, year, month } = req.query;
    console.log('Dashboard stats request:', { organizationRegion, region, department, workAge, education, year, month });
    console.log('Education filter value:', education);
    const pool = req.pool;

    // 构建查询条件
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

    if (workAge) {
      // 计算工龄月份范围
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) >= ? AND TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      // 使用反向转换函数获取数据库中的实际学历值
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`se.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('epi.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取当前期数据
    const currentStats = await getCurrentStats(whereClause, params, pool, { department, workAge, education, year, month });

    // 获取对比期数据（环比和同比）
    let previousStats = null;
    let lastYearStats = null;

    if (year && month) {
      // 环比：上个月数据
      const prevDateRange = getPreviousDateRange(parseInt(year), parseInt(month));
      if (prevDateRange) {
        const prevParams = [...params.slice(0, -2), prevDateRange.start, prevDateRange.end];
        previousStats = await getCurrentStats(whereClause, prevParams, pool, { department, workAge, education, year: parseInt(year), month: parseInt(month) - 1 });
      }

      // 同比：去年同月数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year), parseInt(month));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(whereClause, lastYearParams, pool, { department, workAge, education, year: parseInt(year) - 1, month: parseInt(month) });
      }
    } else if (year) {
      // 同比：去年数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(whereClause, lastYearParams, pool, { department, workAge, education, year: parseInt(year) - 1, month });
      }
    }

    // 计算比率
    const calculateRates = (stats) => {
      const total = stats.totalEmployees || 1; // 避免除零
      return {
        changeRate: ((stats.resignedEmployees + stats.transferEmployees) / total * 100),
        newEmployeeRate: (stats.newEmployees / total * 100),
        resignationRate: (stats.resignedEmployees / total * 100)
      };
    };

    const currentRates = calculateRates(currentStats);
    const previousRates = previousStats ? calculateRates(previousStats) : null;
    const lastYearRates = lastYearStats ? calculateRates(lastYearStats) : null;

    // 计算增长率
    const stats = {
      ...currentStats,
      growth: {
        monthOverMonth: previousStats ? {
          totalEmployees: calculateMonthOverMonth(currentStats.totalEmployees, previousStats.totalEmployees),
          newEmployees: calculateMonthOverMonth(currentStats.newEmployees, previousStats.newEmployees),
          resignedEmployees: calculateMonthOverMonth(currentStats.resignedEmployees, previousStats.resignedEmployees),
          transferEmployees: calculateMonthOverMonth(currentStats.transferEmployees, previousStats.transferEmployees),
          changeRate: calculateMonthOverMonth(currentRates.changeRate, previousRates.changeRate),
          newEmployeeRate: calculateMonthOverMonth(currentRates.newEmployeeRate, previousRates.newEmployeeRate),
          resignationRate: calculateMonthOverMonth(currentRates.resignationRate, previousRates.resignationRate)
        } : null,
        yearOverYear: lastYearStats ? {
          totalEmployees: calculateYearOverYear(currentStats.totalEmployees, lastYearStats.totalEmployees),
          newEmployees: calculateYearOverYear(currentStats.newEmployees, lastYearStats.newEmployees),
          resignedEmployees: calculateYearOverYear(currentStats.resignedEmployees, lastYearStats.resignedEmployees),
          transferEmployees: calculateYearOverYear(currentStats.transferEmployees, lastYearStats.transferEmployees),
          changeRate: calculateYearOverYear(currentRates.changeRate, lastYearRates.changeRate),
          newEmployeeRate: calculateYearOverYear(currentRates.newEmployeeRate, lastYearRates.newEmployeeRate),
          resignationRate: calculateYearOverYear(currentRates.resignationRate, lastYearRates.resignationRate)
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
async function getCurrentStats(whereClause, params, pool, { department, workAge, education, year, month }) {
  const connection = await pool.getConnection();

  try {
    // 在职员工数（没有离职记录的员工）
    const [totalResult] = await connection.execute(
      `SELECT COUNT(*) as count
       FROM employee_basic_info ebi
       JOIN employee_position_info epi ON ebi.id = epi.employee_id
       LEFT JOIN sys_region sr ON epi.region_id = sr.id
       LEFT JOIN sys_department sd ON epi.department_id = sd.id
       LEFT JOIN sys_position sp ON epi.position_id = sp.id
       LEFT JOIN sys_education se ON ebi.education_id = se.id
       LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
       ${whereClause} AND eri.id IS NULL`,
      params
    );

    // 新入职人数（当月或当年）
    let newResult;
    if (year && month) {
      // 如果指定了年月，只统计该月入职的员工
      const newEmployeeQuery = `SELECT COUNT(*) as count
        FROM employee_basic_info ebi
        JOIN employee_position_info epi ON ebi.id = epi.employee_id
        LEFT JOIN sys_region sr ON epi.region_id = sr.id
        LEFT JOIN sys_department sd ON epi.department_id = sd.id
        LEFT JOIN sys_position sp ON epi.position_id = sp.id
        LEFT JOIN sys_education se ON ebi.education_id = se.id
        ${whereClause.replace('epi.entry_date BETWEEN ? AND ?', 'YEAR(epi.entry_date) = ? AND MONTH(epi.entry_date) = ?')}`;
      const newParams = [...params.slice(0, -2), year, month];
      [newResult] = await connection.execute(newEmployeeQuery, newParams);
    } else if (year) {
      // 如果只指定了年，统计该年入职的员工
      const newEmployeeQuery = `SELECT COUNT(*) as count
        FROM employee_basic_info ebi
        JOIN employee_position_info epi ON ebi.id = epi.employee_id
        LEFT JOIN sys_region sr ON epi.region_id = sr.id
        LEFT JOIN sys_department sd ON epi.department_id = sd.id
        LEFT JOIN sys_position sp ON epi.position_id = sp.id
        LEFT JOIN sys_education se ON ebi.education_id = se.id
        ${whereClause.replace('epi.entry_date BETWEEN ? AND ?', 'YEAR(epi.entry_date) = ?')}`;
      const newParams = [...params.slice(0, -2), year];
      [newResult] = await connection.execute(newEmployeeQuery, newParams);
    } else {
      // 如果没有指定时间，统计所有入职员工（等同于在职员工）
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         ${whereClause} AND eri.id IS NULL`,
        params
      );
    }

    // 离职人数
    const resignedWhereClause = whereClause.replace('epi.entry_date', 'eri.resignation_date');
    const [resignedResult] = await connection.execute(
      `SELECT COUNT(*) as count
       FROM employee_basic_info ebi
       JOIN employee_position_info epi ON ebi.id = epi.employee_id
       JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
       LEFT JOIN sys_region sr ON epi.region_id = sr.id
       LEFT JOIN sys_department sd ON epi.department_id = sd.id
       LEFT JOIN sys_position sp ON epi.position_id = sp.id
       LEFT JOIN sys_education se ON ebi.education_id = se.id
       ${resignedWhereClause}`,
      params
    );

    // 异动人数 - 暂时返回0，因为新数据库结构中没有异动表
    const transferResult = [{ count: 0 }];

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
    const { region, department, workAge, education, year, month } = req.query;
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

    if (workAge) {
      // 将司龄显示值转换为月份范围查询
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) >= ? AND TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`se.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 年/月时间范围（按入职日期过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('epi.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) as work_age_months
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         ${whereClause}`,
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
    const { region, department, workAge, education, year, month } = req.query;
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

    if (workAge) {
      // 将司龄显示值转换为月份范围查询
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) >= ? AND TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      // 使用反向转换函数获取数据库中的实际学历值
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`se.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 年/月时间范围（按入职日期过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('epi.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT se.education
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         ${whereClause}`,
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
    const { region, department, workAge, education, year, month } = req.query;
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

    if (workAge) {
      // 将司龄显示值转换为月份范围查询
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) >= ? AND TIMESTAMPDIFF(MONTH, epi.entry_date, COALESCE(eri.resignation_date, CURDATE())) < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`se.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 年/月时间范围（按入职日期过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('epi.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 只统计在职员工（没有离职记录）
    whereConditions.push('eri.id IS NULL');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT sd.department, COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         LEFT JOIN sys_education se ON ebi.education_id = se.id
         LEFT JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         ${whereClause}
         GROUP BY sd.department
         ORDER BY count DESC`,
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
  console.log('获取筛选选项请求开始');
  let connection;

  try {
    const pool = req.pool;
    console.log('开始获取数据库连接...');

    connection = await pool.getConnection();
    console.log('数据库连接获取成功，开始查询筛选选项');

    // 获取所有区域 - 使用容错查询，返回正确的对象格式
    console.log('查询区域选项...');
    let regions = [];
    try {
      const [rows] = await connection.execute(
        'SELECT DISTINCT region as region, region as id FROM sys_region WHERE region IS NOT NULL AND region != "" ORDER BY region'
      );
      regions = rows;
    } catch (error) {
      console.log('sys_region表不存在，从employee_position_info查询区域');
      const [rows] = await connection.execute(
        'SELECT DISTINCT region as region, region as id FROM employee_position_info WHERE region IS NOT NULL AND region != "" ORDER BY region'
      );
      regions = rows;
    }
    console.log('区域查询完成，结果数量:', regions.length);

    // 获取所有部门 - 使用容错查询，返回正确的对象格式
    console.log('查询部门选项...');
    let departments = [];
    try {
      const [rows] = await connection.execute(
        'SELECT DISTINCT department as department, department as id FROM sys_department WHERE department IS NOT NULL AND department != "" ORDER BY department'
      );
      departments = rows;
    } catch (error) {
      console.log('sys_department表不存在，从employee_position_info查询部门');
      const [rows] = await connection.execute(
        'SELECT DISTINCT department as department, department as id FROM employee_position_info WHERE department IS NOT NULL AND department != "" ORDER BY department'
      );
      departments = rows;
    }
    console.log('部门查询完成，结果数量:', departments.length);

    // 获取年份范围
    console.log('查询年份选项...');
    const [years] = await connection.execute(
      'SELECT DISTINCT YEAR(entry_date) as year FROM employee_position_info WHERE entry_date IS NOT NULL ORDER BY year DESC'
    );
    console.log('年份查询完成，结果数量:', years.length);

    const result = {
      organizationRegions: [], // 暂时返回空数组
      regions: regions.map(row => ({ id: row.region, region: row.region })),
      departments: departments.map(row => ({ id: row.department, department: row.department })),
      years: years.map(row => row.year)
    };

    console.log('筛选选项查询成功，返回结果:', result);
    res.json(result);
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: '获取筛选选项失败', details: error.message });
  } finally {
    if (connection) {
      connection.release();
      console.log('数据库连接已释放');
    }
  }
});

/**
 * 将司龄显示值转换为月份范围
 */
function getWorkAgeMonthsRange(workAgeDisplay) {
  switch (workAgeDisplay) {
    case '1年以下':
      return { min: 0, max: 12 };
    case '1-2年':
      return { min: 12, max: 24 };
    case '2-3年':
      return { min: 24, max: 36 };
    case '3-4年':
      return { min: 36, max: 48 };
    case '4-5年':
      return { min: 48, max: 60 };
    case '5-6年':
      return { min: 60, max: 72 };
    case '6-7年':
      return { min: 72, max: 84 };
    case '7-8年':
      return { min: 84, max: 96 };
    case '8-9年':
      return { min: 96, max: 108 };
    case '9-10年':
      return { min: 108, max: 120 };
    case '10年以上':
      return { min: 120, max: 9999 };
    default:
      return null;
  }
}

/**
 * 获取人才流失统计数据
 */
router.get('/turnover-stats', async (req, res) => {
  try {
    const { region, department, year, month, reason, position, tenure } = req.query;
    const pool = req.pool;

    // 构建查询条件
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

    if (reason) {
      whereConditions.push('eri.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('sp.position = ?');
      params.push(position);
    }

    // 处理在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 90 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 180 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 365');
          break;
      }
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      // 获取总离职人数
      const [totalResignedResult] = await connection.execute(
        `SELECT COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}`,
        params
      );

      // 获取总员工数（在职+离职）
      const [totalEmployeesResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM employee_basic_info`
      );

      const totalResigned = totalResignedResult[0].count;
      const totalEmployees = totalEmployeesResult[0].total;
      const turnoverRate = totalEmployees > 0 ? (totalResigned / totalEmployees * 100) : 0;

      // 获取对比期数据用于计算同环比
      let previousStats = null;
      let lastYearStats = null;

      if (year && month) {
        // 环比：上个月数据
        const prevDateRange = getPreviousDateRange(parseInt(year), parseInt(month));
        if (prevDateRange) {
          const prevParams = [...params.slice(0, -2), prevDateRange.start, prevDateRange.end];
          const [prevResult] = await connection.execute(
            `SELECT COUNT(*) as count
             FROM employee_basic_info ebi
             JOIN employee_position_info epi ON ebi.id = epi.employee_id
             JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
             LEFT JOIN sys_region sr ON epi.region_id = sr.id
             LEFT JOIN sys_department sd ON epi.department_id = sd.id
             LEFT JOIN sys_position sp ON epi.position_id = sp.id
             ${whereClause}`,
            prevParams
          );
          previousStats = { totalResigned: prevResult[0].count };
        }

        // 同比：去年同月数据
        const lastYearDateRange = getLastYearDateRange(parseInt(year), parseInt(month));
        if (lastYearDateRange) {
          const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
          const [lastYearResult] = await connection.execute(
            `SELECT COUNT(*) as count
             FROM employee_basic_info ebi
             JOIN employee_position_info epi ON ebi.id = epi.employee_id
             JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
             LEFT JOIN sys_region sr ON epi.region_id = sr.id
             LEFT JOIN sys_department sd ON epi.department_id = sd.id
             LEFT JOIN sys_position sp ON epi.position_id = sp.id
             ${whereClause}`,
            lastYearParams
          );
          lastYearStats = { totalResigned: lastYearResult[0].count };
        }
      }

      const result = {
        totalResigned,
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
        growth: {
          monthOverMonth: previousStats ? {
            totalResigned: calculateMonthOverMonth(totalResigned, previousStats.totalResigned),
            turnoverRate: calculateMonthOverMonth(turnoverRate, previousStats.totalResigned / totalEmployees * 100)
          } : null,
          yearOverYear: lastYearStats ? {
            totalResigned: calculateYearOverYear(totalResigned, lastYearStats.totalResigned),
            turnoverRate: calculateYearOverYear(turnoverRate, lastYearStats.totalResigned / totalEmployees * 100)
          } : null
        }
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取人才流失统计数据失败:', error);
    res.status(500).json({ error: '获取人才流失统计数据失败' });
  }
});

/**
 * 获取离职部门分布（前5名）
 */
router.get('/turnover-department-distribution', async (req, res) => {
  try {
    const { region, department, year, month, reason, position, tenure } = req.query;
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

    if (reason) {
      whereConditions.push('eri.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('sp.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 90 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 180 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT sd.department, COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}
         GROUP BY sd.department
         ORDER BY count DESC
         LIMIT 5`,
        params
      );

      const result = {
        labels: rows.map(row => row.department),
        values: rows.map(row => row.count)
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职部门分布失败:', error);
    res.status(500).json({ error: '获取离职部门分布失败' });
  }
});

/**
 * 获取离职原因分析
 */
router.get('/turnover-reason-analysis', async (req, res) => {
  try {
    const { region, department, year, month, position, tenure } = req.query;
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

    if (position) {
      whereConditions.push('sp.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 90 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 180 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加离职原因不为空的条件
    whereConditions.push('eri.resignation_reason IS NOT NULL AND eri.resignation_reason != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT eri.resignation_reason, COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}
         GROUP BY eri.resignation_reason
         ORDER BY count DESC`,
        params
      );

      const result = {
        labels: rows.map(row => row.resignation_reason),
        values: rows.map(row => row.count)
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职原因分析失败:', error);
    res.status(500).json({ error: '获取离职原因分析失败' });
  }
});

/**
 * 获取离职人员部门统计
 */
router.get('/turnover-department-stats', async (req, res) => {
  try {
    const { region, department, year, month, reason, position, tenure } = req.query;
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

    if (reason) {
      whereConditions.push('eri.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('sp.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 90 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 180 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT sd.department, COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}
         GROUP BY sd.department
         ORDER BY count DESC`,
        params
      );

      const result = {
        labels: rows.map(row => row.department),
        values: rows.map(row => row.count)
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职人员部门统计失败:', error);
    res.status(500).json({ error: '获取离职人员部门统计失败' });
  }
});

/**
 * 获取离职岗位分布
 */
router.get('/turnover-position-distribution', async (req, res) => {
  try {
    const { region, department, year, month, reason, tenure } = req.query;
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

    if (reason) {
      whereConditions.push('eri.resignation_reason = ?');
      params.push(reason);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 90 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 180 AND DATEDIFF(eri.resignation_date, epi.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(eri.resignation_date, epi.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加岗位不为空的条件
    whereConditions.push('sp.position IS NOT NULL AND sp.position != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT sp.position, COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}
         GROUP BY sp.position
         ORDER BY count DESC`,
        params
      );

      const result = {
        labels: rows.map(row => row.position),
        values: rows.map(row => row.count)
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职岗位分布失败:', error);
    res.status(500).json({ error: '获取离职岗位分布失败' });
  }
});

/**
 * 获取离职人员在职时间分布
 */
router.get('/turnover-tenure-distribution', async (req, res) => {
  try {
    const { region, department, year, month, reason, position } = req.query;
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

    if (reason) {
      whereConditions.push('eri.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('sp.position = ?');
      params.push(position);
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('eri.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加必要字段不为空的条件
    whereConditions.push('epi.entry_date IS NOT NULL AND eri.resignation_date IS NOT NULL');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT
          CASE
            WHEN DATEDIFF(eri.resignation_date, epi.entry_date) <= 90 THEN '1-3月'
            WHEN DATEDIFF(eri.resignation_date, epi.entry_date) <= 180 THEN '3-6月'
            WHEN DATEDIFF(eri.resignation_date, epi.entry_date) <= 365 THEN '6-12月'
            ELSE '1年以上'
          END as tenure_range,
          COUNT(*) as count
         FROM employee_basic_info ebi
         JOIN employee_position_info epi ON ebi.id = epi.employee_id
         JOIN employee_resignation_info eri ON ebi.id = eri.employee_id
         LEFT JOIN sys_region sr ON epi.region_id = sr.id
         LEFT JOIN sys_department sd ON epi.department_id = sd.id
         LEFT JOIN sys_position sp ON epi.position_id = sp.id
         ${whereClause}
         GROUP BY tenure_range
         ORDER BY
           CASE tenure_range
             WHEN '1-3月' THEN 1
             WHEN '3-6月' THEN 2
             WHEN '6-12月' THEN 3
             WHEN '1年以上' THEN 4
           END`,
        params
      );

      const result = {
        labels: rows.map(row => row.tenure_range),
        values: rows.map(row => row.count)
      };

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取离职人员在职时间分布失败:', error);
    res.status(500).json({ error: '获取离职人员在职时间分布失败' });
  }
});

module.exports = router;
