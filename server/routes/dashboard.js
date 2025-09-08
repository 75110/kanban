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
  '华东': ['总部', '杭州', '上海', '宁波', '义乌', '合肥'],
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
    '1-3年': { min: 12, max: 36 },
    '3-6年': { min: 36, max: 72 },
    '6-12年': { min: 72, max: 144 },
    '12年以上': { min: 144, max: 999999 }
  };
  return ranges[workAge] || null;
}

// 构建 where 子句（按表别名）
function buildWhere(alias, { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange, dateField }) {
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

  // 户籍地筛选 - 只对有hometown字段的表生效
  if (hometown && alias !== 'pc') { // personnel_changes表没有hometown字段
    conditions.push(`${alias}.hometown LIKE ?`)
    params.push(`%${hometown}%`)
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

  // 日期范围筛选
  if (dateRange && dateRange.length === 2) {
    const field = dateField || 'entry_date'
    conditions.push(`${alias}.${field} BETWEEN ? AND ?`)
    params.push(dateRange[0], dateRange[1])
  } else {
    // 日期（年份/月份）
    const dr = getDateRange(year, month)
    if (dr) {
      const field = dateField || 'entry_date'
      conditions.push(`${alias}.${field} BETWEEN ? AND ?`)
      params.push(dr.start, dr.end)
    }
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params }
}

/**
 * 获取看板统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange } = req.query;
    console.log('=== Dashboard stats API 调用 ===');
    console.log('Dashboard stats request:', { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange });
    console.log('Education filter value:', education);
    console.log('Hometown filter value:', hometown);
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
        regionList = ['总部', '杭州', '上海', '宁波', '义乌', '合肥'];
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

    // 日期范围条件（如果没有提供dateRange参数）
    if (!dateRange || dateRange.length !== 2) {
      const dateRangeFromYearMonth = getDateRange(year, month);
      if (dateRangeFromYearMonth) {
        whereConditions.push('er.entry_date BETWEEN ? AND ?');
        params.push(dateRangeFromYearMonth.start, dateRangeFromYearMonth.end);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取当前期数据
    const currentStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange });

    // 获取对比期数据（环比和同比）
    let previousStats = null;
    let lastYearStats = null;

    if (year && month) {
      // 环比：上个月数据
      const prevDateRange = getPreviousDateRange(parseInt(year), parseInt(month));
      if (prevDateRange) {
        const prevParams = [...params.slice(0, -2), prevDateRange.start, prevDateRange.end];
        previousStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, hometown, year: parseInt(year), month: parseInt(month) - 1 });
      }

      // 同比：去年同月数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year), parseInt(month));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, hometown, year: parseInt(year) - 1, month: parseInt(month) });
      }
    } else if (year) {
      // 同比：去年数据
      const lastYearDateRange = getLastYearDateRange(parseInt(year));
      if (lastYearDateRange) {
        const lastYearParams = [...params.slice(0, -2), lastYearDateRange.start, lastYearDateRange.end];
        lastYearStats = await getCurrentStats(pool, { organizationRegion, region, department, workAge, education, hometown, year: parseInt(year) - 1, month });
      }
    }

    // 计算比率
    const calculateRates = (stats) => {
      const total = stats.totalEmployees || 1; // 避免除零
      const newEmployees = stats.newEmployees || 0;
      const resignedEmployees = stats.resignedEmployees || 0;
      const retentionCount = newEmployees - resignedEmployees;
      
      return {
        changeRate: ((stats.resignedEmployees + stats.transferEmployees) / total * 100),
        retentionRate: newEmployees > 0 ? (retentionCount / newEmployees * 100) : 0,
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
          retentionRate: calculateMonthOverMonth(currentRates.retentionRate, previousRates.retentionRate),
          resignationRate: calculateMonthOverMonth(currentRates.resignationRate, previousRates.resignationRate)
        } : null,
        yearOverYear: lastYearStats ? {
          totalEmployees: calculateYearOverYear(currentStats.totalEmployees, lastYearStats.totalEmployees),
          newEmployees: calculateYearOverYear(currentStats.newEmployees, lastYearStats.newEmployees),
          resignedEmployees: calculateYearOverYear(currentStats.resignedEmployees, lastYearStats.resignedEmployees),
          transferEmployees: calculateYearOverYear(currentStats.transferEmployees, lastYearStats.transferEmployees),
          changeRate: calculateYearOverYear(currentRates.changeRate, lastYearRates.changeRate),
          retentionRate: calculateYearOverYear(currentRates.retentionRate, lastYearRates.retentionRate),
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
async function getCurrentStats(pool, { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange }) {
  console.log('=== getCurrentStats 函数调用 ===');
  console.log('getCurrentStats 参数:', { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange });
  
  const connection = await pool.getConnection();

  try {
    // 构建基础筛选条件（使用employee_info表）
    let baseWhereConditions = [];
    let baseParams = [];

    // 组织区域筛选
    if (organizationRegion) {
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      // 根据组织区域筛选对应的具体区域
      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌', '合肥'];
      } else if (orgRegionValue === '华南') {
        regionList = ['中山', '厦门', '广州', '泉州', '深圳'];
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        baseWhereConditions.push(`ei.region IN (${placeholders})`);
        baseParams.push(...regionList);
      }
    } else if (region) {
      baseWhereConditions.push('ei.region = ?');
      baseParams.push(region);
    }

    if (department) {
      baseWhereConditions.push('ei.department = ?');
      baseParams.push(department);
    }

    if (workAge) {
      const monthsRange = getWorkAgeMonthsRange(workAge);
      if (monthsRange) {
        baseWhereConditions.push('ei.work_age_months >= ? AND ei.work_age_months < ?');
        baseParams.push(monthsRange.min, monthsRange.max);
      }
    }

    if (education) {
      const educationValues = reverseTransformEducation(education);
      if (educationValues.length > 0) {
        const placeholders = educationValues.map(() => '?').join(',');
        baseWhereConditions.push(`ei.education IN (${placeholders})`);
        baseParams.push(...educationValues);
      }
    }

    if (hometown) {
      baseWhereConditions.push('ei.hometown LIKE ?');
      baseParams.push(`%${hometown}%`);
      console.log('添加户籍地筛选:', hometown);
    }

    // 日期筛选逻辑
    let dateFilter = null;
    let isDateRangeFilter = false; // 标记是否为开始结束日期筛选
    console.log('=== 日期筛选参数检查 ===');
    console.log('dateRange:', dateRange);
    console.log('year:', year);
    console.log('month:', month);
    
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      // 开始结束日期筛选
      dateFilter = {
        start: dateRange[0],
        end: dateRange[1]
      };
      isDateRangeFilter = true;
      console.log('使用开始结束日期筛选:', dateFilter);
    } else {
      // 年月筛选
      dateFilter = getDateRange(year, month);
      isDateRangeFilter = false;
      console.log('使用年月筛选:', dateFilter);
    }

    // 在职员工数（根据时间筛选类型不同处理）
    let totalResult;
    if (dateFilter) {
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      conditions.push('ei.status = ?');
      params.push('在职');
      
      if (isDateRangeFilter) {
        // 开始结束日期筛选：显示时间段内的在职人数
        // 条件：在时间段内入职且在时间段结束时仍在职的人
        console.log('=== 开始结束日期筛选在职人数查询 ===');
        conditions.push('ei.entry_date >= ?');
        params.push(dateFilter.start);
        conditions.push('ei.entry_date <= ?');
        params.push(dateFilter.end);
        conditions.push('(ei.resignation_date IS NULL OR ei.resignation_date > ?)');
        params.push(dateFilter.end);
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        console.log('在职人数查询SQL:', `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`);
        console.log('在职人数查询参数:', params);
        [totalResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
          params
        );
        console.log('在职人数查询结果:', totalResult[0]);
      } else {
        // 年月筛选：显示该年/月最后一天的在职人数
        conditions.push('ei.entry_date <= ?');
        params.push(dateFilter.end);
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        [totalResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
          params
        );
      }
    } else {
      // 无时间筛选时，显示全部在职人数
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      conditions.push('ei.status = ?');
      params.push('在职');
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      [totalResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
        params
      );
    }


    // 新入职人数（从employee_info表统计，按入职日期筛选，应用全局筛选条件）
    let newResult;
    if (dateFilter) {
      console.log('入职人数查询 - 日期范围:', dateFilter);
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      conditions.push('ei.entry_date >= ? AND ei.entry_date <= ?');
      params.push(dateFilter.start, dateFilter.end);
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      console.log('入职人数查询 - SQL:', `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`);
      console.log('入职人数查询 - 参数:', params);
      
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
        params
      );
      
      console.log('入职人数查询结果:', newResult[0]);
    } else {
      // 没有日期筛选时，统计所有入职人数（不限制年份）
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      console.log('入职人数查询 - 默认统计全部入职人数');
      console.log('入职人数查询 - SQL:', `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`);
      console.log('入职人数查询 - 参数:', params);
      
      [newResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
        params
      );
      console.log('入职人数查询结果:', newResult[0]);
    }

    // 离职人数（从employee_info表统计，status='离职'，按入职日期筛选）
    let resignedResult;
    if (dateFilter) {
      console.log('离职人数查询 - 日期范围:', dateFilter);
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      conditions.push('ei.status = ?');
      params.push('离职');
      conditions.push('ei.entry_date >= ? AND ei.entry_date <= ?');
      params.push(dateFilter.start, dateFilter.end);
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      console.log('离职人数查询 - SQL:', `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`);
      console.log('离职人数查询 - 参数:', params);
      
      [resignedResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
        params
      );
      
      console.log('离职人数查询结果:', resignedResult[0]);
    } else {
      console.log('离职人数查询 - 无日期筛选');
      const conditions = [...baseWhereConditions];
      const params = [...baseParams];
      conditions.push('ei.status = ?');
      params.push('离职');
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      console.log('离职人数查询 - SQL:', `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`);
      console.log('离职人数查询 - 参数:', params);
      
      [resignedResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM employee_info ei ${whereClause}`,
        params
      );
      
      console.log('离职人数查询结果:', resignedResult[0]);
    }

    // 异动人数（从personnel_changes表统计，保持原有逻辑）
    const { where: transferWhere, params: transferParams } = buildWhere('pc', {
      organizationRegion, region, department, workAge, education, hometown, year, month, dateField: 'change_date'
    });
    const [transferResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM personnel_changes pc ${transferWhere}`,
      transferParams
    );

    const result = {
      totalEmployees: (totalResult && totalResult[0]) ? totalResult[0].count : 0,
      newEmployees: (newResult && newResult[0]) ? newResult[0].count : 0,
      resignedEmployees: (resignedResult && resignedResult[0]) ? resignedResult[0].count : 0,
      transferEmployees: (transferResult && transferResult[0]) ? transferResult[0].count : 0
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
    const { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange } = req.query;
    const pool = req.pool;

    // 使用buildWhere函数构建查询条件，排除workAge避免递归筛选
    const { where: whereClause, params } = buildWhere('ei', {
      organizationRegion, region, department, education, hometown, year, month, dateRange
    });

    // 添加在职状态筛选
    const finalWhere = whereClause ? `${whereClause} AND ei.status = ?` : 'WHERE ei.status = ?';
    const finalParams = [...params, '在职'];

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT work_age_months
         FROM employee_info ei
         ${finalWhere}`,
        finalParams
      );

      // 统计各工龄段人数
      const distribution = {
        '1年以下': 0,
        '1-3年': 0,
        '3-6年': 0,
        '6-12年': 0,
        '12年以上': 0
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
    const { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange } = req.query;
    const pool = req.pool;

    // 使用buildWhere函数构建查询条件，排除education避免递归筛选
    const { where: whereClause, params } = buildWhere('ei', {
      organizationRegion, region, department, workAge, hometown, year, month, dateRange
    });

    // 添加在职状态筛选
    const finalWhere = whereClause ? `${whereClause} AND ei.status = ?` : 'WHERE ei.status = ?';
    const finalParams = [...params, '在职'];

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT education
         FROM employee_info ei
         ${finalWhere}`,
        finalParams
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
    const { organizationRegion, region, department, workAge, education, hometown, year, month, dateRange } = req.query;
    const pool = req.pool;

    // 使用buildWhere函数构建查询条件，排除department避免递归筛选
    const { where: whereClause, params } = buildWhere('ei', {
      organizationRegion, region, workAge, education, hometown, year, month, dateRange
    });

    // 添加在职状态筛选
    const finalWhere = whereClause ? `${whereClause} AND ei.status = ?` : 'WHERE ei.status = ?';
    const finalParams = [...params, '在职'];

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM employee_info ei
         ${finalWhere}
         GROUP BY department
         ORDER BY count DESC`,
        finalParams
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
      if (areaStr === '合肥') return '华东';
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
 * 获取人才流失统计数据
 */
router.get('/turnover-stats', async (req, res) => {
  try {
    const { region, department, year, month, reason, position, tenure } = req.query;
    const pool = req.pool;

    // 构建查询条件
    let whereConditions = [];
    let params = [];

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('ei.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('ei.position = ?');
      params.push(position);
    }

    // 处理在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 90 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 180 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 365');
          break;
      }
    }

    // 日期范围条件
    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      // 获取总离职人数
      const [totalResignedResult] = await connection.execute(
        `SELECT COUNT(*) as count
         FROM employee_info ei
         ${whereClause}`,
        params
      );

      // 获取总员工数（从employee_info表统计）
      const [totalEmployeesResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM employee_info`
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
             FROM employee_info ei
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
             FROM employee_info ei
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

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('ei.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('ei.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 90 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 180 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM employee_info ei
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

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (position) {
      whereConditions.push('ei.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 90 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 180 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加离职原因不为空的条件
    whereConditions.push('ei.resignation_reason IS NOT NULL AND ei.resignation_reason != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT resignation_reason, COUNT(*) as count
         FROM employee_info ei
         ${whereClause}
         GROUP BY resignation_reason
         ORDER BY count DESC
         LIMIT 30`,
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

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('ei.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('ei.position = ?');
      params.push(position);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 90 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 180 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT department, COUNT(*) as count
         FROM employee_info ei
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

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('ei.resignation_reason = ?');
      params.push(reason);
    }

    // 在职时间筛选
    if (tenure) {
      switch (tenure) {
        case '1-3月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) <= 90');
          break;
        case '3-6月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 90 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 180');
          break;
        case '6-12月':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 180 AND DATEDIFF(ei.resignation_date, ei.entry_date) <= 365');
          break;
        case '1年以上':
          whereConditions.push('DATEDIFF(ei.resignation_date, ei.entry_date) > 365');
          break;
      }
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加岗位不为空的条件
    whereConditions.push('ei.position IS NOT NULL AND ei.position != \'\'');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT position, COUNT(*) as count
         FROM employee_info ei
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

    // 添加离职状态筛选
    whereConditions.push('ei.status = ?');
    params.push('离职');

    if (region) {
      whereConditions.push('ei.region = ?');
      params.push(region);
    }

    if (department) {
      whereConditions.push('ei.department = ?');
      params.push(department);
    }

    if (reason) {
      whereConditions.push('ei.resignation_reason = ?');
      params.push(reason);
    }

    if (position) {
      whereConditions.push('ei.position = ?');
      params.push(position);
    }

    const dateRange = getDateRange(year, month);
    if (dateRange) {
      whereConditions.push('ei.resignation_date BETWEEN ? AND ?');
      params.push(dateRange.start, dateRange.end);
    }

    // 添加必要字段不为空的条件
    whereConditions.push('ei.entry_date IS NOT NULL AND ei.resignation_date IS NOT NULL');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT
          CASE
            WHEN DATEDIFF(ei.resignation_date, ei.entry_date) <= 90 THEN '1-3月'
            WHEN DATEDIFF(ei.resignation_date, ei.entry_date) <= 180 THEN '3-6月'
            WHEN DATEDIFF(ei.resignation_date, ei.entry_date) <= 365 THEN '6-12月'
            ELSE '1年以上'
          END as tenure_range,
          COUNT(*) as count
         FROM employee_info ei
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
