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

// 组织区域到具体区域的映射
const ORG_REGION_MAP = {
  '华东': ['总部', '杭州', '上海', '宁波', '义乌'],
  '华北': ['合肥'],
  '华南': ['中山', '厦门', '广州', '泉州', '深圳']
}

function toRegionList(orgRegion) {
  const key = typeof orgRegion === 'object' && orgRegion?.id ? orgRegion.id : orgRegion
  return ORG_REGION_MAP[key] || []
}

// 获取工龄月份范围的辅助函数
function getWorkAgeMonthsRange(workAge) {
  const ranges = {
    '1年以下': { min: 0, max: 12 },
    '1-2年': { min: 12, max: 24 },
    '2-3年': { min: 24, max: 36 },
    '3-4年': { min: 36, max: 48 },
    '4-5年': { min: 48, max: 60 },
    '5-6年': { min: 60, max: 72 },
    '6-7年': { min: 72, max: 84 },
    '7-8年': { min: 84, max: 96 },
    '8-9年': { min: 96, max: 108 },
    '9-10年': { min: 108, max: 120 },
    '10年以上': { min: 120, max: 999999 }
  };
  return ranges[workAge] || null;
}

// 构建 where 子句（按表别名）
function buildWhere(alias, { organizationRegion, region, department, workAge, education, year, month, dateField }) {
  const conditions = []
  const params = []

  // 组织区域／区域 - 只对有region字段的表生效
  if (alias !== 'pc') { // personnel_changes表没有region字段，跳过区域筛选
    if (organizationRegion && region) {
      // 同时选择了组织区域和具体区域，取交集
      const orgList = toRegionList(organizationRegion)
      if (orgList.includes(region)) {
        // 具体区域属于组织区域，只筛选具体区域
        conditions.push(`${alias}.region = ?`)
        params.push(region)
      } else {
        // 具体区域不属于组织区域，返回空结果
        conditions.push(`${alias}.region = ?`)
        params.push('__NO_MATCH__')
      }
    } else if (organizationRegion) {
      // 只选择了组织区域
      const list = toRegionList(organizationRegion)
      if (list.length) {
        conditions.push(`${alias}.region IN (${list.map(() => '?').join(',')})`)
        params.push(...list)
      }
    } else if (region) {
      // 只选择了具体区域
      conditions.push(`${alias}.region = ?`)
      params.push(region)
    }
  }

  // 部门
  if (department) {
    conditions.push(`${alias}.department = ?`)
    params.push(department)
  }

  // 工龄 - 只对有work_age_months字段的表生效
  if (workAge && alias !== 'pc') { // personnel_changes表没有work_age_months字段
    const range = getWorkAgeMonthsRange(workAge)
    if (range) {
      conditions.push(`${alias}.work_age_months >= ? AND ${alias}.work_age_months < ?`)
      params.push(range.min, range.max)
    }
  }

  // 学历 - 只对有education字段的表生效
  if (education && alias !== 'pc') { // personnel_changes表没有education字段
    const values = reverseTransformEducation(education)
    if (values.length) {
      conditions.push(`${alias}.education IN (${values.map(() => '?').join(',')})`)
      params.push(...values)
    }
  }

  // 日期
  const dr = getDateRange(year, month)
  if (dr) {
    const field = dateField || 'entry_date'
    conditions.push(`${alias}.${field} BETWEEN ? AND ?`)
    params.push(dr.start, dr.end)
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params }
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

    if (organizationRegion) {
      // 处理组织区域参数（可能是字符串或对象）
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      // 根据组织区域筛选对应的具体区域
      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌'];
      } else if (orgRegionValue === '华北') {
        regionList = ['合肥'];
      } else if (orgRegionValue === '华南') {
        // 获取所有不属于华东和华北的区域
        regionList = ['中山', '厦门', '广州', '泉州', '深圳']; // 根据实际数据调整
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        whereConditions.push(`er.region IN (${placeholders})`);
        params.push(...regionList);
      }
    } else if (region) {
      whereConditions.push('er.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('er.department = ?');
      params.push(department);
    }

    if (workAge) {
      // 计算工龄月份范围
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('er.work_age_months >= ? AND er.work_age_months < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      // 使用反向转换函数获取数据库中的实际学历值
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`er.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('er.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取当前期数据
    const currentStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, year, month });

    // 获取对比期数据（环比和同比）
    let previousStats = null;
    let lastYearStats = null;

    if (year && month) {
      // 环比：上个月数据
      const prevDateRange = getPreviousDateRange(parseInt(year), parseInt(month));
      if (prevDateRange) {
        const prevParams = [...params.slice(0, -2), prevDateRange.start, prevDateRange.end];
        previousStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, year: parseInt(year), month: parseInt(month) - 1 });
      }

      // 同比：去年同月数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year), parseInt(month));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, year: parseInt(year) - 1, month: parseInt(month) });
      }
    } else if (year) {
      // 同比：去年数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, year: parseInt(year) - 1, month });
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
async function getCurrentStats(pool, { organizationRegion, region, department, workAge, education, year, month }) {
  const connection = await pool.getConnection();

  try {
    // 在职员工数（从employee_roster表统计）
    let totalResult;
    if (year) {
      // 选择年份：统计截止到该年末的累计在职人数（按入职日期 <= 年末）
      const { where: baseWhere, params: baseParams } = buildWhere('er', {
        organizationRegion, region, department, workAge, education, dateField: 'entry_date'
      });
      const conditions = [];
      const params = [...baseParams];
      if (baseWhere) {
        conditions.push(baseWhere.replace('WHERE ', ''));
      }
      conditions.push('er.entry_date <= ?');
      params.push(`${year}-12-31`);
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      [totalResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster er ${whereClause}`,
        params
      );
    } else {
      // 未选择年份：统计全部在职员工
      const { where: totalWhereNoYear, params: totalParamsNoYear } = buildWhere('er', {
        organizationRegion, region, department, workAge, education, dateField: 'entry_date'
      });
      [totalResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster er ${totalWhereNoYear || ''}`,
        totalParamsNoYear
      );
    }

    // 新入职人数（当月或当年）
    let newResult;
    if (year && month) {
      // 如果指定了年月，只统计该月入职的员工
      const { where: newWhere, params: newParams } = buildWhere('er', {
        organizationRegion, region, department, workAge, education, dateField: 'entry_date'
      })
      // 添加年月条件
      const conditions = []
      const params = [...newParams]
      if (newWhere) {
        conditions.push(newWhere.replace('WHERE ', ''))
      }
      conditions.push('YEAR(er.entry_date) = ? AND MONTH(er.entry_date) = ?')
      params.push(year, month)

      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster er WHERE ${conditions.join(' AND ')}`,
        params
      );
    } else if (year) {
      // 如果只指定了年，统计该年入职的员工
      const { where: newWhere, params: newParams } = buildWhere('er', {
        organizationRegion, region, department, workAge, education, dateField: 'entry_date'
      })
      // 添加年份条件
      const conditions = []
      const params = [...newParams]
      if (newWhere) {
        conditions.push(newWhere.replace('WHERE ', ''))
      }
      conditions.push('YEAR(er.entry_date) = ?')
      params.push(year)

      console.log('年份筛选查询SQL:', `SELECT COUNT(*) as count FROM employee_roster er WHERE ${conditions.join(' AND ')}`);
      console.log('年份筛选查询参数:', params);
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster er WHERE ${conditions.join(' AND ')}`,
        params
      );
      console.log('年份筛选查询结果:', newResult);
    } else {
      // 未选择年份：统计全部的新入职员工（不限定年份）
      const { where: newWhereAll, params: newParamsAll } = buildWhere('er', {
        organizationRegion, region, department, workAge, education, dateField: 'entry_date'
      });
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_roster er ${newWhereAll || ''}`,
        newParamsAll
      );
    }

    // 离职人数（从resignation_monitoring表统计）
    const { where: resignedWhere, params: resignedParams } = buildWhere('rm', {
      organizationRegion, region, department, workAge, education, year, month, dateField: 'resignation_date'
    })
    const [resignedResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM resignation_monitoring rm ${resignedWhere}`,
      resignedParams
    );

    // 异动人数（从personnel_changes表统计）
    const { where: transferWhere, params: transferParams } = buildWhere('pc', {
      organizationRegion, region, department, workAge, education, year, month, dateField: 'change_date'
    })
    const [transferResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM personnel_changes pc ${transferWhere}`,
      transferParams
    );

    const result = {
      totalEmployees: totalResult[0]?.count || 0,
      newEmployees: newResult[0]?.count || 0,
      resignedEmployees: resignedResult[0]?.count || 0,
      transferEmployees: transferResult[0]?.count || 0
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
    const { organizationRegion, region, department, workAge, education, year, month } = req.query;
    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (organizationRegion) {
      // 处理组织区域参数
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      // 根据组织区域筛选对应的具体区域
      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌'];
      } else if (orgRegionValue === '华北') {
        regionList = ['合肥'];
      } else if (orgRegionValue === '华南') {
        regionList = ['中山', '厦门', '广州', '泉州', '深圳'];
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        whereConditions.push(`region IN (${placeholders})`);
        params.push(...regionList);
      }
    } else if (region) {
      whereConditions.push('er.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('er.department = ?');
      params.push(department);
    }

    if (workAge) {
      // 将司龄显示值转换为月份范围查询
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('er.work_age_months >= ? AND er.work_age_months < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`er.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 年/月时间范围（按入职日期过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('er.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT work_age_months
         FROM employee_roster er
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
    const { organizationRegion, region, department, workAge, education, year, month } = req.query;
    const pool = req.pool;

    let whereConditions = [];
    let params = [];

    if (organizationRegion) {
      // 处理组织区域参数
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      // 根据组织区域筛选对应的具体区域
      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌'];
      } else if (orgRegionValue === '华北') {
        regionList = ['合肥'];
      } else if (orgRegionValue === '华南') {
        regionList = ['中山', '厦门', '广州', '泉州', '深圳'];
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        whereConditions.push(`er.region IN (${placeholders})`);
        params.push(...regionList);
      }
    } else if (region) {
      whereConditions.push('er.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('er.department = ?');
      params.push(department);
    }

    if (workAge) {
      // 将司龄显示值转换为月份范围查询
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        whereConditions.push('er.work_age_months >= ? AND er.work_age_months < ?');
        params.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      // 使用反向转换函数获取数据库中的实际学历值
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        whereConditions.push(`er.education IN (${placeholders})`);
        params.push(...educationValues);
      }
    }

    // 年/月时间范围（按入职日期过滤）
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('er.entry_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT education
         FROM employee_roster er
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
    console.log('获取部门统计数据请求:', req.query);
    const { organizationRegion, region, department, workAge, education, year, month } = req.query;
    const pool = req.pool;

    // 使用统一的 buildWhere 函数
    const { where: whereClause, params } = buildWhere('er', {
      organizationRegion, region, department, workAge, education, year, month, dateField: 'entry_date'
    });

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM employee_roster er
         ${whereClause}
         GROUP BY department
         ORDER BY count DESC`,
        params
      );

      console.log('部门统计数据查询结果:', rows);
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

    // 获取所有区域
    console.log('查询区域选项...');
    const [regions] = await connection.execute(
      'SELECT DISTINCT region as region, region as id FROM employee_roster WHERE region IS NOT NULL AND region != "" ORDER BY region'
    );
    console.log('区域查询完成，结果数量:', regions.length);

    // 获取所有部门
    console.log('查询部门选项...');
    const [departments] = await connection.execute(
      'SELECT DISTINCT department as department, department as id FROM employee_roster WHERE department IS NOT NULL AND department != "" ORDER BY department'
    );
    console.log('部门查询完成，结果数量:', departments.length);

    // 获取年份范围
    console.log('查询年份选项...');
    const [years] = await connection.execute(
      'SELECT DISTINCT YEAR(entry_date) as year FROM employee_roster WHERE entry_date IS NOT NULL ORDER BY year DESC'
    );
    console.log('年份查询完成，结果数量:', years.length);

    // 获取组织区域（基于区域转换逻辑）
    const organizationRegions = [...new Set(regions.map(row => {
      const area = row.region;
      if (!area) return '';

      const areaStr = area.toString();

      if (areaStr === '总部') return '华东';
      if (areaStr === '合肥') return '华北';
      if (['杭州', '上海', '宁波', '义乌'].includes(areaStr)) return '华东';
      return '华南';
    }).filter(region => region !== ''))].sort();

    const result = {
      organizationRegions: organizationRegions.map(region => ({ id: region, region: region })),
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('rm.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('rm.position = ?');
      params.push(position);
    }

    // 处理在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 90 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 180 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 365');
          break;
      }
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      // 获取总离职人数
      const [totalResignedResult] = await connection.execute(
        `SELECT COUNT(*) as count
         FROM resignation_monitoring rm
         ${whereClause}`,
        params
      );

      // 获取总员工数（在职+离职）
      const [totalEmployeesResult] = await connection.execute(
        `SELECT
          (SELECT COUNT(*) FROM employee_roster) +
          (SELECT COUNT(*) FROM resignation_monitoring) as total`
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
             FROM resignation_monitoring rm
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
             FROM resignation_monitoring rm
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('rm.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('rm.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 90 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 180 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM resignation_monitoring rm
         ${whereClause}
         GROUP BY department
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (position) {
      whereConditions.push('rm.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 90 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 180 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加离职原因不为空的条件
    whereConditions.push('rm.resignation_reason IS NOT NULL AND rm.resignation_reason != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT resignation_reason, COUNT(*) as count
         FROM resignation_monitoring rm
         ${whereClause}
         GROUP BY resignation_reason
         ORDER BY count DESC
         LIMIT 20`,
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('rm.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('rm.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 90 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 180 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM resignation_monitoring rm
         ${whereClause}
         GROUP BY department
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('rm.resignation_reason = ?');
      params.push(reason);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 90 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 180 AND DATEDIFF(rm.resignation_date, rm.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(rm.resignation_date, rm.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加岗位不为空的条件
    whereConditions.push('rm.position IS NOT NULL AND rm.position != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT position, COUNT(*) as count
         FROM resignation_monitoring rm
         ${whereClause}
         GROUP BY position
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
      whereConditions.push('rm.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('rm.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('rm.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('rm.position = ?');
      params.push(position);
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('rm.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加必要字段不为空的条件
    whereConditions.push('rm.entry_date IS NOT NULL AND rm.resignation_date IS NOT NULL');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT
          CASE
            WHEN DATEDIFF(rm.resignation_date, rm.entry_date) <= 90 THEN '1-3月'
            WHEN DATEDIFF(rm.resignation_date, rm.entry_date) <= 180 THEN '3-6月'
            WHEN DATEDIFF(rm.resignation_date, rm.entry_date) <= 365 THEN '6-12月'
            ELSE '1年以上'
          END as tenure_range,
          COUNT(*) as count
         FROM resignation_monitoring rm
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

/**
 * 获取各部门人员异动统计
 */
router.get('/department-transfer-stats', async (req, res) => {
  try {
    const { region, department, year, month } = req.query;
    const pool = req.pool;

    // 构建查询条件
    let whereConditions = [];
    let params = [];

    if (region) {
      whereConditions.push('pc.department = ?'); // personnel_changes表中没有region字段，使用department
      params.push(region);
    }

    if (department) {
      whereConditions.push('pc.department = ?');
      params.push(department);
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('pc.change_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM personnel_changes pc
         ${whereClause}
         GROUP BY department
         ORDER BY count ASC`,
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
    console.error('获取各部门人员异动统计失败:', error);
    res.status(500).json({ error: '获取各部门人员异动统计失败' });
  }
});

module.exports = router;
