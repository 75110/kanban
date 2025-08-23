数据库连接成功!     
服务器: 192.168.24.6
数据库: hr

数据库中共有 12 个表：
- employee_basic_info (员工基本信息表)
- employee_position_info (员工任职信息表)
- employee_resignation_info (员工离职信息表)
- sys_company (公司字典表)
- sys_department (部门字典表)
- sys_education (学历字典表)
- sys_education_mode (教育方式典表)
- sys_marital_status (婚姻状况字典表)
- sys_political_status (政治面貌字典表)
- sys_position (岗位字典表)
- sys_region (区域字典表)
- sys_resign_type (离职类型字典表)

===== 表：employee_basic_info (员工基本信息表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment      
name                     varchar(100)        NO                  NULL
         姓名
gender                   char(1)             NO                  NULL
         性别: M(男), F(女), O(其他)
birth_date               date                YES                 NULL
         出生日期
native_place             varchar(255)        YES                 NULL
         籍贯
political_status_id      bigint unsigned     YES       MUL       NULL
         政治面貌ID -> sys_political_status.id
id_number                char(18)            YES       UNI       NULL
         身份证号
id_address               varchar(255)        YES                 NULL
         身份证地址
current_address          varchar(255)        YES                 NULL
         现居住地
phone_number             varchar(50)         YES                 NULL
         本人联系方式
emergency_contact_name   varchar(100)        YES                 NULL
         紧急联系人姓名
emergency_contact_phone  varchar(50)         YES                 NULL
         紧急联系人电话
bank_account             varchar(50)         YES                 NULL
         银行卡号
bank_branch              varchar(255)        YES                 NULL
         详细支行信息
graduation_school        varchar(100)        YES                 NULL
         毕业院校
major                    varchar(255)        YES                 NULL
         专业
education_id             bigint unsigned     YES       MUL       NULL
         学历ID -> sys_education.id
education_mode_id        bigint unsigned     YES       MUL       NULL
         教育方式ID -> sys_education_mode.id
graduation_date          date                YES                 NULL
         毕业日期
interviewer_name         varchar(100)        YES                 NULL
         面试官姓名
marital_status_id        bigint unsigned     YES       MUL       NULL
         婚姻状况ID -> sys_marital_status.id
created_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED   创建时间
updated_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED on update CURRENT_TIMESTAMP更新时间

记录数：1820

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- id_number: (id_number) UNIQUE BTREE
- uniq_id_birth_name: (id_number, birth_date, name) UNIQUE BTREE
- political_status_id: (political_status_id)  BTREE
- marital_status_id: (marital_status_id)  BTREE
- education_mode_id: (education_mode_id)  BTREE
- education_id: (education_id)  BTREE

创建语句：
CREATE TABLE `employee_basic_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `gender` char(1) NOT NULL COMMENT '性别: M(男), F(女), O(其他)',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `native_place` varchar(255) DEFAULT NULL COMMENT '籍贯',
  `political_status_id` bigint unsigned DEFAULT NULL COMMENT '政治面貌ID -> sys_political_status.id',
  `id_number` char(18) DEFAULT NULL COMMENT '身份证号',
  `id_address` varchar(255) DEFAULT NULL COMMENT '身份证地址',
  `current_address` varchar(255) DEFAULT NULL COMMENT '现居住地',
  `phone_number` varchar(50) DEFAULT NULL COMMENT '本人联系方式',
  `emergency_contact_name` varchar(100) DEFAULT NULL COMMENT '紧急联系人姓名',
  `emergency_contact_phone` varchar(50) DEFAULT NULL COMMENT '紧急联系人电话',
  `bank_account` varchar(50) DEFAULT NULL COMMENT '银行卡号',
  `bank_branch` varchar(255) DEFAULT NULL COMMENT '详细支行信息',
  `graduation_school` varchar(100) DEFAULT NULL COMMENT '毕业院校',
  `major` varchar(255) DEFAULT NULL COMMENT '专业',
  `education_id` bigint unsigned DEFAULT NULL COMMENT '学历ID -> sys_education.id',
  `education_mode_id` bigint unsigned DEFAULT NULL COMMENT '教育方式ID -> sys_education_mode.id',
  `graduation_date` date DEFAULT NULL COMMENT '毕业日期',
  `interviewer_name` varchar(100) DEFAULT NULL COMMENT '面试官姓名',
  `marital_status_id` bigint unsigned DEFAULT NULL COMMENT '婚姻状况ID -> sys_marital_status.id',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `id_number` (`id_number`),
  UNIQUE KEY `uniq_id_birth_name` (`id_number`,`birth_date`,`name`),
  KEY `political_status_id` (`political_status_id`),
  KEY `marital_status_id` (`marital_status_id`),
  KEY `education_mode_id` (`education_mode_id`),
  KEY `education_id` (`education_id`),
  CONSTRAINT `employee_basic_info_ibfk_1` FOREIGN KEY (`political_status_id`) REFERENCES `sys_political_status` (`id`),
  CONSTRAINT `employee_basic_info_ibfk_2` FOREIGN KEY (`marital_status_id`) REFERENCES `sys_marital_status` (`id`),
  CONSTRAINT `employee_basic_info_ibfk_3` FOREIGN KEY (`education_mode_id`) REFERENCES `sys_education_mode` (`id`),
  CONSTRAINT `employee_basic_info_ibfk_4` FOREIGN KEY (`education_id`) REFERENCES `sys_education` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1849 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='员工基本信息表'

====================================================================================================

===== 表：employee_position_info (员工任职信息表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
employee_id              bigint unsigned     NO        MUL       NULL
         员工ID -> employee_basic_info.id
region_id                bigint unsigned     NO        MUL       NULL
         区域ID -> sys_region.id
department_id            bigint unsigned     NO        MUL       NULL
         部门ID -> sys_department.id
position_id              bigint unsigned     NO        MUL       NULL
         岗位ID -> sys_position.id
employee_type            tinyint             NO                  NULL
         员工性质: 1(正式)、2(试用)、3(实习)
insurance_type           tinyint             YES                 NULL
         险种: 1(社保)、2(工伤)、null(无)
labor_relationship       bigint unsigned     YES       MUL       NULL
         劳动关系隶属 -> sys_company.id,null 没有隶属
social_security_affiliationbigint unsigned     YES       MUL       NULL
           社保隶属 -> sys_company.id, null 没有隶属
non_compete_agreement    tinyint(1)          YES                 NULL
         是否签署竞业协议: true(签署)、false(未签署)、null(未知)
confidentiality_agreementtinyint(1)          YES                 NULL
         是否签署保密协议: true(签署)、false(未签署)、null(未知)
entry_date               date                NO                  NULL
         入职时间
actual_regularization_datedate                YES                 NULL
          实际转正日期
contract_end_date        date                YES                 NULL
         合同终止日期
remarks                  mediumtext          YES                 NULL
         备注
created_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED   创建时间
updated_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED on update CURRENT_TIMESTAMP更新时间

记录数：1820

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- employee_id: (employee_id)  BTREE
- region_id: (region_id)  BTREE
- department_id: (department_id)  BTREE
- position_id: (position_id)  BTREE
- labor_relationship: (labor_relationship)  BTREE
- social_security_affiliation: (social_security_affiliation)  BTREE

创建语句：
CREATE TABLE `employee_position_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL COMMENT '员工ID -> employee_basic_info.id',
  `region_id` bigint unsigned NOT NULL COMMENT '区域ID -> sys_region.id',
  `department_id` bigint unsigned NOT NULL COMMENT '部门ID -> sys_department.id',
  `position_id` bigint unsigned NOT NULL COMMENT '岗位ID -> sys_position.id',
  `employee_type` tinyint NOT NULL COMMENT '员工性质: 1(正式)、2(试用)、3(实习)',
  `insurance_type` tinyint DEFAULT NULL COMMENT '险种: 1(社保)、2(工伤)、null(无)',
  `labor_relationship` bigint unsigned DEFAULT NULL COMMENT '劳动关系隶属 -> sys_company.id,null 没有隶属',
  `social_security_affiliation` bigint unsigned DEFAULT NULL COMMENT '社保隶属 -> sys_company.id, null 没有隶属',
  `non_compete_agreement` tinyint(1) DEFAULT NULL COMMENT '是否签署竞业协议: true(签署)、false( 
未签署)、null(未知)',
  `confidentiality_agreement` tinyint(1) DEFAULT NULL COMMENT '是否签署保密协议: true(签署)、false(未签署)、null(未知)',
  `entry_date` date NOT NULL COMMENT '入职时间',
  `actual_regularization_date` date DEFAULT NULL COMMENT '实际转正日期',
  `contract_end_date` date DEFAULT NULL COMMENT '合同终止日期',
  `remarks` mediumtext COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `region_id` (`region_id`),
  KEY `department_id` (`department_id`),
  KEY `position_id` (`position_id`),
  KEY `labor_relationship` (`labor_relationship`),
  KEY `social_security_affiliation` (`social_security_affiliation`),
  CONSTRAINT `employee_position_info_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_basic_info` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_position_info_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `sys_region` (`id`),
  CONSTRAINT `employee_position_info_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `sys_department` (`id`),
  CONSTRAINT `employee_position_info_ibfk_4` FOREIGN KEY (`position_id`) REFERENCES `sys_position` (`id`),
  CONSTRAINT `employee_position_info_ibfk_5` FOREIGN KEY (`labor_relationship`) REFERENCES `sys_company` (`id`),
  CONSTRAINT `employee_position_info_ibfk_6` FOREIGN KEY (`social_security_affiliation`) REFERENCES `sys_company` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1821 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='员工任职信息表'

====================================================================================================

===== 表：employee_resignation_info (员工离职信息表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment      离职记录唯一ID
employee_id              bigint unsigned     NO        MUL       NULL
         员工ID -> employee_basic_info.id
resignation_date         date                YES                 NULL
         离职时间
resignation_type_id      bigint unsigned     YES       MUL       NULL
         离职类型ID -> sys_resign_type.id
resignation_reason       mediumtext          YES                 NULL
         离职原因
created_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED   创建时间
updated_at               datetime            NO                  CURRENT_TIMESTAMP   DEFAULT_GENERATED on update CURRENT_TIMESTAMP更新时间

记录数：1229

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- employee_id: (employee_id)  BTREE
- resignation_type_id: (resignation_type_id)  BTREE

创建语句：
CREATE TABLE `employee_resignation_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '离职记录唯一ID',
  `employee_id` bigint unsigned NOT NULL COMMENT '员工ID -> employee_basic_info.id',
  `resignation_date` date DEFAULT NULL COMMENT '离职时间',
  `resignation_type_id` bigint unsigned DEFAULT NULL COMMENT '离职类型ID -> sys_resign_type.id',  `resignation_reason` mediumtext COMMENT '离职原因',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `resignation_type_id` (`resignation_type_id`),
  CONSTRAINT `employee_resignation_info_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_basic_info` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_resignation_info_ibfk_2` FOREIGN KEY (`resignation_type_id`) REFERENCES `sys_resign_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='员工离职信息表'

====================================================================================================

===== 表：sys_company (公司字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
company                  varchar(100)        NO        UNI       NULL


记录数：23

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- company: (company) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_company` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `company` (`company`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='公
司字典表'

====================================================================================================

===== 表：sys_department (部门字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
department               varchar(100)        NO        UNI       NULL


记录数：58

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- department: (department) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_department` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `department` (`department`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='部
门字典表'

====================================================================================================

===== 表：sys_education (学历字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
education                varchar(50)         NO        UNI       NULL


记录数：9

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- education: (education) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_education` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `education` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `education` (`education`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学
历字典表'

====================================================================================================

===== 表：sys_education_mode (教育方式典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
education_mode           varchar(50)         NO        UNI       NULL


记录数：5

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- education_mode: (education_mode) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_education_mode` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `education_mode` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `education_mode` (`education_mode`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='教 
育方式典表'

====================================================================================================

===== 表：sys_marital_status (婚姻状况字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
marital_status           varchar(50)         NO        UNI       NULL


记录数：6

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- marital_status: (marital_status) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_marital_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `marital_status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `marital_status` (`marital_status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='婚 
姻状况字典表'

====================================================================================================

===== 表：sys_political_status (政治面貌字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
political_status         varchar(50)         NO        UNI       NULL


记录数：5

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- political_status: (political_status) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_political_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `political_status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `political_status` (`political_status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='政 
治面貌字典表'

====================================================================================================

===== 表：sys_position (岗位字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
position                 varchar(50)         NO        UNI       NULL


记录数：212

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- position: (position) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_position` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `position` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `position` (`position`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT=' 
岗位字典表'

====================================================================================================

===== 表：sys_region (区域字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
region                   varchar(50)         NO        UNI       NULL


记录数：12

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- region: (region) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_region` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `region` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `region` (`region`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='区
域字典表'

====================================================================================================

===== 表：sys_resign_type (离职类型字典表) =====

表结构：
字段名                      类型                  允许NULL    键         默认值
额外信息                注释
------------------------------------------------------------------------------------------------------------------------
id                       bigint unsigned     NO        PRI       NULL                auto_increment
region_type              varchar(50)         NO        UNI       NULL



记录数：4

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- region_type: (region_type) UNIQUE BTREE

记录数：4

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- region_type: (region_type) UNIQUE BTREE

索引信息：
- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- region_type: (region_type) UNIQUE BTREE

- PRIMARY: (id) UNIQUE BTREE
- id: (id) UNIQUE BTREE
- region_type: (region_type) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_resign_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `region_type` varchar(50) NOT NULL,
- region_type: (region_type) UNIQUE BTREE

创建语句：
CREATE TABLE `sys_resign_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `region_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `region_type` (`region_type`)
创建语句：
CREATE TABLE `sys_resign_type` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `region_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `region_type` (`region_type`)
  `region_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `region_type` (`region_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='离 
职类型字典表'

  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `region_type` (`region_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='离 
职类型字典表'

====================================================================================================

) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='离 
职类型字典表'

====================================================================================================

===== 外键关系 =====

employee_basic_info.education_id -> sys_education.id
employee_basic_info.education_mode_id -> sys_education_mode.id
employee_basic_info.marital_status_id -> sys_marital_status.id
employee_basic_info.political_status_id -> sys_political_status.id
employee_basic_info.education_id -> sys_education.id
employee_basic_info.education_mode_id -> sys_education_mode.id
employee_basic_info.marital_status_id -> sys_marital_status.id
employee_basic_info.political_status_id -> sys_political_status.id
employee_position_info.department_id -> sys_department.id
employee_basic_info.education_mode_id -> sys_education_mode.id
employee_basic_info.marital_status_id -> sys_marital_status.id
employee_basic_info.political_status_id -> sys_political_status.id
employee_position_info.department_id -> sys_department.id
employee_position_info.employee_id -> employee_basic_info.id
employee_position_info.labor_relationship -> sys_company.id
employee_basic_info.marital_status_id -> sys_marital_status.id
employee_basic_info.political_status_id -> sys_political_status.id
employee_position_info.department_id -> sys_department.id
employee_position_info.employee_id -> employee_basic_info.id
employee_position_info.labor_relationship -> sys_company.id
employee_position_info.department_id -> sys_department.id
employee_position_info.employee_id -> employee_basic_info.id
employee_position_info.labor_relationship -> sys_company.id
employee_position_info.position_id -> sys_position.id
employee_position_info.employee_id -> employee_basic_info.id
employee_position_info.labor_relationship -> sys_company.id
employee_position_info.position_id -> sys_position.id
employee_position_info.position_id -> sys_position.id
employee_position_info.region_id -> sys_region.id
employee_position_info.region_id -> sys_region.id
employee_position_info.social_security_affiliation -> sys_company.id
employee_resignation_info.employee_id -> employee_basic_info.id
employee_resignation_info.resignation_type_id -> sys_resign_type.id