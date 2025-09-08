const express = require('express')
const router = express.Router()

// 公司组织区域到具体区域的映射
const ORG_REGION_MAP = {
  '华东': ['总部', '杭州', '上海', '宁波', '义乌', '合肥'],
  '华南': ['中山', '厦门', '广州', '泉州', '深圳']
}

// 获取省级户籍地分布数据
router.get('/province-distribution', async (req, res) => {
  let connection;
  try {
    // 获取数据库连接
    const pool = req.pool;
    connection = await pool.getConnection();

    // 获取筛选参数
    const { organizationRegion, region, department, year, month, dateRange } = req.query;
    console.log('接收到的筛选参数:', { organizationRegion, region, department, year, month, dateRange });

    // 构建WHERE条件
    let whereConditions = ['hometown IS NOT NULL', "hometown != ''", "status = '在职'"];
    let queryParams = [];

    // 添加组织区域筛选条件
    if (organizationRegion) {
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌', '合肥'];
      } else if (orgRegionValue === '华南') {
        regionList = ['中山', '厦门', '广州', '泉州', '深圳'];
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        whereConditions.push(`region IN (${placeholders})`);
        queryParams.push(...regionList);
      }
    } else if (region && region !== '全部区域' && region !== '') {
      // 根据具体区域筛选（公司内部区域）
      whereConditions.push('region = ?');
      queryParams.push(region);
    }

    // 添加部门筛选条件
    if (department && department !== '全部部门' && department !== '') {
      whereConditions.push('department = ?');
      queryParams.push(department);
    }

    // 添加日期筛选条件
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      queryParams.push(dateRange[0], dateRange[1]);
    } else if (year && month) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      whereConditions.push('entry_date BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    } else if (year) {
      whereConditions.push('YEAR(entry_date) = ?');
      queryParams.push(year);
    }

    const whereClause = whereConditions.join(' AND ');
    console.log('=== 地图数据筛选调试 ===');
    console.log('接收到的筛选参数:', { organizationRegion, region, department, year, month, dateRange });
    console.log('构建的WHERE条件:', whereClause);
    console.log('查询参数:', queryParams);

    // 仓库所在省份映射
    const WAREHOUSE_PROVINCE_MAP = {
      '华东': ['浙江省', '上海市', '安徽省', '江苏省', '江西省', '山东省'],
      '华南': ['广东省', '福建省', '海南省', '广西壮族自治区'],
      '华中': ['河南省', '湖北省', '湖南省'],
      '西南': ['四川省', '重庆市', '贵州省', '云南省', '西藏自治区'],
      '西北': ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '内蒙古自治区']
    };

    let results = [];

    // 如果选择了组织区域，只显示该区域仓库所在的省份
    if (organizationRegion && WAREHOUSE_PROVINCE_MAP[organizationRegion]) {
      console.log('=== 仓库省份筛选模式 ===');
      console.log('组织区域:', organizationRegion);
      console.log('仓库所在省份:', WAREHOUSE_PROVINCE_MAP[organizationRegion]);

      const targetProvinces = WAREHOUSE_PROVINCE_MAP[organizationRegion];

      // 为每个目标省份统计员工数量
      for (const province of targetProvinces) {
        let provinceWhereConditions = [...whereConditions];
        let provinceQueryParams = [...queryParams];

        // 添加省份筛选条件
        if (province === '上海市') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%上海%');
        } else if (province === '浙江省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%浙江%');
        } else if (province === '安徽省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%安徽%');
        } else if (province === '江苏省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%江苏%');
        } else if (province === '江西省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%江西%');
        } else if (province === '山东省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%山东%');
        } else if (province === '广东省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%广东%');
        } else if (province === '福建省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%福建%');
        } else if (province === '海南省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%海南%');
        } else if (province === '广西壮族自治区') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%广西%');
        } else if (province === '河南省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%河南%');
        } else if (province === '湖北省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%湖北%');
        } else if (province === '湖南省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%湖南%');
        } else if (province === '四川省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%四川%');
        } else if (province === '重庆市') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%重庆%');
        } else if (province === '贵州省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%贵州%');
        } else if (province === '云南省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%云南%');
        } else if (province === '西藏自治区') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%西藏%');
        } else if (province === '陕西省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%陕西%');
        } else if (province === '甘肃省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%甘肃%');
        } else if (province === '青海省') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%青海%');
        } else if (province === '宁夏回族自治区') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%宁夏%');
        } else if (province === '新疆维吾尔自治区') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%新疆%');
        } else if (province === '内蒙古自治区') {
          provinceWhereConditions.push('hometown LIKE ?');
          provinceQueryParams.push('%内蒙古%');
        }

        const provinceWhereClause = provinceWhereConditions.join(' AND ');

        const [provinceResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM employee_info WHERE ${provinceWhereClause}`,
          provinceQueryParams
        );

        if (provinceResult[0].count > 0) {
          results.push({
            province: province,
            count: provinceResult[0].count
          });
        }
      }

      // 按人数降序排序
      results.sort((a, b) => b.count - a.count);

    } else {
      // 没有组织区域筛选时，显示所有省份（完整省份名称匹配）
      const query = `
        SELECT 
          CASE 
            WHEN hometown LIKE '%省%' THEN 
              SUBSTRING(hometown, 1, LOCATE('省', hometown))
            WHEN hometown LIKE '%自治区%' THEN 
              SUBSTRING(hometown, 1, LOCATE('自治区', hometown) + 2)
            WHEN hometown LIKE '%特别行政区%' THEN 
              SUBSTRING(hometown, 1, LOCATE('特别行政区', hometown) + 4)
            WHEN hometown LIKE '%内蒙古自治区%' THEN '内蒙古'
            WHEN hometown LIKE '%广西壮族自治区%' THEN '广西'
            WHEN hometown LIKE '%西藏自治区%' THEN '西藏'
            WHEN hometown LIKE '%宁夏回族自治区%' THEN '宁夏'
            WHEN hometown LIKE '%新疆维吾尔自治区%' THEN '新疆'
            WHEN hometown LIKE '%广西%' THEN '广西'
            WHEN hometown LIKE '%内蒙古%' THEN '内蒙古'
            WHEN hometown LIKE '%宁夏%' THEN '宁夏'
            WHEN hometown LIKE '%新疆%' THEN '新疆'
            WHEN hometown LIKE '%西藏%' THEN '西藏'
            WHEN hometown LIKE '%重庆%' THEN '重庆市'
            WHEN hometown LIKE '%北京%' THEN '北京市'
            WHEN hometown LIKE '%上海%' THEN '上海市'
            WHEN hometown LIKE '%天津%' THEN '天津市'
            WHEN hometown LIKE '%海南%' THEN '海南省'
            WHEN hometown LIKE '%台湾%' THEN '台湾省'
            WHEN hometown LIKE '%香港%' THEN '香港特别行政区'
            WHEN hometown LIKE '%澳门%' THEN '澳门特别行政区'
            WHEN hometown LIKE '黑龙江%' THEN '黑龙江省'
            WHEN hometown LIKE '吉林%' THEN '吉林省'
            WHEN hometown LIKE '辽宁%' THEN '辽宁省'
            WHEN hometown LIKE '河北%' THEN '河北省'
            WHEN hometown LIKE '山西%' THEN '山西省'
            WHEN hometown LIKE '江苏%' THEN '江苏省'
            WHEN hometown LIKE '浙江%' THEN '浙江省'
            WHEN hometown LIKE '安徽%' THEN '安徽省'
            WHEN hometown LIKE '福建%' THEN '福建省'
            WHEN hometown LIKE '江西%' THEN '江西省'
            WHEN hometown LIKE '山东%' THEN '山东省'
            WHEN hometown LIKE '河南%' THEN '河南省'
            WHEN hometown LIKE '湖北%' THEN '湖北省'
            WHEN hometown LIKE '湖南%' THEN '湖南省'
            WHEN hometown LIKE '广东%' THEN '广东省'
            WHEN hometown LIKE '四川%' THEN '四川省'
            WHEN hometown LIKE '贵州%' THEN '贵州省'
            WHEN hometown LIKE '云南%' THEN '云南省'
            WHEN hometown LIKE '陕西%' THEN '陕西省'
            WHEN hometown LIKE '甘肃%' THEN '甘肃省'
            WHEN hometown LIKE '青海%' THEN '青海省'
            ELSE CONCAT(SUBSTRING(hometown, 1, 3), '省')
          END as province,
          COUNT(*) as count
        FROM 
          employee_info
        WHERE 
          ${whereClause}
        GROUP BY 
          CASE 
            WHEN hometown LIKE '%省%' THEN 
              SUBSTRING(hometown, 1, LOCATE('省', hometown))
            WHEN hometown LIKE '%自治区%' THEN 
              SUBSTRING(hometown, 1, LOCATE('自治区', hometown) + 2)
            WHEN hometown LIKE '%特别行政区%' THEN 
              SUBSTRING(hometown, 1, LOCATE('特别行政区', hometown) + 4)
            WHEN hometown LIKE '%内蒙古自治区%' THEN '内蒙古'
            WHEN hometown LIKE '%广西壮族自治区%' THEN '广西'
            WHEN hometown LIKE '%西藏自治区%' THEN '西藏'
            WHEN hometown LIKE '%宁夏回族自治区%' THEN '宁夏'
            WHEN hometown LIKE '%新疆维吾尔自治区%' THEN '新疆'
            WHEN hometown LIKE '%广西%' THEN '广西'
            WHEN hometown LIKE '%内蒙古%' THEN '内蒙古'
            WHEN hometown LIKE '%宁夏%' THEN '宁夏'
            WHEN hometown LIKE '%新疆%' THEN '新疆'
            WHEN hometown LIKE '%西藏%' THEN '西藏'
            WHEN hometown LIKE '%重庆%' THEN '重庆市'
            WHEN hometown LIKE '%北京%' THEN '北京市'
            WHEN hometown LIKE '%上海%' THEN '上海市'
            WHEN hometown LIKE '%天津%' THEN '天津市'
            WHEN hometown LIKE '%海南%' THEN '海南省'
            WHEN hometown LIKE '%台湾%' THEN '台湾省'
            WHEN hometown LIKE '%香港%' THEN '香港特别行政区'
            WHEN hometown LIKE '%澳门%' THEN '澳门特别行政区'
            WHEN hometown LIKE '黑龙江%' THEN '黑龙江省'
            WHEN hometown LIKE '吉林%' THEN '吉林省'
            WHEN hometown LIKE '辽宁%' THEN '辽宁省'
            WHEN hometown LIKE '河北%' THEN '河北省'
            WHEN hometown LIKE '山西%' THEN '山西省'
            WHEN hometown LIKE '江苏%' THEN '江苏省'
            WHEN hometown LIKE '浙江%' THEN '浙江省'
            WHEN hometown LIKE '安徽%' THEN '安徽省'
            WHEN hometown LIKE '福建%' THEN '福建省'
            WHEN hometown LIKE '江西%' THEN '江西省'
            WHEN hometown LIKE '山东%' THEN '山东省'
            WHEN hometown LIKE '河南%' THEN '河南省'
            WHEN hometown LIKE '湖北%' THEN '湖北省'
            WHEN hometown LIKE '湖南%' THEN '湖南省'
            WHEN hometown LIKE '广东%' THEN '广东省'
            WHEN hometown LIKE '四川%' THEN '四川省'
            WHEN hometown LIKE '贵州%' THEN '贵州省'
            WHEN hometown LIKE '云南%' THEN '云南省'
            WHEN hometown LIKE '陕西%' THEN '陕西省'
            WHEN hometown LIKE '甘肃%' THEN '甘肃省'
            WHEN hometown LIKE '青海%' THEN '青海省'
            ELSE CONCAT(SUBSTRING(hometown, 1, 3), '省')
          END
        ORDER BY 
          count DESC
      `;

      [results] = await connection.execute(query, queryParams);
    }

    console.log('=== 执行省级地图查询 ===');
    console.log('最终查询参数:', queryParams);

    console.log('=== 省级查询结果 ===');
    console.log('返回记录数:', results.length);
    console.log('前5条记录:', results.slice(0, 5));

    res.json({ success: true, data: results })
  } catch (error) {
    console.error('获取省级户籍地分布失败:', error)
    res.status(500).json({ success: false, message: '获取省级户籍地分布失败' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

// 获取市级户籍地分布数据
router.get('/city-distribution/:province', async (req, res) => {
  let connection;
  try {
    const { province } = req.params

    // 获取筛选参数
    const { organizationRegion, region, department, year, month, dateRange } = req.query;
    console.log('市级分布API接收到的筛选参数:', { organizationRegion, region, department, year, month, dateRange });

    // 获取数据库连接
    const pool = req.pool;
    connection = await pool.getConnection();

    // 构建WHERE条件
    let whereConditions = [
      'hometown IS NOT NULL',
      "hometown != ''",
      'hometown LIKE ?',
      'id_card_address IS NOT NULL',
      "id_card_address != ''",
      "status = '在职'"
    ];
    let queryParams = [`%${province}%`];

    // 添加组织区域筛选条件
    if (organizationRegion) {
      let orgRegionValue = organizationRegion;
      if (typeof organizationRegion === 'object' && organizationRegion.id) {
        orgRegionValue = organizationRegion.id;
      }

      let regionList = [];
      if (orgRegionValue === '华东') {
        regionList = ['总部', '杭州', '上海', '宁波', '义乌', '合肥'];
      } else if (orgRegionValue === '华南') {
        regionList = ['中山', '厦门', '广州', '泉州', '深圳'];
      }

      if (regionList.length > 0) {
        const placeholders = regionList.map(() => '?').join(',');
        whereConditions.push(`region IN (${placeholders})`);
        queryParams.push(...regionList);
      }
    } else if (region && region !== '全部区域' && region !== '') {
      // 根据具体区域筛选（公司内部区域）
      whereConditions.push('region = ?');
      queryParams.push(region);
    }

    // 添加部门筛选条件
    if (department && department !== '全部部门' && department !== '') {
      whereConditions.push('department = ?');
      queryParams.push(department);
    }

    // 添加日期筛选条件
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      whereConditions.push('entry_date BETWEEN ? AND ?');
      queryParams.push(dateRange[0], dateRange[1]);
    } else if (year && month) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      whereConditions.push('entry_date BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    } else if (year) {
      whereConditions.push('YEAR(entry_date) = ?');
      queryParams.push(year);
    }

    const whereClause = whereConditions.join(' AND ');
    console.log('市级分布API构建的WHERE条件:', whereClause);
    console.log('市级分布API查询参数:', queryParams);

    // 从employee_info表中统计指定省份的各市人数，使用hometown字段和id_card_address字段
    // 提取市级信息（如"安徽省阜南县" -> "阜南县"）
    const query = `
      SELECT 
        city,
        SUM(address_count) as count,
        GROUP_CONCAT(
          CONCAT(names, ' - ', address) 
          SEPARATOR '; '
        ) as addresses
      FROM (
        SELECT 
          CASE 
            WHEN hometown LIKE '%省%' THEN 
              SUBSTRING(hometown, LOCATE('省', hometown) + 1)
            WHEN hometown LIKE '%自治区%' THEN 
              CASE 
                WHEN LENGTH(SUBSTRING(hometown, LOCATE('自治区', hometown) + 3)) > 0 THEN
                  SUBSTRING(hometown, LOCATE('自治区', hometown) + 3)
                ELSE hometown
              END
            WHEN hometown LIKE '%市%' AND hometown NOT LIKE '%省%' THEN 
              hometown
            WHEN hometown LIKE '%特别行政区%' THEN 
              hometown
            ELSE hometown
          END as city,
          id_card_address as address,
          COUNT(*) as address_count,
          GROUP_CONCAT(DISTINCT name SEPARATOR ',') as names
        FROM 
          employee_info
        WHERE 
          ${whereClause}
        GROUP BY 
          CASE 
            WHEN hometown LIKE '%省%' THEN 
              SUBSTRING(hometown, LOCATE('省', hometown) + 1)
            WHEN hometown LIKE '%自治区%' THEN 
              CASE 
                WHEN LENGTH(SUBSTRING(hometown, LOCATE('自治区', hometown) + 3)) > 0 THEN
                  SUBSTRING(hometown, LOCATE('自治区', hometown) + 3)
                ELSE hometown
              END
            WHEN hometown LIKE '%市%' AND hometown NOT LIKE '%省%' THEN 
              hometown
            WHEN hometown LIKE '%特别行政区%' THEN 
              hometown
            ELSE hometown
          END,
          id_card_address
      ) as address_groups
      GROUP BY city
      ORDER BY count DESC
    `

    const [results] = await connection.execute(query, queryParams)
    res.json({ success: true, data: results })
  } catch (error) {
    console.error('获取市级户籍地分布失败:', error)
    res.status(500).json({ success: false, message: '获取市级户籍地分布失败' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

module.exports = router
