const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router();
const { transformWorkAge, transformEducation, transformRegion } = require('../utils/dataTransform');

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式'), false);
    }
  }
});

// 构建排序子句的辅助函数
function buildOrderClause(sortField, sortOrder) {
  // 定义允许排序的字段映射
  const allowedSortFields = {
    'sequence_number': 'sequence_number',
    'name': 'name',
    'department': 'department',
    'position': 'position',
    'gender': 'gender',
    'age': 'age',
    'education': 'education',
    'work_age_months': 'work_age_months',
    'entry_date': 'entry_date',
    'region': 'region',
    'employee_type': 'employee_type',
    'marital_status': 'marital_status',
    'personal_contact': 'personal_contact',
    'labor_relation_affiliation': 'labor_relation_affiliation',
    'social_insurance_affiliation': 'social_insurance_affiliation'
  };

  // 验证排序字段
  if (!sortField || !allowedSortFields[sortField]) {
    return 'ORDER BY entry_date DESC'; // 默认排序
  }

  // 验证排序方向
  const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

  return `ORDER BY ${allowedSortFields[sortField]} ${order}`;
}

// 构建离职监控排序子句的辅助函数
function buildResignationOrderClause(sortField, sortOrder) {
  const allowedSortFields = {
    'sequence_number': 'sequence_number',
    'name': 'name',
    'department': 'department',
    'position': 'position',
    'gender': 'gender',
    'entry_date': 'entry_date',
    'resignation_date': 'resignation_date',
    'resignation_type': 'resignation_type',
    'resignation_reason': 'resignation_reason'
  };

  if (!sortField || !allowedSortFields[sortField]) {
    return 'ORDER BY resignation_date DESC';
  }

  const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
  return `ORDER BY ${allowedSortFields[sortField]} ${order}`;
}

// 构建人员异动排序子句的辅助函数
function buildPersonnelChangesOrderClause(sortField, sortOrder) {
  const allowedSortFields = {
    'department': 'department',
    'name': 'name',
    'original_position': 'original_position',
    'new_position': 'new_position',
    'change_date': 'change_date',
    'change_reason': 'change_reason'
  };

  if (!sortField || !allowedSortFields[sortField]) {
    return 'ORDER BY change_date DESC';
  }

  const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
  return `ORDER BY ${allowedSortFields[sortField]} ${order}`;
}

// 构建员工获奖排序子句的辅助函数
function buildAwardsOrderClause(sortField, sortOrder) {
  const allowedSortFields = {
    'award_year': 'award_year',
    'award_date': 'award_date',
    'name': 'name',
    'department': 'department',
    'entry_date': 'entry_date',
    'award_month': 'award_month',
    'award_name': 'award_name',
    'award_amount': 'award_amount'
  };

  if (!sortField || !allowedSortFields[sortField]) {
    return 'ORDER BY award_year DESC, award_date DESC';
  }

  const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
  return `ORDER BY ${allowedSortFields[sortField]} ${order}`;
}

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
      position,
      sortField,
      sortOrder
    } = req.query;

    console.log('收到员工花名册请求:', { page, pageSize, region, department, name, position, sortField, sortOrder });

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
      // 开始执行数据库查询，支持搜索条件
      console.log('开始执行数据库查询...');
      console.log('搜索条件:', { name, department, position, region });

      // 构建WHERE条件
      let whereConditions = [];
      let queryParams = [];

      if (name && name.trim()) {
        whereConditions.push('er.name LIKE ?');
        queryParams.push(`%${name.trim()}%`);
      }

      if (department && department.trim()) {
        whereConditions.push('er.department LIKE ?');
        queryParams.push(`%${department.trim()}%`);
      }

      if (position && position.trim()) {
        whereConditions.push('er.position LIKE ?');
        queryParams.push(`%${position.trim()}%`);
      }

      if (region && region.trim()) {
        whereConditions.push('er.region LIKE ?');
        queryParams.push(`%${region.trim()}%`);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // 获取总数 - 带搜索条件
      const countSql = `
        SELECT COUNT(*) as total
        FROM employee_roster er
        ${whereClause}
      `;

      console.log('统计SQL:', countSql);
      console.log('统计参数:', queryParams);

      const [countResult] = await connection.execute(countSql, queryParams);
      const total = countResult[0].total;
      console.log('符合条件的记录数:', total);

      // 获取分页数据 - 完整的花名册查询，包含搜索条件
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT
          sequence_number,
          region,
          department,
          position,
          name,
          gender,
          ethnicity,
          political_status,
          employee_type,
          insurance_type,
          birth_date,
          birthday,
          entry_date,
          actual_regularization_date,
          remarks,
          contract_end_date,
          work_age_months,
          id_card_number,
          id_card_address,
          age,
          hometown,
          graduation_school,
          major,
          education,
          education_method,
          graduation_date,
          interviewer_name,
          marital_status,
          current_address,
          personal_contact,
          emergency_contact_name,
          emergency_contact_phone,
          bank_card_number,
          bank_branch_info,
          labor_relation_affiliation,
          social_insurance_affiliation,
          non_compete_agreement,
          confidentiality_agreement,
          remarks1,
          remarks2
        FROM employee_roster er
        ${whereClause}
        ${buildOrderClause(sortField, sortOrder)}
        LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
      `;

      console.log('执行查询SQL:', dataSql);
      console.log('查询参数:', queryParams);

      const [rows] = await connection.execute(dataSql, queryParams);

      console.log('数据库查询结果:', rows.length, '条记录');

      // 转换数据 - 完整的数据转换，包含工龄计算和日期格式化
      const transformedRows = rows.map((row, index) => {
        console.log(`处理第 ${index + 1} 行: ${row.name}, 区域: ${row.region}, 入职时间: ${row.entry_date}, 工龄月数: ${row.work_age_months}`);
        console.log(`原始员工性质: "${row.employee_type}", 劳动关系: "${row.labor_relation_affiliation}", 社保隶属: "${row.social_insurance_affiliation}"`);

        // 计算工龄分组
        const workAgeGroup = transformWorkAge(row.work_age_months);
        const educationGroup = transformEducation(row.education);
        const organizationRegion = transformRegion(row.region);

        // 格式化日期 - 避免时区转换问题
        const formatDate = (date) => {
          if (!date) return null;
          if (date instanceof Date) {
            // 使用本地时间格式化，避免时区转换
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // 如果已经是YYYY-MM-DD格式，直接返回
            return date;
          }
          return date;
        };

        return {
          ...row,
          // 日期格式化
          entry_date: formatDate(row.entry_date),
          birth_date: formatDate(row.birth_date),
          graduation_date: formatDate(row.graduation_date),
          actual_regularization_date: formatDate(row.actual_regularization_date),
          contract_end_date: formatDate(row.contract_end_date),

          // 基本信息转换 - 空值显示为空字符串而不是"未知"
          gender: row.gender || '',
          region: row.region || '',
          department: row.department || '',
          position: row.position || '',
          education: row.education || '',
          education_method: row.education_method || '',
          political_status: row.political_status || '',
          marital_status: row.marital_status || '',
          hometown: row.hometown || '',

          // 员工类型转换 - 支持多种格式
          employee_type: (() => {
            if (!row.employee_type) return '';

            const typeStr = row.employee_type.toString().trim();

            // 如果是数字格式
            const numericMapping = {1: '正式', 2: '试用', 3: '实习'};
            if (numericMapping[typeStr]) {
              return numericMapping[typeStr];
            }

            // 如果包含"正式"、"试用"、"实习"等关键词，提取关键词
            if (typeStr.includes('正式')) return '正式';
            if (typeStr.includes('试用')) return '试用';
            if (typeStr.includes('实习')) return '实习';

            // 如果已经是简单格式，直接返回
            if (['正式', '试用', '实习'].includes(typeStr)) {
              return typeStr;
            }

            // 其他情况返回原值
            return typeStr;
          })(),

          // 保险类型转换 - 支持数字和字符串两种格式
          insurance_type: (() => {
            if (!row.insurance_type) return '';
            // 如果是数字格式
            const numericMapping = {1: '社保', 2: '工伤'};
            if (numericMapping[row.insurance_type]) {
              return numericMapping[row.insurance_type];
            }
            // 如果已经是字符串格式，直接返回
            if (['社保', '工伤', '无'].includes(row.insurance_type)) {
              return row.insurance_type;
            }
            // 其他情况返回原值
            return row.insurance_type;
          })(),

          // 分组数据
          work_age_group: workAgeGroup,
          education_group: educationGroup,
          organization_region: organizationRegion
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
      resignationType,
      sortField,
      sortOrder
    } = req.query;

    console.log('收到离职监控请求:', { page, pageSize, region, department, name, resignationType });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      let whereConditions = [];
      let params = [];

      if (region) {
        whereConditions.push('region LIKE ?');
        params.push(`%${region}%`);
      }

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      if (resignationType) {
        whereConditions.push('resignation_type = ?');
        params.push(resignationType);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM resignation_monitoring ${whereClause}`;
      const [countResult] = await connection.execute(countSql, params);
      const total = countResult[0].total;

      // 获取分页数据
      // 为避免某些 MySQL 版本对 LIMIT 参数化的限制，这里将分页参数直接嵌入 SQL（均为服务端计算出的安全整数）
      const limit = Number.parseInt(pageSize, 10) || 20
      const offset = (Number.parseInt(page, 10) - 1) * limit
      const dataSql = `
        SELECT
          id, sequence_number, region, department, position, name, gender,
          ethnicity, political_status, employee_type, insurance_type, birth_date, birthday,
          entry_date, actual_regularization_date, remarks, contract_end_date, work_age_months,
          id_card_number, id_card_address, age, hometown, graduation_school, major, education,
          education_method, graduation_date, interviewer_name, marital_status, current_address,
          personal_contact, emergency_contact_name, emergency_contact_phone, bank_card_number,
          bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
          non_compete_agreement, confidentiality_agreement, resignation_date, resignation_type,
          resignation_reason, resignation_remarks, created_at, updated_at
        FROM resignation_monitoring
        ${whereClause}
        ${buildResignationOrderClause(sortField, sortOrder)}
        LIMIT ${limit} OFFSET ${offset}
      `;

      console.log('执行离职监控查询SQL:', dataSql)
      console.log('执行离职监控查询参数:', params)
      const [rows] = await connection.execute(dataSql, params);

      // 安全的日期格式化函数
      const safeFormatDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date;
        }
        return date;
      };

      // 转换数据格式
      const transformedRows = rows.map(row => ({
        ...row,
        birth_date: safeFormatDate(row.birth_date),
        entry_date: safeFormatDate(row.entry_date),
        actual_regularization_date: safeFormatDate(row.actual_regularization_date),
        contract_end_date: safeFormatDate(row.contract_end_date),
        graduation_date: safeFormatDate(row.graduation_date),
        resignation_date: safeFormatDate(row.resignation_date)
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
 * 导出离职监控数据
 */
router.get('/resignation/export', async (req, res) => {
  try {
    const { region, department, name, resignationType } = req.query;
    console.log('收到离职监控导出请求:', { region, department, name, resignationType });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 构建WHERE条件
      let whereConditions = [];
      let params = [];

      if (region) {
        whereConditions.push('region LIKE ?');
        params.push(`%${region}%`);
      }

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      if (resignationType) {
        whereConditions.push('resignation_type LIKE ?');
        params.push(`%${resignationType}%`);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询resignation_monitoring表的所有字段
      const dataSql = `
        SELECT *
        FROM resignation_monitoring
        ${whereClause}
        ORDER BY resignation_date DESC
      `;

      console.log('导出离职SQL:', dataSql)
      console.log('导出离职参数:', params)
      const [rows] = await connection.execute(dataSql, params);

      // 直接返回resignation_monitoring表的所有数据，稳健格式化日期字段
      const safeFormatDate = (val) => {
        if (!val) return '';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return '';
          // 使用本地时间格式化，避免时区转换
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return '';
        }
      };

      const exportData = rows.map(row => ({
        序列: row.sequence_number || '',
        区域: row.region || '',
        部门: row.department || '',
        岗位: row.position || '',
        名字: row.name || '',
        性别: row.gender || '',
        民族: row.ethnicity || '',
        政治面貌: row.political_status || '',
        员工性质: row.employee_type || '',
        险种: row.insurance_type || '',
        出生日期: safeFormatDate(row.birth_date),
        生日: row.birthday || '',
        入职时间: safeFormatDate(row.entry_date),
        实际转正日期: safeFormatDate(row.actual_regularization_date),
        备注: row.remarks || '',
        合同终止日期: safeFormatDate(row.contract_end_date),
        '工龄（月）': (row.work_age_months ?? '').toString(),
        身份证号: row.id_card_number || '',
        身份证地址: row.id_card_address || '',
        年龄: (row.age ?? '').toString(),
        籍贯: row.hometown || '',
        毕业院校: row.graduation_school || '',
        专业: row.major || '',
        学历: row.education || '',
        教育方式: row.education_method || '',
        毕业日期: safeFormatDate(row.graduation_date),
        面试官姓名: row.interviewer_name || '',
        婚姻状况: row.marital_status || '',
        现居住地: row.current_address || '',
        本人联系方式: row.personal_contact || '',
        紧急联系人姓名: row.emergency_contact_name || '',
        紧急联系人电话: row.emergency_contact_phone || '',
        银行卡号: row.bank_card_number || '',
        详细支行信息: row.bank_branch_info || '',
        '劳动关系隶属(*)': row.labor_relation_affiliation || '',
        '社保隶属(*)': row.social_insurance_affiliation || '',
        竞业协议: row.non_compete_agreement || '',
        保密协议: row.confidentiality_agreement || '',
        离职时间: safeFormatDate(row.resignation_date),
        离职类型: row.resignation_type || '',
        离职原因: row.resignation_reason || '',
        离职备注: row.resignation_remarks || '',
        备注1: row.remarks1 || '',
        备注2: row.remarks2 || '',
        创建时间: safeFormatDate(row.created_at),
        更新时间: safeFormatDate(row.updated_at)
      }));

      res.json({
        success: true,
        data: exportData,
        total: exportData.length
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('导出离职监控数据失败:', error);
    res.status(500).json({ error: '导出离职监控数据失败', message: error.message });
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
      sortField,
      sortOrder
    } = req.query;

    console.log('收到人员异动请求:', { page, pageSize, department, name });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      let whereConditions = [];
      let params = [];

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM personnel_changes ${whereClause}`;
      const [countResult] = await connection.execute(countSql, params);
      const total = countResult[0].total;

      // 获取分页数据（内联 LIMIT/OFFSET，避免部分 MySQL 版本对绑定参数的限制）
      const limit = Number.parseInt(pageSize, 10) || 20;
      const offset = (Number.parseInt(page, 10) - 1) * limit;
      const dataSql = `
        SELECT
          department, name, original_position, new_position,
          change_date, change_reason,
          remarks AS change_remarks
        FROM personnel_changes
        ${whereClause}
        ${buildPersonnelChangesOrderClause(sortField, sortOrder)}
        LIMIT ${limit} OFFSET ${offset}
      `;

      console.log('查询人员异动 SQL:', dataSql);
      console.log('查询人员异动 参数:', params);
      const [rows] = await connection.execute(dataSql, params);

      // 格式化日期为 YYYY-MM-DD（本地时区），去掉时分秒
      const formatted = rows.map(r => {
        let cd = r.change_date;
        if (cd) {
          const d = new Date(cd);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          cd = `${y}-${m}-${da}`;
        } else {
          cd = null;
        }
        return { ...r, change_date: cd };
      });

      res.json({
        data: formatted,
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

/**
 * 导出人员异动数据
 */
router.get('/changes/export', async (req, res) => {
  try {
    const { department, name, changeType } = req.query;
    console.log('收到人员异动导出请求:', { department, name, changeType });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 构建WHERE条件
      let whereConditions = [];
      let params = [];

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      if (changeType) {
        whereConditions.push('change_reason LIKE ?');
        params.push(`%${changeType}%`);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询personnel_changes表的所有字段
      const dataSql = `
        SELECT *
        FROM personnel_changes
        ${whereClause}
        ORDER BY change_date DESC
      `;

      const [rows] = await connection.execute(dataSql, params);

      // 将personnel_changes转成中文列名
      const exportData = rows.map(row => ({
        部门: row.department || '',
        姓名: row.name || '',
        原岗位: row.original_position || '',
        新岗位: row.new_position || '',
        异动时间: row.change_date ? new Date(row.change_date).toISOString().split('T')[0] : '',
        异动原因: row.change_reason || '',
        备注: row.remarks || ''
      }));

      res.json({
        success: true,
        data: exportData,
        total: exportData.length
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('导出人员异动数据失败:', error);
    res.status(500).json({ error: '导出人员异动数据失败' });
  }
});

/**
 * 新增员工 - 直接插入花名册表
 */
router.post('/roster', async (req, res) => {
  try {
    const employeeData = req.body;
    console.log('收到新增员工请求:', employeeData);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 直接插入到employee_info表
      const insertSql = `
        INSERT INTO employee_info (
          sequence_number, region, department, position, name, gender, ethnicity,
          political_status, employee_type, insurance_type, birth_date, birthday,
          entry_date, actual_regularization_date, remarks, contract_end_date,
          work_age_months, id_card_number, id_card_address, age, hometown,
          graduation_school, major, education, education_method, graduation_date,
          interviewer_name, marital_status, current_address, personal_contact,
          emergency_contact_name, emergency_contact_phone, bank_card_number,
          bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
          non_compete_agreement, confidentiality_agreement, status, resignation_date,
          resignation_reason, remarks1, remarks2, remarks3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(insertSql, [
        employeeData.sequence_number || null,
        employeeData.region || null,
        employeeData.department || null,
        employeeData.position || null,
        employeeData.name,
        employeeData.gender || null,
        employeeData.ethnicity || null,
        employeeData.political_status || null,
        employeeData.employee_type || null,
        employeeData.insurance_type || null,
        employeeData.birth_date || null,
        employeeData.birthday || null,
        employeeData.entry_date || null,
        employeeData.actual_regularization_date || null,
        employeeData.remarks || null,
        employeeData.contract_end_date || null,
        employeeData.work_age_months || null,
        employeeData.id_card_number || null,
        employeeData.id_card_address || null,
        employeeData.age || null,
        employeeData.hometown || null,
        employeeData.graduation_school || null,
        employeeData.major || null,
        employeeData.education || null,
        employeeData.education_method || null,
        employeeData.graduation_date || null,
        employeeData.interviewer_name || null,
        employeeData.marital_status || null,
        employeeData.current_address || null,
        employeeData.personal_contact || null,
        employeeData.emergency_contact_name || null,
        employeeData.emergency_contact_phone || null,
        employeeData.bank_card_number || null,
        employeeData.bank_branch_info || null,
        employeeData.labor_relation_affiliation || null,
        employeeData.social_insurance_affiliation || null,
        employeeData.non_compete_agreement || null,
        employeeData.confidentiality_agreement || null,
        employeeData.status || '在职',
        employeeData.resignation_date || null,
        employeeData.resignation_reason || null,
        employeeData.remarks1 || null,
        employeeData.remarks2 || null,
        employeeData.remarks3 || null
      ]);

      res.json({
        success: true,
        message: '员工添加成功',
        employeeId: result.insertId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('新增员工失败:', error);
    res.status(500).json({
      success: false,
      error: '新增员工失败',
      message: error.message
    });
  }
});

// 辅助函数：获取系统表ID，如果不存在则创建
async function getSystemId(connection, tableName, fieldName, value) {
  if (!value) return null;

  // 先查询是否存在
  const [existing] = await connection.execute(
    `SELECT id FROM ${tableName} WHERE ${fieldName} = ?`,
    [value]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // 不存在则创建
  const [result] = await connection.execute(
    `INSERT INTO ${tableName} (${fieldName}) VALUES (?)`,
    [value]
  );

  return result.insertId;
}

/**
 * 导出员工花名册数据
 */
router.get('/roster/export', async (req, res) => {
  try {
    const {
      region,
      department,
      name,
      position
    } = req.query;

    console.log('收到导出请求:', { region, department, name, position });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 构建WHERE条件（与查询接口相同，直接查employee_roster表）
      let whereConditions = [];
      let queryParams = [];

      if (name && name.trim()) {
        whereConditions.push('name LIKE ?');
        queryParams.push(`%${name.trim()}%`);
      }

      if (department && department.trim()) {
        whereConditions.push('department LIKE ?');
        queryParams.push(`%${department.trim()}%`);
      }

      if (position && position.trim()) {
        whereConditions.push('position LIKE ?');
        queryParams.push(`%${position.trim()}%`);
      }

      if (region && region.trim()) {
        whereConditions.push('region LIKE ?');
        queryParams.push(`%${region.trim()}%`);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // 查询所有符合条件的数据（直接从employee_roster表）
      const dataSql = `
        SELECT
          sequence_number, region, department, position, name, gender, ethnicity,
          political_status, employee_type, insurance_type, birth_date, birthday,
          entry_date, actual_regularization_date, remarks, contract_end_date,
          work_age_months, id_card_number, id_card_address, age, hometown,
          graduation_school, major, education, education_method, graduation_date,
          interviewer_name, marital_status, current_address, personal_contact,
          emergency_contact_name, emergency_contact_phone, bank_card_number,
          bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
          non_compete_agreement, confidentiality_agreement, remarks1, remarks2
        FROM employee_roster
        ${whereClause}
        ORDER BY entry_date DESC
      `;

      console.log('导出查询SQL:', dataSql);
      console.log('导出查询参数:', queryParams);
      const [rows] = await connection.execute(dataSql, queryParams);
      
      console.log('花名册导出查询结果行数:', rows.length);
      if (rows.length > 0) {
        console.log('花名册导出第一行数据:', rows[0]);
      }

      // 格式化数据
      const exportData = rows.map(row => ({
        序列: row.sequence_number,
        区域: row.region || '',
        部门: row.department || '',
        岗位: row.position || '',
        名字: row.name,
        性别: row.gender === 'M' ? '男' : (row.gender === 'F' ? '女' : (row.gender || '')),
        民族: row.ethnicity || '',
        政治面貌: row.political_status || '',
        员工性质: (() => {
          if (!row.employee_type) return '';

          const typeStr = row.employee_type.toString().trim();

          // 如果是数字格式
          const numericMapping = {1: '正式', 2: '试用', 3: '实习'};
          if (numericMapping[typeStr]) {
            return numericMapping[typeStr];
          }

          // 如果包含"正式"、"试用"、"实习"等关键词，提取关键词
          if (typeStr.includes('正式')) return '正式';
          if (typeStr.includes('试用')) return '试用';
          if (typeStr.includes('实习')) return '实习';

          // 如果已经是简单格式，直接返回
          if (['正式', '试用', '实习'].includes(typeStr)) {
            return typeStr;
          }

          // 其他情况返回原值
          return typeStr;
        })(),
        险种: (() => {
          if (!row.insurance_type) return '';
          // 如果是数字格式
          const numericMapping = {1: '社保', 2: '工伤'};
          if (numericMapping[row.insurance_type]) {
            return numericMapping[row.insurance_type];
          }
          // 如果已经是字符串格式，直接返回
          return row.insurance_type;
        })(),
        出生日期: (() => {
          if (!row.birth_date) return '';
          const d = new Date(row.birth_date);
          if (isNaN(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        生日: row.birthday || '',
        入职时间: (() => {
          if (!row.entry_date) return '';
          const d = new Date(row.entry_date);
          if (isNaN(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        实际转正日期: (() => {
          if (!row.actual_regularization_date) return '';
          const d = new Date(row.actual_regularization_date);
          if (isNaN(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        备注: row.remarks || '',
        合同终止日期: (() => {
          if (!row.contract_end_date) return '';
          const d = new Date(row.contract_end_date);
          if (isNaN(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        '工龄（月）': row.work_age_months || 0,
        身份证号: row.id_card_number || '',
        身份证地址: row.id_card_address?.replace(/[\r\n]/g, '') || '',
        年龄: row.age || 0,
        籍贯: row.hometown || '',
        毕业院校: row.graduation_school || '',
        专业: row.major || '',
        学历: row.education || '',
        教育方式: row.education_method || '',
        毕业日期: (() => {
          if (!row.graduation_date) return '';
          const d = new Date(row.graduation_date);
          if (isNaN(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        面试官姓名: row.interviewer_name || '',
        婚姻状况: row.marital_status || '',
        现居住地: row.current_address || '',
        本人联系方式: row.personal_contact || '',
        紧急联系人姓名: row.emergency_contact_name || '',
        紧急联系人电话: row.emergency_contact_phone || '',
        银行卡号: row.bank_card_number || '',
        详细支行信息: row.bank_branch_info || '',
        '劳动关系隶属(*)': row.labor_relation_affiliation || '',
        '社保隶属(*)': row.social_insurance_affiliation || '',
        竞业协议: row.non_compete_agreement || '',
        保密协议: row.confidentiality_agreement || '',
        备注1: row.remarks1 || '',
        备注2: row.remarks2 || ''
      }));

      res.json({
        success: true,
        data: exportData,
        total: exportData.length
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('导出员工数据失败:', error);
    res.status(500).json({
      success: false,
      error: '导出员工数据失败',
      message: error.message
    });
  }
});

/**
 * Excel导入员工数据 - 直接导入到employee_roster表
 */
router.post('/roster/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择要上传的Excel文件' });
    }

    console.log('收到Excel导入请求，文件大小:', req.file.size);

    // 解析Excel文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Excel解析完成，共', jsonData.length, '行数据');
    if (jsonData.length > 0) {
      console.log('Excel数据示例（第一行）:', jsonData[0]);
      console.log('Excel表头字段:', Object.keys(jsonData[0]));
      // 检查关键字段
      console.log('序列字段:', jsonData[0]['序列'] || jsonData[0]['序号']);
      console.log('劳动关系隶属字段:', jsonData[0]['劳动关系隶属(*)'] || jsonData[0]['劳动关系归属']);
      console.log('社保隶属字段:', jsonData[0]['社保隶属(*)'] || jsonData[0]['社保归属']);
      console.log('员工性质字段:', jsonData[0]['员工性质']);
    }

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel文件中没有数据' });
    }

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        try {
          // 验证必填字段 - 支持多种列名格式
          const name = row['姓名'] || row['名字'] || row['name'];
          if (!name) {
            errors.push(`第${i + 2}行：缺少必填字段（姓名）`);
            errorCount++;
            continue;
          }

          // 直接插入employee_roster表
          const insertSql = `
            INSERT INTO employee_roster (
              sequence_number, region, department, position, name, gender, ethnicity,
              political_status, employee_type, insurance_type, birth_date, birthday,
              entry_date, actual_regularization_date, remarks, contract_end_date,
              work_age_months, id_card_number, id_card_address, age, hometown,
              graduation_school, major, education, education_method, graduation_date,
              interviewer_name, marital_status, current_address, personal_contact,
              emergency_contact_name, emergency_contact_phone, bank_card_number,
              bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
              non_compete_agreement, confidentiality_agreement, remarks1, remarks2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          // 辅助函数：解析日期 - 避免时区转换
          const parseExcelDate = (dateValue) => {
            if (!dateValue) return null;
            try {
              let date;
              // 如果是Excel序列号
              if (typeof dateValue === 'number') {
                date = new Date((dateValue - 25569) * 86400 * 1000);
              } else {
                // 如果是字符串日期
                date = new Date(dateValue);
              }

              if (isNaN(date.getTime())) return null;

              // 使用本地时间格式化，避免时区转换
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } catch (e) {
              return null;
            }
          };

          // 计算年龄
          const calcAge = (birthDate) => {
            if (!birthDate) return null;
            try {
              const birth = new Date(birthDate);
              const today = new Date();
              let age = today.getFullYear() - birth.getFullYear();
              const monthDiff = today.getMonth() - birth.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
              }
              return age;
            } catch (e) {
              return null;
            }
          };

          // 计算工龄月数
          const calcWorkMonths = (entryDate) => {
            if (!entryDate) return null;
            try {
              const entry = new Date(entryDate);
              const today = new Date();
              const months = (today.getFullYear() - entry.getFullYear()) * 12 + (today.getMonth() - entry.getMonth());
              return Math.max(0, months);
            } catch (e) {
              return null;
            }
          };

          const entryDate = parseExcelDate(row['入职时间'] || row['入职日期']);
          const birthDate = parseExcelDate(row['出生日期'] || row['生日']);

          await connection.execute(insertSql, [
            row['序列'] || row['序号'] || null,  // 支持"序列"和"序号"两种表头
            row['区域'] || null,
            row['部门'] || null,
            row['岗位'] || row['职位'] || null,
            name,
            row['性别'] || null,
            row['民族'] || null,
            row['政治面貌'] || null,
            row['员工性质'] || null,
            row['险种'] || null,
            birthDate,
            parseExcelDate(row['生日']),
            entryDate,
            parseExcelDate(row['实际转正日期']),
            row['备注'] || null,
            parseExcelDate(row['合同终止日期']),
            calcWorkMonths(entryDate),
            row['身份证号'] || null,
            row['身份证地址'] || null,
            calcAge(birthDate),
            row['籍贯'] || row['家乡'] || null,
            row['毕业院校'] || null,
            row['专业'] || null,
            row['学历'] || null,
            row['教育方式'] || null,
            parseExcelDate(row['毕业日期']),
            row['面试官姓名'] || null,
            row['婚姻状况'] || null,
            row['现居住地'] || null,
            row['本人联系方式'] || null,
            row['紧急联系人姓名'] || null,
            row['紧急联系人电话'] || null,
            row['银行卡号'] || null,
            row['详细支行信息'] || null,
            row['劳动关系隶属(*)'] || row['劳动关系归属'] || null,  // 支持带星号的标准表头
            row['社保隶属(*)'] || row['社保归属'] || null,  // 支持带星号的标准表头
            row['竞业协议'] || null,
            row['保密协议'] || null,
            row['备注1'] || null,
            row['备注2'] || null
          ]);

          successCount++;

        } catch (error) {
          console.error(`处理第${i + 2}行数据时出错:`, error);
          errors.push(`第${i + 2}行：${error.message}`);
          errorCount++;
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `导入完成！成功：${successCount}条，失败：${errorCount}条`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // 只返回前10个错误
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Excel导入失败:', error);
    res.status(500).json({
      success: false,
      error: 'Excel导入失败',
      message: error.message
    });
  }
});

// 辅助函数：解析日期 - 避免时区转换
function parseDate(dateStr) {
  if (!dateStr) return null;

  let date;
  // 处理Excel日期格式
  if (typeof dateStr === 'number') {
    // Excel日期序列号转换
    date = new Date((dateStr - 25569) * 86400 * 1000);
  } else if (typeof dateStr === 'string') {
    date = new Date(dateStr);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  // 使用本地时间格式化，避免时区转换
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 辅助函数：解析员工类型
function parseEmployeeType(typeStr) {
  if (!typeStr) return 1;
  if (typeStr.includes('正式')) return 1;
  if (typeStr.includes('试用')) return 2;
  if (typeStr.includes('实习')) return 3;
  return 1;
}

// 辅助函数：解析保险类型
function parseInsuranceType(typeStr) {
  if (!typeStr) return null;
  if (typeStr.includes('社保')) return 1;
  if (typeStr.includes('工伤')) return 2;
  return null;
}

// 辅助函数：获取或创建系统表ID
async function getOrCreateSystemId(connection, tableName, fieldName, value) {
  if (!value) return null;

  // 先查询是否存在
  const [existing] = await connection.execute(
    `SELECT id FROM ${tableName} WHERE ${fieldName} = ?`,
    [value]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // 不存在则创建
  const [result] = await connection.execute(
    `INSERT INTO ${tableName} (${fieldName}) VALUES (?)`,
    [value]
  );

  return result.insertId;
}

/**
 * 更新员工基本信息
 */
router.put('/roster/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const updateData = req.body;
    console.log('收到更新员工请求:', { employeeId, updateData });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 计算工龄和年龄
      const calcWorkMonths = (entryDate) => {
        if (!entryDate) return null;
        const entry = new Date(entryDate);
        const now = new Date();
        const diffTime = Math.abs(now - entry);
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // 平均每月30.44天
        return diffMonths;
      };

      const calcAge = (birthDate) => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      };

      // 动态构建更新SQL，只更新有值的字段
      const updateFields = [];
      const updateValues = [];

      // 定义字段映射
      const fieldMappings = {
        sequence_number: 'sequence_number',
        region: 'region',
        department: 'department',
        position: 'position',
        name: 'name',
        gender: 'gender',
        ethnicity: 'ethnicity',
        political_status: 'political_status',
        employee_type: 'employee_type',
        insurance_type: 'insurance_type',
        birth_date: 'birth_date',
        birthday: 'birthday',
        entry_date: 'entry_date',
        actual_regularization_date: 'actual_regularization_date',
        remarks: 'remarks',
        contract_end_date: 'contract_end_date',
        id_card_number: 'id_card_number',
        id_card_address: 'id_card_address',
        hometown: 'hometown',
        graduation_school: 'graduation_school',
        major: 'major',
        education: 'education',
        education_method: 'education_method',
        graduation_date: 'graduation_date',
        interviewer_name: 'interviewer_name',
        marital_status: 'marital_status',
        current_address: 'current_address',
        personal_contact: 'personal_contact',
        emergency_contact_name: 'emergency_contact_name',
        emergency_contact_phone: 'emergency_contact_phone',
        bank_card_number: 'bank_card_number',
        bank_branch_info: 'bank_branch_info',
        labor_relation_affiliation: 'labor_relation_affiliation',
        social_insurance_affiliation: 'social_insurance_affiliation',
        non_compete_agreement: 'non_compete_agreement',
        confidentiality_agreement: 'confidentiality_agreement',
        status: 'status',
        resignation_date: 'resignation_date',
        resignation_reason: 'resignation_reason',
        remarks1: 'remarks1',
        remarks2: 'remarks2',
        remarks3: 'remarks3'
      };

      // 遍历更新数据，只添加有值的字段
      Object.keys(fieldMappings).forEach(field => {
        if (updateData.hasOwnProperty(field) && updateData[field] !== undefined) {
          updateFields.push(`${fieldMappings[field]} = ?`);
          updateValues.push(updateData[field] || null);
        }
      });

      // 如果有入职时间更新，自动计算工龄
      if (updateData.entry_date) {
        updateFields.push('work_age_months = ?');
        updateValues.push(calcWorkMonths(updateData.entry_date));
      }

      // 如果有出生日期更新，自动计算年龄
      if (updateData.birth_date) {
        updateFields.push('age = ?');
        updateValues.push(calcAge(updateData.birth_date));
      }

      if (updateFields.length === 0) {
        throw new Error('没有需要更新的字段');
      }

      // 添加WHERE条件的参数
      updateValues.push(employeeId, updateData.originalName || updateData.name);

      const updateSql = `
        UPDATE employee_info
        SET ${updateFields.join(', ')}
        WHERE sequence_number = ? OR name = ?
      `;

      console.log('更新SQL:', updateSql);
      console.log('更新参数:', updateValues);

      await connection.execute(updateSql, updateValues);

      await connection.commit();

      res.json({
        success: true,
        message: '员工信息更新成功'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('更新员工信息失败:', error);
    res.status(500).json({ error: '更新员工信息失败' });
  }
});

/**
 * 员工离职操作
 */
router.post('/resignation', async (req, res) => {
  try {
    const resignationData = req.body;
    console.log('收到离职请求:', resignationData);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. 从花名册获取员工完整信息
      const getEmployeeSql = `
        SELECT * FROM employee_roster
        WHERE sequence_number = ? OR name = ?
      `;

      const [employeeRows] = await connection.execute(getEmployeeSql, [
        resignationData.employeeId,
        resignationData.name
      ]);

      if (employeeRows.length === 0) {
        throw new Error('未找到该员工信息');
      }

      const employee = employeeRows[0];

      // 2. 将员工信息插入到离职监控表
      const insertResignationSql = `
        INSERT INTO resignation_monitoring (
          sequence_number, region, department, position, name, gender, ethnicity,
          political_status, employee_type, insurance_type, birth_date, birthday,
          entry_date, actual_regularization_date, remarks, contract_end_date,
          work_age_months, id_card_number, id_card_address, age, hometown,
          graduation_school, major, education, education_method, graduation_date,
          interviewer_name, marital_status, current_address, personal_contact,
          emergency_contact_name, emergency_contact_phone, bank_card_number,
          bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
          non_compete_agreement, confidentiality_agreement,
          resignation_date, resignation_type, resignation_reason, resignation_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;
      // 安全格式化离职日期
      const resignation_date = (() => {
        if (!resignationData.resignation_date) return null;
        const d = new Date(resignationData.resignation_date);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      await connection.execute(insertResignationSql, [
        employee.sequence_number, employee.region, employee.department, employee.position,
        employee.name, employee.gender, employee.ethnicity, employee.political_status,
        employee.employee_type, employee.insurance_type, employee.birth_date, employee.birthday,
        employee.entry_date, employee.actual_regularization_date, employee.remarks,
        employee.contract_end_date, employee.work_age_months, employee.id_card_number,
        employee.id_card_address, employee.age, employee.hometown, employee.graduation_school,
        employee.major, employee.education, employee.education_method, employee.graduation_date,
        employee.interviewer_name, employee.marital_status, employee.current_address,
        employee.personal_contact, employee.emergency_contact_name, employee.emergency_contact_phone,
        employee.bank_card_number, employee.bank_branch_info, employee.labor_relation_affiliation,
        employee.social_insurance_affiliation, employee.non_compete_agreement,
        employee.confidentiality_agreement,
        resignation_date, resignationData.resignation_type,
        resignationData.resignation_reason, resignationData.resignation_remarks
      ]);

      // 3. 从花名册删除该员工
      const deleteEmployeeSql = `
        DELETE FROM employee_roster
        WHERE sequence_number = ? OR name = ?
      `;

      await connection.execute(deleteEmployeeSql, [
        resignationData.employeeId,
        resignationData.name
      ]);

      await connection.commit();

      res.json({
        success: true,
        message: '离职操作完成，员工信息已迁移到离职监控表'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('离职操作失败:', error);
    res.status(500).json({ error: error.message || '离职操作失败' });
  }
});

/**
 * 员工调动操作
 */
router.post('/transfer', async (req, res) => {
  try {
    const transferData = req.body;
    console.log('收到调动请求:', transferData);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. 首先检查并添加new_department字段（如果不存在）
      try {
        await connection.execute(`
          ALTER TABLE personnel_changes
          ADD COLUMN new_department VARCHAR(100) COMMENT '新部门'
          AFTER new_position
        `);
        console.log('已添加new_department字段到personnel_changes表');
      } catch (error) {
        // 字段已存在，忽略错误
        if (!error.message.includes('Duplicate column name')) {
          console.error('添加new_department字段失败:', error);
        }
      }

      // 2. 插入调动记录到人员异动表
      const insertTransferSql = `
        INSERT INTO personnel_changes (
          department, name, original_position, new_position, new_department,
          change_date, change_reason, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const change_date = new Date(transferData.change_date).toISOString().split('T')[0]
      await connection.execute(insertTransferSql, [
        transferData.department || transferData.original_department,
        transferData.name,
        transferData.original_position,
        transferData.new_position,
        transferData.new_department || transferData.department, // 新部门字段
        change_date,
        // 兼容前端可能传入的 change_type 或 change_reason
        transferData.change_reason || transferData.change_type,
        transferData.remarks || transferData.change_remarks
      ]);

      // 3. 更新花名册中的岗位和部门信息
      let updateFields = [];
      let updateValues = [];

      // 如果是岗位调动
      if (transferData.new_position && transferData.new_position !== transferData.original_position) {
        updateFields.push('position = ?');
        updateValues.push(transferData.new_position);
      }

      // 如果是部门调动
      if (transferData.new_department && transferData.new_department !== transferData.original_department) {
        updateFields.push('department = ?');
        updateValues.push(transferData.new_department);
      }

      // 如果有需要更新的字段
      if (updateFields.length > 0) {
        updateValues.push(transferData.employeeId, transferData.name);

        const updateSql = `
          UPDATE employee_info
          SET ${updateFields.join(', ')}
          WHERE sequence_number = ? OR name = ?
        `;

        await connection.execute(updateSql, updateValues);
        console.log('已更新花名册中的员工信息');
      }

      await connection.commit();

      res.json({
        success: true,
        message: '调动操作完成，记录已保存到人员异动表'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('调动操作失败:', error);
    res.status(500).json({ error: error.message || '调动操作失败' });
  }
});

/**
 * 删除离职记录
 */
router.delete('/resignation/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    console.log('收到删除离职记录请求:', recordId);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const deleteSql = `DELETE FROM resignation_monitoring WHERE id = ?`;
      const [result] = await connection.execute(deleteSql, [recordId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '离职记录不存在' });
      }

      res.json({
        success: true,
        message: '离职记录删除成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('删除离职记录失败:', error);
    res.status(500).json({ error: '删除离职记录失败' });
  }
});

/**
 * 更新离职记录
 */
router.put('/resignation/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    const updateData = req.body;
    console.log('收到更新离职记录请求:', { recordId, updateData });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const updateSql = `
        UPDATE resignation_monitoring
        SET resignation_date = ?, resignation_type = ?, resignation_reason = ?, resignation_remarks = ?
        WHERE id = ?
      `;

      const resignation_date = new Date(updateData.resignation_date).toISOString().split('T')[0]
      const [result] = await connection.execute(updateSql, [
        resignation_date,
        updateData.resignation_type,
        updateData.resignation_reason,
        updateData.resignation_remarks,
        recordId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '离职记录不存在' });
      }

      res.json({
        success: true,
        message: '离职记录更新成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('更新离职记录失败:', error);
    res.status(500).json({ error: '更新离职记录失败' });
  }
});

/**
 * 更新异动记录（使用组合键，因为表没有主键id）
 */
router.put('/changes', async (req, res) => {
  try {
    const { updateKey, ...updateData } = req.body;
    console.log('收到更新异动记录请求:', { updateKey, updateData });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const updateSql = `
        UPDATE personnel_changes
        SET department = ?, name = ?, original_position = ?, new_position = ?,
            change_date = ?, change_reason = ?, remarks = ?
        WHERE department = ? AND name = ? AND change_date = ?
      `;

      const [result] = await connection.execute(updateSql, [
        updateData.department,
        updateData.name,
        updateData.original_position,
        updateData.new_position,
        updateData.change_date,
        updateData.change_reason,
        updateData.remarks,
        updateKey.originalDepartment,
        updateKey.originalName,
        updateKey.originalDate
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '异动记录不存在' });
      }

      res.json({
        success: true,
        message: '异动记录更新成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('更新异动记录失败:', error);
    res.status(500).json({ error: '更新异动记录失败' });
  }
});

/**
 * 删除异动记录（使用组合键，因为表没有主键id）
 */
router.delete('/changes', async (req, res) => {
  try {
    const { department, name, change_date } = req.body;
    console.log('收到删除异动记录请求:', { department, name, change_date });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const deleteSql = `DELETE FROM personnel_changes WHERE department = ? AND name = ? AND change_date = ?`;
      const [result] = await connection.execute(deleteSql, [department, name, change_date]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '异动记录不存在' });
      }

      res.json({
        success: true,
        message: '异动记录删除成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('删除异动记录失败:', error);
    res.status(500).json({ error: '删除异动记录失败' });
  }
});

/**
 * 获取在职离职信息列表
 */
router.get('/status-info', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      region,
      department,
      name,
      position,
      status,
      sortField,
      sortOrder
    } = req.query;

    console.log('收到在职离职信息请求:', { page, pageSize, region, department, name, position, status, sortField, sortOrder });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      let whereConditions = [];
      let params = [];

      if (region) {
        whereConditions.push('region LIKE ?');
        params.push(`%${region}%`);
      }

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      if (position) {
        whereConditions.push('position LIKE ?');
        params.push(`%${position}%`);
      }

      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM employee_info ${whereClause}`;
      const [countResult] = await connection.execute(countSql, params);
      const total = countResult[0].total;

      // 获取分页数据
      const limit = Number.parseInt(pageSize, 10) || 20;
      const offset = (Number.parseInt(page, 10) - 1) * limit;
      const dataSql = `
        SELECT
          id, sequence_number, region, department, position, name, gender, ethnicity,
          political_status, employee_type, insurance_type, birth_date, birthday,
          entry_date, actual_regularization_date, remarks, contract_end_date, work_age_months,
          id_card_number, id_card_address, age, hometown, graduation_school, major, education,
          education_method, graduation_date, interviewer_name, marital_status, current_address,
          personal_contact, emergency_contact_name, emergency_contact_phone, bank_card_number,
          bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
          non_compete_agreement, confidentiality_agreement, status, resignation_date,
          resignation_reason, remarks1, remarks2, remarks3
        FROM employee_info
        ${whereClause}
        ${buildOrderClause(sortField, sortOrder)}
        LIMIT ${limit} OFFSET ${offset}
      `;

      console.log('执行在职离职信息查询SQL:', dataSql);
      console.log('执行在职离职信息查询参数:', params);
      const [rows] = await connection.execute(dataSql, params);

      // 安全的日期格式化函数
      const safeFormatDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date;
        }
        return date;
      };

      // 转换数据格式
      const transformedRows = rows.map(row => ({
        ...row,
        birth_date: safeFormatDate(row.birth_date),
        entry_date: safeFormatDate(row.entry_date),
        actual_regularization_date: safeFormatDate(row.actual_regularization_date),
        contract_end_date: safeFormatDate(row.contract_end_date),
        graduation_date: safeFormatDate(row.graduation_date),
        resignation_date: safeFormatDate(row.resignation_date)
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
    console.error('获取在职离职信息失败:', error);
    res.status(500).json({ error: '获取在职离职信息失败' });
  }
});

/**
 * 导出在职离职信息
 */
router.get('/status-info/export', async (req, res) => {
  try {
    const { region, department, name, position, status } = req.query;
    console.log('收到在职离职信息导出请求:', { region, department, name, position, status });

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 构建WHERE条件
      let whereConditions = [];
      let params = [];

      if (region) {
        whereConditions.push('region LIKE ?');
        params.push(`%${region}%`);
      }

      if (department) {
        whereConditions.push('department LIKE ?');
        params.push(`%${department}%`);
      }

      if (name) {
        whereConditions.push('name LIKE ?');
        params.push(`%${name}%`);
      }

      if (position) {
        whereConditions.push('position LIKE ?');
        params.push(`%${position}%`);
      }

      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询employee_info表的所有字段
      const dataSql = `
        SELECT *
        FROM employee_info
        ${whereClause}
        ORDER BY entry_date DESC
      `;

      console.log('导出在职离职信息SQL:', dataSql);
      console.log('导出在职离职信息参数:', params);
      const [rows] = await connection.execute(dataSql, params);

      // 直接返回employee_info表的所有数据，稳健格式化日期字段
      const safeFormatDate = (val) => {
        if (!val) return '';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return '';
          // 使用本地时间格式化，避免时区转换
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return '';
        }
      };

      const exportData = rows.map(row => ({
        序列: row.sequence_number || '',
        区域: row.region || '',
        部门: row.department || '',
        岗位: row.position || '',
        名字: row.name || '',
        性别: row.gender || '',
        民族: row.ethnicity || '',
        政治面貌: row.political_status || '',
        员工性质: row.employee_type || '',
        险种: row.insurance_type || '',
        出生日期: safeFormatDate(row.birth_date),
        生日: row.birthday || '',
        入职时间: safeFormatDate(row.entry_date),
        实际转正日期: safeFormatDate(row.actual_regularization_date),
        备注: row.remarks || '',
        合同终止日期: safeFormatDate(row.contract_end_date),
        '工龄（月）': (row.work_age_months ?? '').toString(),
        身份证号: row.id_card_number || '',
        身份证地址: row.id_card_address || '',
        年龄: (row.age ?? '').toString(),
        籍贯: row.hometown || '',
        毕业院校: row.graduation_school || '',
        专业: row.major || '',
        学历: row.education || '',
        教育方式: row.education_method || '',
        毕业日期: safeFormatDate(row.graduation_date),
        面试官姓名: row.interviewer_name || '',
        婚姻状况: row.marital_status || '',
        现居住地: row.current_address || '',
        本人联系方式: row.personal_contact || '',
        紧急联系人姓名: row.emergency_contact_name || '',
        紧急联系人电话: row.emergency_contact_phone || '',
        银行卡号: row.bank_card_number || '',
        详细支行信息: row.bank_branch_info || '',
        '劳动关系隶属(*)': row.labor_relation_affiliation || '',
        '社保隶属(*)': row.social_insurance_affiliation || '',
        竞业协议: row.non_compete_agreement || '',
        保密协议: row.confidentiality_agreement || '',
        离职时间: safeFormatDate(row.resignation_date),
        状态: row.status || '',
        离职原因: row.resignation_reason || '',
        备注1: row.remarks1 || '',
        备注2: row.remarks2 || '',
        备注3: row.remarks3 || ''
      }));

      res.json({
        success: true,
        data: exportData,
        total: exportData.length
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('导出在职离职信息失败:', error);
    res.status(500).json({ error: '导出在职离职信息失败', message: error.message });
  }
});

/**
 * 导入在职离职信息
 */
router.post('/status-info/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择要上传的Excel文件' });
    }

    console.log('收到在职离职信息Excel导入请求，文件大小:', req.file.size);

    // 解析Excel文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Excel解析完成，共', jsonData.length, '行数据');
    if (jsonData.length > 0) {
      console.log('Excel数据示例（第一行）:', jsonData[0]);
      console.log('Excel表头字段:', Object.keys(jsonData[0]));
    }

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel文件中没有数据' });
    }

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        try {
          // 验证必填字段
          const name = row['姓名'] || row['名字'] || row['name'];
          if (!name) {
            errors.push(`第${i + 2}行：缺少必填字段（姓名）`);
            errorCount++;
            continue;
          }

          // 直接插入employee_info表
          const insertSql = `
            INSERT INTO employee_info (
              sequence_number, region, department, position, name, gender, ethnicity,
              political_status, employee_type, insurance_type, birth_date, birthday,
              entry_date, actual_regularization_date, remarks, contract_end_date,
              work_age_months, id_card_number, id_card_address, age, hometown,
              graduation_school, major, education, education_method, graduation_date,
              interviewer_name, marital_status, current_address, personal_contact,
              emergency_contact_name, emergency_contact_phone, bank_card_number,
              bank_branch_info, labor_relation_affiliation, social_insurance_affiliation,
              non_compete_agreement, confidentiality_agreement, status, resignation_date,
              resignation_reason, remarks1, remarks2, remarks3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          // 辅助函数：解析日期
          const parseExcelDate = (dateValue) => {
            if (!dateValue) return null;
            try {
              let date;
              if (typeof dateValue === 'number') {
                date = new Date((dateValue - 25569) * 86400 * 1000);
              } else {
                date = new Date(dateValue);
              }

              if (isNaN(date.getTime())) return null;

              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } catch (e) {
              return null;
            }
          };

          // 计算年龄
          const calcAge = (birthDate) => {
            if (!birthDate) return null;
            try {
              const birth = new Date(birthDate);
              const today = new Date();
              let age = today.getFullYear() - birth.getFullYear();
              const monthDiff = today.getMonth() - birth.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
              }
              return age;
            } catch (e) {
              return null;
            }
          };

          // 计算工龄月数
          const calcWorkMonths = (entryDate) => {
            if (!entryDate) return null;
            try {
              const entry = new Date(entryDate);
              const today = new Date();
              const months = (today.getFullYear() - entry.getFullYear()) * 12 + (today.getMonth() - entry.getMonth());
              return Math.max(0, months);
            } catch (e) {
              return null;
            }
          };

          const entryDate = parseExcelDate(row['入职时间'] || row['入职日期']);
          const birthDate = parseExcelDate(row['出生日期'] || row['生日']);

          await connection.execute(insertSql, [
            row['序列'] || row['序号'] || null,
            row['区域'] || null,
            row['部门'] || null,
            row['岗位'] || row['职位'] || null,
            name,
            row['性别'] || null,
            row['民族'] || null,
            row['政治面貌'] || null,
            row['员工性质'] || null,
            row['险种'] || null,
            birthDate,
            parseExcelDate(row['生日']),
            entryDate,
            parseExcelDate(row['实际转正日期']),
            row['备注'] || null,
            parseExcelDate(row['合同终止日期']),
            calcWorkMonths(entryDate),
            row['身份证号'] || null,
            row['身份证地址'] || null,
            calcAge(birthDate),
            row['籍贯'] || row['家乡'] || null,
            row['毕业院校'] || null,
            row['专业'] || null,
            row['学历'] || null,
            row['教育方式'] || null,
            parseExcelDate(row['毕业日期']),
            row['面试官姓名'] || null,
            row['婚姻状况'] || null,
            row['现居住地'] || null,
            row['本人联系方式'] || null,
            row['紧急联系人姓名'] || null,
            row['紧急联系人电话'] || null,
            row['银行卡号'] || null,
            row['详细支行信息'] || null,
            row['劳动关系隶属(*)'] || row['劳动关系归属'] || null,
            row['社保隶属(*)'] || row['社保归属'] || null,
            row['竞业协议'] || null,
            row['保密协议'] || null,
            row['状态'] || '在职',
            parseExcelDate(row['离职时间']),
            row['离职原因'] || null,
            row['备注1'] || null,
            row['备注2'] || null,
            row['备注3'] || null
          ]);

          successCount++;

        } catch (error) {
          console.error(`处理第${i + 2}行数据时出错:`, error);
          errors.push(`第${i + 2}行：${error.message}`);
          errorCount++;
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `导入完成！成功：${successCount}条，失败：${errorCount}条`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10)
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Excel导入失败:', error);
    res.status(500).json({
      success: false,
      error: 'Excel导入失败',
      message: error.message
    });
  }
});

/**
 * 删除单个员工信息
 */
router.delete('/status-info/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log('收到删除员工信息请求:', employeeId);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const deleteSql = `DELETE FROM employee_info WHERE id = ?`;
      const [result] = await connection.execute(deleteSql, [employeeId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '员工信息不存在' });
      }

      res.json({
        success: true,
        message: '员工信息删除成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('删除员工信息失败:', error);
    res.status(500).json({ error: '删除员工信息失败' });
  }
});

/**
 * 删除所有在职离职信息
 */
router.delete('/status-info/all', async (req, res) => {
  try {
    console.log('收到删除所有在职离职信息请求');

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      const deleteSql = `DELETE FROM employee_info`;
      const [result] = await connection.execute(deleteSql);

      res.json({
        success: true,
        message: `已删除所有员工信息，共${result.affectedRows}条记录`
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('删除所有在职离职信息失败:', error);
    res.status(500).json({ error: '删除所有在职离职信息失败' });
  }
});

module.exports = router;
