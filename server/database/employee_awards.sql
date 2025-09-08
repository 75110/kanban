-- 员工获奖信息表
-- 创建时间: 2024-12-19
-- 描述: 存储员工获奖相关信息，包括获奖年份、时间、姓名、部门、入职时间、获奖月份、奖项、金额、备注

-- 员工获奖信息表
CREATE TABLE IF NOT EXISTS `employee_awards` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE COMMENT '主键ID',
    `award_year` YEAR NOT NULL COMMENT '获奖年份',
    `award_date` VARCHAR(100) NOT NULL COMMENT '获奖时间(支持中文格式，如：2024年12月、2024年第一季度等)',
    `name` VARCHAR(50) NOT NULL COMMENT '姓名',
    `department` VARCHAR(100) NOT NULL COMMENT '部门',
    `entry_date` DATE COMMENT '入职时间',
    `award_month` VARCHAR(200) COMMENT '获奖月份(支持中文格式，如：1月、第一季度、上半年等)',
    `award_name` VARCHAR(200) NOT NULL COMMENT '奖项',
    `award_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '金额',
    `remarks` TEXT COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_award_year` (`award_year`),
    INDEX `idx_award_date` (`award_date`),
    INDEX `idx_name` (`name`),
    INDEX `idx_department` (`department`),
    INDEX `idx_award_month` (`award_month`),
    INDEX `idx_award_name` (`award_name`),
    INDEX `idx_entry_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工获奖信息表';

-- 添加约束检查
ALTER TABLE `employee_awards` 
ADD CONSTRAINT `chk_award_amount` CHECK (`award_amount` >= 0);

-- 创建复合索引以优化常用查询
CREATE INDEX `idx_year_month` ON `employee_awards` (`award_year`, `award_month`);
CREATE INDEX `idx_department_year` ON `employee_awards` (`department`, `award_year`);
CREATE INDEX `idx_name_year` ON `employee_awards` (`name`, `award_year`);
