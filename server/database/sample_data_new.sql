-- 新数据库结构示例数据
-- 用于测试新的规范化数据库设计

USE hr_dashboard;

-- 插入区域字典数据
INSERT INTO sys_region (region) VALUES 
('华北区'),
('华东区'),
('华南区'),
('华中区'),
('西南区'),
('西北区'),
('东北区')
ON DUPLICATE KEY UPDATE region = VALUES(region);

-- 插入部门字典数据
INSERT INTO sys_department (department) VALUES 
('技术部'),
('销售部'),
('市场部'),
('人事部'),
('财务部'),
('运营部'),
('客服部'),
('产品部')
ON DUPLICATE KEY UPDATE department = VALUES(department);

-- 插入岗位字典数据
INSERT INTO sys_position (position) VALUES 
('软件工程师'),
('高级软件工程师'),
('技术经理'),
('销售代表'),
('销售经理'),
('市场专员'),
('人事专员'),
('财务专员'),
('产品经理'),
('客服专员')
ON DUPLICATE KEY UPDATE position = VALUES(position);

-- 插入公司字典数据
INSERT INTO sys_company (company) VALUES 
('总公司'),
('分公司A'),
('分公司B'),
('子公司C')
ON DUPLICATE KEY UPDATE company = VALUES(company);

-- 插入政治面貌字典数据
INSERT INTO sys_political_status (political_status) VALUES 
('中共党员'),
('共青团员'),
('民主党派'),
('群众')
ON DUPLICATE KEY UPDATE political_status = VALUES(political_status);

-- 插入离职类型字典数据
INSERT INTO sys_resign_type (region_type) VALUES 
('主动离职'),
('被动离职'),
('合同到期'),
('协商解除')
ON DUPLICATE KEY UPDATE region_type = VALUES(region_type);

-- 插入婚姻状况字典数据
INSERT INTO sys_marital_status (marital_status) VALUES 
('未婚'),
('已婚'),
('离异'),
('丧偶')
ON DUPLICATE KEY UPDATE marital_status = VALUES(marital_status);

-- 插入学历字典数据
INSERT INTO sys_education (education) VALUES 
('高中'),
('中专'),
('大专'),
('本科'),
('硕士'),
('博士')
ON DUPLICATE KEY UPDATE education = VALUES(education);

-- 插入教育方式字典数据
INSERT INTO sys_education_mode (education_mode) VALUES 
('全日制'),
('非全日制'),
('自考'),
('成人教育'),
('网络教育')
ON DUPLICATE KEY UPDATE education_mode = VALUES(education_mode);

-- 插入员工基本信息示例数据
INSERT INTO employee_basic_info (
    name, gender, birth_date, native_place, political_status_id, id_number, 
    id_address, current_address, phone_number, emergency_contact_name, 
    emergency_contact_phone, bank_account, bank_branch, graduation_school, 
    major, education_id, education_mode_id, graduation_date, interviewer_name, 
    marital_status_id
) VALUES 
('张三', 'M', '1990-05-15', '北京市', 1, '110101199005150001', 
 '北京市朝阳区', '北京市朝阳区某小区', '13800138001', '李四', 
 '13800138002', '6222021234567890', '中国银行北京分行', '北京大学', 
 '计算机科学与技术', 4, 1, '2012-06-30', '王经理', 2),
('李四', 'F', '1992-08-20', '上海市', 2, '310101199208200002', 
 '上海市浦东新区', '上海市浦东新区某小区', '13800138003', '张三', 
 '13800138004', '6222021234567891', '工商银行上海分行', '复旦大学', 
 '市场营销', 4, 1, '2014-06-30', '陈经理', 1),
('王五', 'M', '1988-12-10', '广州市', 1, '440101198812100003', 
 '广州市天河区', '广州市天河区某小区', '13800138005', '赵六', 
 '13800138006', '6222021234567892', '建设银行广州分行', '中山大学', 
 '软件工程', 5, 1, '2010-06-30', '刘经理', 2);

-- 插入员工任职信息示例数据
INSERT INTO employee_position_info (
    employee_id, region_id, department_id, position_id, employee_type, 
    insurance_type, labor_relationship, social_security_affiliation, 
    non_compete_agreement, confidentiality_agreement, entry_date, 
    actual_regularization_date, contract_end_date, remarks
) VALUES 
(1, 1, 1, 1, 1, 1, 1, 1, true, true, '2020-03-15', '2020-06-15', '2025-03-14', '表现优秀'),
(2, 2, 3, 4, 1, 1, 1, 1, false, true, '2021-07-01', '2021-10-01', '2026-06-30', '市场能力强'),
(3, 3, 1, 2, 1, 1, 1, 1, true, true, '2019-01-10', '2019-04-10', '2024-01-09', '技术骨干');

-- 插入离职信息示例数据
INSERT INTO employee_resignation_info (
    employee_id, resignation_date, resignation_type_id, resignation_reason
) VALUES 
(3, '2023-12-31', 1, '个人发展需要');
