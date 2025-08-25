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
        ORDER BY entry_date DESC
        LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
      `;

      console.log('执行查询SQL:', dataSql);
      console.log('查询参数:', queryParams);

      const [rows] = await connection.execute(dataSql, queryParams);

      console.log('数据库查询结果:', rows.length, '条记录');

      // 转换数据 - 完整的数据转换，包含工龄计算和日期格式化
      const transformedRows = rows.map((row, index) => {
        console.log(`处理第 ${index + 1} 行: ${row.name}, 区域: ${row.region}, 入职时间: ${row.entry_date}, 工龄月数: ${row.work_age_months}`);

        // 计算工龄分组
        const workAgeGroup = transformWorkAge(row.work_age_months);
        const educationGroup = transformEducation(row.education);
        const organizationRegion = transformRegion(row.region);

        // 格式化日期
        const formatDate = (date) => {
          if (!date) return null;
          if (date instanceof Date) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD 格式
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

          // 基本信息转换
          gender: row.gender || '未知',
          region: row.region || '未知',
          department: row.department || '未知',
          position: row.position || '未知',
          education: row.education || '未知',
          education_method: row.education_method || '未知',
          political_status: row.political_status || '未知',
          marital_status: row.marital_status || '未知',
          hometown: row.hometown || '未知',

          // 员工类型转换
          employee_type: {1: '正式', 2: '试用', 3: '实习'}[row.employee_type] || '未知',

          // 保险类型转换
          insurance_type: {1: '社保', 2: '工伤'}[row.insurance_type] || '无',

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
           srt.region_type as resignation_type,
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

/**
 * 新增员工
 */
router.post('/roster', async (req, res) => {
  try {
    const employeeData = req.body;
    console.log('收到新增员工请求:', employeeData);

    const pool = req.pool;
    const connection = await pool.getConnection();

    try {
      // 开始事务
      await connection.beginTransaction();

      // 1. 插入员工基本信息
      const basicInfoSql = `
        INSERT INTO employee_basic_info (
          name, gender, birth_date, native_place, id_number, id_address,
          current_address, phone_number, emergency_contact_name, emergency_contact_phone,
          bank_account, bank_branch, graduation_school, major, graduation_date,
          interviewer_name, education_id, education_mode_id, political_status_id, marital_status_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [basicResult] = await connection.execute(basicInfoSql, [
        employeeData.name,
        employeeData.gender === '男' ? 'M' : (employeeData.gender === '女' ? 'F' : 'O'),
        employeeData.birth_date,
        employeeData.hometown,
        employeeData.id_card_number,
        employeeData.id_card_address,
        employeeData.current_address,
        employeeData.personal_contact,
        employeeData.emergency_contact_name,
        employeeData.emergency_contact_phone,
        employeeData.bank_card_number,
        employeeData.bank_branch_info,
        employeeData.graduation_school,
        employeeData.major,
        employeeData.graduation_date,
        employeeData.interviewer_name,
        await getSystemId(connection, 'sys_education', 'education', employeeData.education),
        await getSystemId(connection, 'sys_education_mode', 'education_mode', employeeData.education_method),
        await getSystemId(connection, 'sys_political_status', 'political_status', employeeData.political_status),
        await getSystemId(connection, 'sys_marital_status', 'marital_status', employeeData.marital_status)
      ]);

      const employeeId = basicResult.insertId;

      // 2. 插入员工职位信息
      const positionInfoSql = `
        INSERT INTO employee_position_info (
          employee_id, region_id, department_id, position_id, employee_type,
          insurance_type, entry_date, actual_regularization_date, contract_end_date, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(positionInfoSql, [
        employeeId,
        await getSystemId(connection, 'sys_region', 'region', employeeData.region),
        await getSystemId(connection, 'sys_department', 'department', employeeData.department),
        await getSystemId(connection, 'sys_position', 'position', employeeData.position),
        employeeData.employee_type === '正式' ? 1 : (employeeData.employee_type === '试用' ? 2 : 3),
        employeeData.insurance_type === '社保' ? 1 : (employeeData.insurance_type === '工伤' ? 2 : null),
        employeeData.entry_date,
        employeeData.actual_regularization_date,
        employeeData.contract_end_date,
        employeeData.remarks
      ]);

      // 提交事务
      await connection.commit();

      res.json({
        success: true,
        message: '员工添加成功',
        employeeId: employeeId
      });

    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
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
      // 构建WHERE条件（与查询接口相同）
      let whereConditions = [];
      let queryParams = [];

      if (name && name.trim()) {
        whereConditions.push('ebi.name LIKE ?');
        queryParams.push(`%${name.trim()}%`);
      }

      if (department && department.trim()) {
        whereConditions.push('sd.department LIKE ?');
        queryParams.push(`%${department.trim()}%`);
      }

      if (position && position.trim()) {
        whereConditions.push('sp.position LIKE ?');
        queryParams.push(`%${position.trim()}%`);
      }

      if (region && region.trim()) {
        whereConditions.push('sr.region LIKE ?');
        queryParams.push(`%${region.trim()}%`);
      }

      const whereClause = whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : '';

      // 查询所有符合条件的数据
      const dataSql = `
        SELECT
          ROW_NUMBER() OVER (ORDER BY epi.entry_date DESC) as sequence_number,
          sr.region,
          sd.department,
          sp.position,
          ebi.name,
          ebi.gender,
          '汉族' as ethnicity,
          sps.political_status,
          CASE epi.employee_type
            WHEN 1 THEN '正式'
            WHEN 2 THEN '试用'
            WHEN 3 THEN '实习'
            ELSE '未知'
          END as employee_type,
          CASE epi.insurance_type
            WHEN 1 THEN '社保'
            WHEN 2 THEN '工伤'
            ELSE '无'
          END as insurance_type,
          ebi.birth_date,
          DATE_FORMAT(ebi.birth_date, '%m-%d') as birthday,
          epi.entry_date,
          epi.actual_regularization_date,
          epi.remarks,
          epi.contract_end_date,
          TIMESTAMPDIFF(MONTH, epi.entry_date, CURDATE()) as work_age_months,
          ebi.id_number as id_card_number,
          ebi.id_address as id_card_address,
          TIMESTAMPDIFF(YEAR, ebi.birth_date, CURDATE()) as age,
          ebi.native_place as hometown,
          ebi.graduation_school,
          ebi.major,
          se.education,
          sem.education_mode as education_method,
          ebi.graduation_date,
          ebi.interviewer_name,
          sms.marital_status,
          ebi.current_address,
          ebi.phone_number as personal_contact,
          ebi.emergency_contact_name,
          ebi.emergency_contact_phone,
          ebi.bank_account as bank_card_number,
          ebi.bank_branch as bank_branch_info,
          '' as labor_relationship,
          '' as social_security_affiliation,
          '' as non_compete_agreement,
          '' as confidentiality_agreement,
          '' as remarks1,
          '' as remarks2
        FROM employee_basic_info ebi
        JOIN employee_position_info epi ON ebi.id = epi.employee_id
        LEFT JOIN sys_region sr ON epi.region_id = sr.id
        LEFT JOIN sys_department sd ON epi.department_id = sd.id
        LEFT JOIN sys_position sp ON epi.position_id = sp.id
        LEFT JOIN sys_education se ON ebi.education_id = se.id
        LEFT JOIN sys_education_mode sem ON ebi.education_mode_id = sem.id
        LEFT JOIN sys_political_status sps ON ebi.political_status_id = sps.id
        LEFT JOIN sys_marital_status sms ON ebi.marital_status_id = sms.id
        WHERE 1=1 ${whereClause}
        ORDER BY epi.entry_date DESC
      `;

      const [rows] = await connection.execute(dataSql, queryParams);

      // 格式化数据
      const exportData = rows.map(row => ({
        序列: row.sequence_number,
        区域: row.region || '未知',
        部门: row.department || '未知',
        岗位: row.position || '未知',
        名字: row.name,
        性别: row.gender === 'M' ? '男' : (row.gender === 'F' ? '女' : '其他'),
        民族: row.ethnicity,
        政治面貌: row.political_status || '未知',
        员工性质: row.employee_type,
        险种: row.insurance_type,
        出生日期: row.birth_date ? new Date(row.birth_date).toISOString().split('T')[0] : '',
        生日: row.birthday || '',
        入职时间: row.entry_date ? new Date(row.entry_date).toISOString().split('T')[0] : '',
        实际转正日期: row.actual_regularization_date ? new Date(row.actual_regularization_date).toISOString().split('T')[0] : '',
        备注: row.remarks || '',
        合同终止日期: row.contract_end_date ? new Date(row.contract_end_date).toISOString().split('T')[0] : '',
        '工龄（月）': row.work_age_months || 0,
        身份证号: row.id_card_number || '',
        身份证地址: row.id_card_address?.replace(/[\r\n]/g, '') || '',
        年龄: row.age || 0,
        籍贯: row.hometown || '',
        毕业院校: row.graduation_school || '',
        专业: row.major || '',
        学历: row.education || '',
        教育方式: row.education_method || '',
        毕业日期: row.graduation_date ? new Date(row.graduation_date).toISOString().split('T')[0] : '',
        面试官姓名: row.interviewer_name || '',
        婚姻状况: row.marital_status || '',
        现居住地: row.current_address || '',
        本人联系方式: row.personal_contact || '',
        紧急联系人姓名: row.emergency_contact_name || '',
        紧急联系人电话: row.emergency_contact_phone || '',
        银行卡号: row.bank_card_number || '',
        详细支行信息: row.bank_branch_info || '',
        '劳动关系隶属(*)': row.labor_relationship,
        '社保隶属(*)': row.social_security_affiliation,
        竞业协议: row.non_compete_agreement,
        保密协议: row.confidentiality_agreement,
        备注1: row.remarks1,
        备注2: row.remarks2
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
 * Excel导入员工数据
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
          if (!row['名字'] || !row['入职时间']) {
            errors.push(`第${i + 2}行：缺少必填字段（名字、入职时间）`);
            errorCount++;
            continue;
          }

          // 1. 插入员工基本信息
          const basicInfoSql = `
            INSERT INTO employee_basic_info (
              name, gender, birth_date, native_place, id_number, id_address,
              current_address, phone_number, emergency_contact_name, emergency_contact_phone,
              bank_account, bank_branch, graduation_school, major, graduation_date,
              interviewer_name, education_id, education_mode_id, political_status_id, marital_status_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const [basicResult] = await connection.execute(basicInfoSql, [
            row['名字'],
            row['性别'] === '男' ? 'M' : (row['性别'] === '女' ? 'F' : 'O'),
            parseDate(row['出生日期']),
            row['籍贯'] || null,
            row['身份证号'] || null,
            row['身份证地址'] || null,
            row['现居住地'] || null,
            row['本人联系方式'] || null,
            row['紧急联系人姓名'] || null,
            row['紧急联系人电话'] || null,
            row['银行卡号'] || null,
            row['详细支行信息'] || null,
            row['毕业院校'] || null,
            row['专业'] || null,
            parseDate(row['毕业日期']),
            row['面试官姓名'] || null,
            await getOrCreateSystemId(connection, 'sys_education', 'education', row['学历']),
            await getOrCreateSystemId(connection, 'sys_education_mode', 'education_mode', row['教育方式']),
            await getOrCreateSystemId(connection, 'sys_political_status', 'political_status', row['政治面貌']),
            await getOrCreateSystemId(connection, 'sys_marital_status', 'marital_status', row['婚姻状况'])
          ]);

          const employeeId = basicResult.insertId;

          // 2. 插入员工职位信息
          const positionInfoSql = `
            INSERT INTO employee_position_info (
              employee_id, region_id, department_id, position_id, employee_type,
              insurance_type, entry_date, actual_regularization_date, contract_end_date, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await connection.execute(positionInfoSql, [
            employeeId,
            await getOrCreateSystemId(connection, 'sys_region', 'region', row['区域']),
            await getOrCreateSystemId(connection, 'sys_department', 'department', row['部门']),
            await getOrCreateSystemId(connection, 'sys_position', 'position', row['岗位']),
            parseEmployeeType(row['员工性质']),
            parseInsuranceType(row['险种']),
            parseDate(row['入职时间']),
            parseDate(row['实际转正日期']),
            parseDate(row['合同终止日期']),
            row['备注'] || null
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

// 辅助函数：解析日期
function parseDate(dateStr) {
  if (!dateStr) return null;

  // 处理Excel日期格式
  if (typeof dateStr === 'number') {
    // Excel日期序列号转换
    const date = new Date((dateStr - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  if (typeof dateStr === 'string') {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return null;
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

module.exports = router;
