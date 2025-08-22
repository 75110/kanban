/**
 * 计算年龄
 *
 * @param {string} birthDateStr 出生日期字符串，格式为 'YYYY-MM-DD'
 * @returns {number} 年龄
 */
export function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }
  return age;
}

/**
 * 计算工龄(月)
 *
 * @param {string} hireDateStr
 */
export function calculateWorkAge(hireDateStr) {
  console.log("calculateWorkAge", hireDateStr);
  const hireDate = new Date(hireDateStr);
  const today = new Date();

  const months = (today.getFullYear() - hireDate.getFullYear()) * 12;
  const month = today.getMonth() - hireDate.getMonth();

  return months + month;
}
