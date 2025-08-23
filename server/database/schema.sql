-- 人事数据看板数据库结构 - 新版本规范化设计

-- 创建数据库
CREATE DATABASE IF NOT EXISTS hr_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_dashboard;

-- 区域字典表
CREATE TABLE IF NOT EXISTS `sys_region`
(
    `id`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `region` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='区域字典表';

-- 部门字典表
CREATE TABLE IF NOT EXISTS `sys_department`
(
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `department` VARCHAR(100)    NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='部门字典表';

-- 岗位字典表
CREATE TABLE IF NOT EXISTS `sys_position`
(
    `id`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `position` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='岗位字典表';

-- 公司字典表
CREATE TABLE IF NOT EXISTS `sys_company`
(
    `id`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `company` VARCHAR(100)    NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='公司字典表';

-- 政治面貌字典表
CREATE TABLE IF NOT EXISTS `sys_political_status`
(
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `political_status` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='政治面貌字典表';

-- 离职类型字典表
CREATE TABLE IF NOT EXISTS `sys_resign_type`
(
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `region_type` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='离职类型字典表';

-- 婚姻状况字典表
CREATE TABLE IF NOT EXISTS `sys_marital_status`
(
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `marital_status` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT ='婚姻状况字典表';

-- 学历字典表
CREATE TABLE IF NOT EXISTS `sys_education`
(
    `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `education` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT = '学历字典表';

-- 教育方式字典表
CREATE TABLE IF NOT EXISTS `sys_education_mode`
(
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `education_mode` VARCHAR(50)     NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) COMMENT = '教育方式典表';

-- 员工基本信息表
CREATE TABLE IF NOT EXISTS `employee_basic_info`
(
    `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `name`                    VARCHAR(100)    NOT NULL COMMENT '姓名',
    `gender`                  CHAR(1)         NOT NULL COMMENT '性别: M(男), F(女), O(其他)',
    `birth_date`              DATE COMMENT '出生日期',
    `native_place`            VARCHAR(255) COMMENT '籍贯',
    `political_status_id`     BIGINT UNSIGNED COMMENT '政治面貌ID -> sys_political_status.id',
    `id_number`               CHAR(18) UNIQUE COMMENT '身份证号',
    `id_address`              VARCHAR(255) COMMENT '身份证地址',
    `current_address`         VARCHAR(255) COMMENT '现居住地',
    `phone_number`            VARCHAR(50) COMMENT '本人联系方式',
    `emergency_contact_name`  VARCHAR(100) COMMENT '紧急联系人姓名',
    `emergency_contact_phone` VARCHAR(50) COMMENT '紧急联系人电话',
    `bank_account`            VARCHAR(50) COMMENT '银行卡号',
    `bank_branch`             VARCHAR(255) COMMENT '详细支行信息',
    `graduation_school`       VARCHAR(100) COMMENT '毕业院校',
    `major`                   VARCHAR(255) COMMENT '专业',
    `education_id`            BIGINT UNSIGNED COMMENT '学历ID -> sys_education.id',
    `education_mode_id`       BIGINT UNSIGNED COMMENT '教育方式ID -> sys_education_mode.id',
    `graduation_date`         DATE COMMENT '毕业日期',
    `interviewer_name`        VARCHAR(100) COMMENT '面试官姓名',
    `marital_status_id`       BIGINT UNSIGNED COMMENT '婚姻状况ID -> sys_marital_status.id',
    `created_at`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY uniq_id_birth_name (id_number, birth_date, name)
) COMMENT ='员工基本信息表';

-- 员工任职信息表
CREATE TABLE IF NOT EXISTS `employee_position_info`
(
    `id`                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `employee_id`                 BIGINT UNSIGNED NOT NULL COMMENT '员工ID -> employee_basic_info.id',
    `region_id`                   BIGINT UNSIGNED NOT NULL COMMENT '区域ID -> sys_region.id',
    `department_id`               BIGINT UNSIGNED NOT NULL COMMENT '部门ID -> sys_department.id',
    `position_id`                 BIGINT UNSIGNED NOT NULL COMMENT '岗位ID -> sys_position.id',
    `employee_type`               TINYINT         NOT NULL COMMENT '员工性质: 1(正式)、2(试用)、3(实习)',
    `insurance_type`              TINYINT COMMENT '险种: 1(社保)、2(工伤)、null(无)',
    `labor_relationship`          BIGINT UNSIGNED COMMENT '劳动关系隶属 -> sys_company.id,null 没有隶属',
    `social_security_affiliation` BIGINT UNSIGNED COMMENT '社保隶属 -> sys_company.id, null 没有隶属',
    `non_compete_agreement`       BOOLEAN COMMENT '是否签署竞业协议: true(签署)、false(未签署)、null(未知)',
    `confidentiality_agreement`   BOOLEAN COMMENT '是否签署保密协议: true(签署)、false(未签署)、null(未知)',
    `entry_date`                  DATE            NOT NULL COMMENT '入职时间',
    `actual_regularization_date`  DATE COMMENT '实际转正日期',
    `contract_end_date`           DATE COMMENT '合同终止日期',
    `remarks`                     TEXT(65535) COMMENT '备注',
    `created_at`                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) COMMENT ='员工任职信息表';

-- 员工离职信息表
CREATE TABLE IF NOT EXISTS `employee_resignation_info`
(
    `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE COMMENT '离职记录唯一ID',
    `employee_id`         BIGINT UNSIGNED NOT NULL COMMENT '员工ID -> employee_basic_info.id',
    `resignation_date`    DATE COMMENT '离职时间',
    `resignation_type_id` BIGINT UNSIGNED COMMENT '离职类型ID -> sys_resign_type.id',
    `resignation_reason`  TEXT(65535) COMMENT '离职原因',
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) COMMENT ='员工离职信息表';

-- 外键约束
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`employee_id`) REFERENCES `employee_basic_info` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`region_id`) REFERENCES `sys_region` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`department_id`) REFERENCES `sys_department` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`position_id`) REFERENCES `sys_position` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`labor_relationship`) REFERENCES `sys_company` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_position_info`
    ADD FOREIGN KEY (`social_security_affiliation`) REFERENCES `sys_company` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_resignation_info`
    ADD FOREIGN KEY (`employee_id`) REFERENCES `employee_basic_info` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `employee_basic_info`
    ADD FOREIGN KEY (`political_status_id`) REFERENCES `sys_political_status` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_basic_info`
    ADD FOREIGN KEY (`marital_status_id`) REFERENCES `sys_marital_status` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_resignation_info`
    ADD FOREIGN KEY (`resignation_type_id`) REFERENCES `sys_resign_type` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_basic_info`
    ADD FOREIGN KEY (`education_mode_id`) REFERENCES `sys_education_mode` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `employee_basic_info`
    ADD FOREIGN KEY (`education_id`) REFERENCES `sys_education` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION;
