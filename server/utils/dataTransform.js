const moment = require('moment');

/**
 * 工龄转换函数
 * 将月份转换为年龄段
 */
function transformWorkAge(months) {
  if (!months || months === '') return '';
  
  const monthsNum = parseInt(months);
  
  if (monthsNum < 12) return '1年以下';
  if (monthsNum < 36) return '1-3年';
  if (monthsNum < 72) return '3-6年';
  if (monthsNum < 144) return '6-12年';
  return '12年以上';
}

/**
 * 学历转换函数
 */
function transformEducation(education) {
  if (!education) return '其他';
  
  const edu = education.toString().toLowerCase();
  
  if (['小学', '初中', '中专', '职高', '高中'].some(level => edu.includes(level))) {
    return '高中及以下';
  }
  if (['专科', '大专'].some(level => edu.includes(level))) {
    return '大专';
  }
  if (['本科', '成人本科'].some(level => edu.includes(level))) {
    return '本科';
  }
  if (['硕士', '研究生'].some(level => edu.includes(level))) {
    return '硕士及以上';
  }
  
  return '其他';
}

/**
 * 反向学历转换函数 - 将显示值转换为数据库查询条件
 */
function reverseTransformEducation(displayEducation) {
  switch (displayEducation) {
    case '高中及以下':
      return ['小学', '初中', '中专', '职高', '高中'];
    case '大专':
      return ['专科', '大专'];
    case '本科':
      return ['本科', '成人本科'];
    case '硕士及以上':
      return ['硕士', '研究生'];
    case '其他':
      return ['其他'];
    default:
      return [];
  }
}

/**
 * 区域转换函数
 */
function transformRegion(area) {
  if (!area) return '';
  
  const areaStr = area.toString();
  
  if (areaStr === '总部') return '华东';
  if (areaStr === '合肥') return '华东';
  if (['杭州', '上海', '宁波', '义乌'].includes(areaStr)) return '华东';
  return '华南';
}

/**
 * 计算同比增长率
 */
function calculateYearOverYear(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(2);
}

/**
 * 计算环比增长率
 */
function calculateMonthOverMonth(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(2);
}

/**
 * 获取日期范围
 */
function getDateRange(year, month) {
  if (year && month) {
    const startDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`);
    const endDate = startDate.clone().endOf('month');
    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD')
    };
  } else if (year) {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`
    };
  } else if (month) {
    // 只选择月份时，默认查询当前年份的该月份
    const currentYear = new Date().getFullYear();
    const startDate = moment(`${currentYear}-${month.toString().padStart(2, '0')}-01`);
    const endDate = startDate.clone().endOf('month');
    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD')
    };
  }
  return null;
}

/**
 * 获取上一期日期范围（用于环比计算）
 */
function getPreviousDateRange(year, month) {
  if (year && month) {
    const currentDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`);
    const previousDate = currentDate.clone().subtract(1, 'month');
    const endDate = previousDate.clone().endOf('month');
    return {
      start: previousDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD')
    };
  } else if (year) {
    return {
      start: `${year - 1}-01-01`,
      end: `${year - 1}-12-31`
    };
  }
  return null;
}

/**
 * 获取去年同期日期范围（用于同比计算）
 */
function getLastYearDateRange(year, month) {
  if (year && month) {
    const lastYear = year - 1;
    return {
      start: `${lastYear}-${month.toString().padStart(2, '0')}-01`,
      end: moment(`${lastYear}-${month.toString().padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD')
    };
  } else if (year) {
    return {
      start: `${year - 1}-01-01`,
      end: `${year - 1}-12-31`
    };
  }
  return null;
}

module.exports = {
  transformWorkAge,
  transformEducation,
  reverseTransformEducation,
  transformRegion,
  calculateYearOverYear,
  calculateMonthOverMonth,
  getDateRange,
  getPreviousDateRange,
  getLastYearDateRange
};
