-- 为resignation_monitoring表添加性能优化索引

-- 1. 为常用筛选字段添加索引
CREATE INDEX IF NOT EXISTS idx_region ON resignation_monitoring(region);
CREATE INDEX IF NOT EXISTS idx_department ON resignation_monitoring(department);
CREATE INDEX IF NOT EXISTS idx_position ON resignation_monitoring(position);
CREATE INDEX IF NOT EXISTS idx_resignation_reason ON resignation_monitoring(resignation_reason);

-- 2. 为日期字段添加索引（用于时间范围筛选）
CREATE INDEX IF NOT EXISTS idx_resignation_date ON resignation_monitoring(resignation_date);
CREATE INDEX IF NOT EXISTS idx_entry_date ON resignation_monitoring(entry_date);

-- 3. 为在职时间计算添加复合索引
CREATE INDEX IF NOT EXISTS idx_tenure_calc ON resignation_monitoring(entry_date, resignation_date);

-- 4. 为常用组合筛选添加复合索引
CREATE INDEX IF NOT EXISTS idx_dept_date ON resignation_monitoring(department, resignation_date);
CREATE INDEX IF NOT EXISTS idx_region_dept ON resignation_monitoring(region, department);
CREATE INDEX IF NOT EXISTS idx_position_date ON resignation_monitoring(position, resignation_date);

-- 5. 为离职原因分析优化的复合索引
CREATE INDEX IF NOT EXISTS idx_reason_analysis ON resignation_monitoring(resignation_reason, department, resignation_date);

-- 6. 为在职时间分析优化的复合索引  
CREATE INDEX IF NOT EXISTS idx_tenure_analysis ON resignation_monitoring(entry_date, resignation_date, department);

-- 显示当前表的索引
SHOW INDEX FROM resignation_monitoring;
