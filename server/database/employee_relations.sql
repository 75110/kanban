-- 员工信息关联查询
-- 创建时间: 2024-12-19
-- 描述: 基于name字段关联四个表的查询语句集合

-- ============================================
-- 1. 员工全生命周期信息视图（基础关联查询）
-- ============================================
SELECT 
    er.name AS '姓名',
    er.department AS '部门',
    er.position AS '岗位',
    er.entry_date AS '入职时间',
    er.employee_type AS '员工性质',
    er.gender AS '性别',
    er.age AS '年龄',
    er.work_age_months AS '工龄(月)',
    
    -- 获奖信息
    GROUP_CONCAT(DISTINCT CONCAT(ea.award_name, '(', ea.award_date, ')') SEPARATOR '; ') AS '获奖记录',
    COUNT(DISTINCT ea.id) AS '获奖次数',
    COALESCE(SUM(ea.award_amount), 0) AS '获奖总金额',
    
    -- 异动信息
    GROUP_CONCAT(DISTINCT CONCAT(pc.original_position, '->', pc.new_position, '(', pc.change_date, ')') SEPARATOR '; ') AS '异动记录',
    COUNT(DISTINCT pc.name) AS '异动次数',
    
    -- 离职信息
    rm.resignation_date AS '离职时间',
    rm.resignation_type AS '离职类型',
    rm.resignation_reason AS '离职原因',
    CASE 
        WHEN rm.resignation_date IS NOT NULL THEN '已离职'
        ELSE '在职'
    END AS '在职状态'

FROM employee_roster er
LEFT JOIN employee_awards ea ON er.name = ea.name
LEFT JOIN personnel_changes pc ON er.name = pc.name
LEFT JOIN resignation_monitoring rm ON er.name = rm.name
GROUP BY er.name, er.department, er.position, er.entry_date, er.employee_type, 
         er.gender, er.age, er.work_age_months, rm.resignation_date, 
         rm.resignation_type, rm.resignation_reason
ORDER BY er.name;

-- ============================================
-- 2. 获奖员工详细信息查询
-- ============================================
SELECT 
    er.name AS '姓名',
    er.department AS '部门',
    er.position AS '岗位',
    er.entry_date AS '入职时间',
    ea.award_year AS '获奖年份',
    ea.award_date AS '获奖时间',
    ea.award_month AS '获奖月份',
    ea.award_name AS '奖项名称',
    ea.award_amount AS '获奖金额',
    ea.remarks AS '获奖备注',
    er.work_age_months AS '获奖时工龄(月)'
FROM employee_roster er
INNER JOIN employee_awards ea ON er.name = ea.name
ORDER BY er.name, ea.award_year DESC, ea.award_date DESC;

-- ============================================
-- 3. 员工异动历史查询
-- ============================================
SELECT 
    er.name AS '姓名',
    er.department AS '当前部门',
    er.position AS '当前岗位',
    er.entry_date AS '入职时间',
    pc.original_position AS '原岗位',
    pc.new_position AS '新岗位',
    pc.change_date AS '异动时间',
    pc.change_reason AS '异动原因',
    pc.remarks AS '异动备注',
    DATEDIFF(pc.change_date, er.entry_date) AS '异动时入职天数'
FROM employee_roster er
INNER JOIN personnel_changes pc ON er.name = pc.name
ORDER BY er.name, pc.change_date DESC;

-- ============================================
-- 4. 离职员工信息查询
-- ============================================
SELECT 
    er.name AS '姓名',
    er.department AS '离职部门',
    er.position AS '离职岗位',
    er.entry_date AS '入职时间',
    rm.resignation_date AS '离职时间',
    rm.resignation_type AS '离职类型',
    rm.resignation_reason AS '离职原因',
    DATEDIFF(rm.resignation_date, er.entry_date) AS '在职天数',
    er.work_age_months AS '工龄(月)',
    
    -- 在职期间的获奖情况
    COUNT(DISTINCT ea.id) AS '在职期间获奖次数',
    COALESCE(SUM(ea.award_amount), 0) AS '在职期间获奖总金额',
    
    -- 在职期间的异动情况
    COUNT(DISTINCT pc.name) AS '在职期间异动次数'
    
FROM employee_roster er
INNER JOIN resignation_monitoring rm ON er.name = rm.name
LEFT JOIN employee_awards ea ON er.name = ea.name 
    AND ea.award_date <= rm.resignation_date
LEFT JOIN personnel_changes pc ON er.name = pc.name 
    AND pc.change_date <= rm.resignation_date
GROUP BY er.name, er.department, er.position, er.entry_date, 
         rm.resignation_date, rm.resignation_type, rm.resignation_reason, er.work_age_months
ORDER BY rm.resignation_date DESC;

-- ============================================
-- 5. 员工统计汇总查询
-- ============================================
SELECT 
    er.name AS '姓名',
    er.department AS '部门',
    er.position AS '岗位',
    er.entry_date AS '入职时间',
    er.work_age_months AS '工龄(月)',
    
    -- 获奖统计
    COUNT(DISTINCT ea.id) AS '获奖次数',
    COALESCE(SUM(ea.award_amount), 0) AS '获奖总金额',
    COALESCE(AVG(ea.award_amount), 0) AS '平均获奖金额',
    
    -- 异动统计
    COUNT(DISTINCT pc.name) AS '异动次数',
    
    -- 在职状态
    CASE 
        WHEN rm.resignation_date IS NOT NULL THEN '已离职'
        ELSE '在职'
    END AS '在职状态',
    
    -- 综合评分（示例：获奖次数*10 + 异动次数*5）
    (COUNT(DISTINCT ea.id) * 10 + COUNT(DISTINCT pc.name) * 5) AS '综合评分'
    
FROM employee_roster er
LEFT JOIN employee_awards ea ON er.name = ea.name
LEFT JOIN personnel_changes pc ON er.name = pc.name
LEFT JOIN resignation_monitoring rm ON er.name = rm.name
GROUP BY er.name, er.department, er.position, er.entry_date, er.work_age_months, rm.resignation_date
ORDER BY 综合评分 DESC, er.name;

-- ============================================
-- 6. 部门获奖情况统计查询
-- ============================================
SELECT 
    er.department AS '部门',
    COUNT(DISTINCT er.name) AS '部门总人数',
    COUNT(DISTINCT ea.name) AS '获奖人数',
    ROUND(COUNT(DISTINCT ea.name) * 100.0 / COUNT(DISTINCT er.name), 2) AS '获奖率(%)',
    COUNT(DISTINCT ea.id) AS '获奖总次数',
    COALESCE(SUM(ea.award_amount), 0) AS '获奖总金额',
    COALESCE(AVG(ea.award_amount), 0) AS '平均获奖金额'
FROM employee_roster er
LEFT JOIN employee_awards ea ON er.name = ea.name
GROUP BY er.department
ORDER BY 获奖率 DESC, 获奖总金额 DESC;

-- ============================================
-- 7. 年度获奖情况查询
-- ============================================
SELECT 
    ea.award_year AS '获奖年份',
    COUNT(DISTINCT ea.name) AS '获奖人数',
    COUNT(DISTINCT ea.id) AS '获奖次数',
    COALESCE(SUM(ea.award_amount), 0) AS '获奖总金额',
    COALESCE(AVG(ea.award_amount), 0) AS '平均获奖金额',
    COUNT(DISTINCT ea.department) AS '涉及部门数'
FROM employee_awards ea
GROUP BY ea.award_year
ORDER BY ea.award_year DESC;

-- ============================================
-- 8. 员工异动类型统计查询
-- ============================================
SELECT 
    pc.change_reason AS '异动类型',
    COUNT(*) AS '异动次数',
    COUNT(DISTINCT pc.name) AS '涉及人数',
    COUNT(DISTINCT pc.department) AS '涉及部门数'
FROM personnel_changes pc
WHERE pc.change_reason IS NOT NULL
GROUP BY pc.change_reason
ORDER BY 异动次数 DESC;


