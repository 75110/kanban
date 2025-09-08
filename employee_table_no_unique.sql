-- 员工数据表 - 无UNIQUE约束版本
-- 完全解决重复键冲突问题

-- 创建数据库
CREATE DATABASE IF NOT EXISTS employee_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_management;

-- 员工信息表（无UNIQUE约束版本）
CREATE TABLE IF NOT EXISTS `employee_info`
(
    `id`                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `sequence_number`             VARCHAR(50) COMMENT '序列',
    `region`                      VARCHAR(50) COMMENT '区域',
    `department`                  VARCHAR(100) COMMENT '部门',
    `position`                    VARCHAR(100) COMMENT '岗位',
    `name`                        VARCHAR(50) NOT NULL COMMENT '名字',
    `gender`                      ENUM('男', '女', '其他') COMMENT '性别',
    `ethnicity`                   VARCHAR(50) COMMENT '民族',
    `political_status`            VARCHAR(50) COMMENT '政治面貌',
    `employee_type`               VARCHAR(50) COMMENT '员工性质',
    `insurance_type`              VARCHAR(50) COMMENT '险种',
    `birth_date`                  DATE COMMENT '出生日期',
    `birthday`                    VARCHAR(10) COMMENT '生日',
    `entry_date`                  DATE COMMENT '入职时间',
    `actual_regularization_date`  DATE COMMENT '实际转正日期',
    `remarks`                     TEXT COMMENT '备注',
    `contract_end_date`           DATE COMMENT '合同终止日期',
    `work_age_months`             INT COMMENT '工龄（月）',
    `id_card_number`              VARCHAR(18) COMMENT '身份证号',
    `id_card_address`             TEXT COMMENT '身份证地址',
    `age`                         INT COMMENT '年龄',
    `hometown`                    VARCHAR(100) COMMENT '籍贯',
    `graduation_school`           VARCHAR(200) COMMENT '毕业院校',
    `major`                       VARCHAR(100) COMMENT '专业',
    `education`                   VARCHAR(50) COMMENT '学历',
    `education_method`            VARCHAR(50) COMMENT '教育方式',
    `graduation_date`             DATE COMMENT '毕业日期',
    `interviewer_name`            VARCHAR(50) COMMENT '面试官姓名',
    `marital_status`              VARCHAR(20) COMMENT '婚姻状况',
    `current_address`             TEXT COMMENT '现居住地',
    `personal_contact`            VARCHAR(50) COMMENT '本人联系方式',
    `emergency_contact_name`      VARCHAR(50) COMMENT '紧急联系人姓名',
    `emergency_contact_phone`     VARCHAR(50) COMMENT '紧急联系人电话',
    `bank_card_number`            VARCHAR(50) COMMENT '银行卡号',
    `bank_branch_info`            TEXT COMMENT '详细支行信息',
    `labor_relation_affiliation`  VARCHAR(100) COMMENT '劳动关系隶属(*)',
    `social_insurance_affiliation` VARCHAR(100) COMMENT '社保隶属(*)',
    `non_compete_agreement`       VARCHAR(10) COMMENT '竞业协议',
    `confidentiality_agreement`   VARCHAR(10) COMMENT '保密协议',
    `resignation_date`            DATE COMMENT '离职时间',
    `status`                      VARCHAR(20) COMMENT '状态',
    `resignation_reason`          TEXT COMMENT '离职原因',
    `remarks1`                    TEXT COMMENT '备注1',
    `remarks2`                    TEXT COMMENT '备注2',
    `remarks3`                    TEXT COMMENT '备注3',
    `created_at`                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_sequence_number` (`sequence_number`),
    INDEX `idx_region` (`region`),
    INDEX `idx_department` (`department`),
    INDEX `idx_position` (`position`),
    INDEX `idx_name` (`name`),
    INDEX `idx_entry_date` (`entry_date`),
    INDEX `idx_resignation_date` (`resignation_date`),
    INDEX `idx_status` (`status`),
    INDEX `idx_id_card_number` (`id_card_number`)
) COMMENT ='在职离职合并表';

-- 如果需要添加身份证号唯一约束，请先清理数据：
-- 1. 将空字符串转换为NULL
-- UPDATE employee_info SET id_card_number = NULL WHERE id_card_number = '';
-- 
-- 2. 删除重复的身份证号记录（保留第一条）
-- DELETE e1 FROM employee_info e1
-- INNER JOIN employee_info e2 
-- WHERE e1.id > e2.id 
-- AND e1.id_card_number = e2.id_card_number 
-- AND e1.id_card_number IS NOT NULL 
-- AND e1.id_card_number != '';
-- 
-- 3. 添加唯一约束
-- ALTER TABLE employee_info ADD UNIQUE KEY `uniq_id_card_number` (`id_card_number`);




