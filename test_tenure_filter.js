const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testTenureFilter() {
  const baseURL = 'http://localhost:3001/api/dashboard';

  try {
    console.log('=== 测试在职时间筛选功能 ===\n');

    // 1. 获取所有数据（无筛选）
    console.log('1. 获取所有离职原因数据（无筛选）:');
    const allData = await makeRequest(`${baseURL}/turnover-reason-analysis`);
    console.log('所有数据:', allData);
    console.log('总数:', allData.values?.reduce((sum, val) => sum + val, 0));

    // 2. 获取1-3月的数据
    console.log('\n2. 获取1-3月在职时间的离职原因数据:');
    const tenure1to3Data = await makeRequest(`${baseURL}/turnover-reason-analysis?tenure=1-3月`);
    console.log('1-3月数据:', tenure1to3Data);
    console.log('总数:', tenure1to3Data.values?.reduce((sum, val) => sum + val, 0));

    // 3. 获取1年以上的数据
    console.log('\n3. 获取1年以上在职时间的离职原因数据:');
    const tenure1yearData = await makeRequest(`${baseURL}/turnover-reason-analysis?tenure=1年以上`);
    console.log('1年以上数据:', tenure1yearData);
    console.log('总数:', tenure1yearData.values?.reduce((sum, val) => sum + val, 0));

    // 4. 测试离职部门分布
    console.log('\n4. 测试离职部门分布（1-3月筛选）:');
    const deptData = await makeRequest(`${baseURL}/turnover-department-distribution?tenure=1-3月`);
    console.log('部门分布数据:', deptData);
    console.log('总数:', deptData.values?.reduce((sum, val) => sum + val, 0));

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 测试前端API调用
async function testFrontendAPI() {
  console.log('\n=== 测试前端API调用 ===');

  // 模拟前端的API调用
  const baseURL = 'http://localhost:3001/api/dashboard';

  // 测试不同的参数组合
  const testCases = [
    { name: '无筛选', params: {} },
    { name: '只有tenure筛选', params: { tenure: '1-3月' } },
    { name: '只有department筛选', params: { department: '操作部' } },
    { name: 'tenure + department筛选', params: { tenure: '1-3月', department: '操作部' } }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    const queryString = new URLSearchParams(testCase.params).toString();
    const url = `${baseURL}/turnover-reason-analysis${queryString ? '?' + queryString : ''}`;
    console.log('请求URL:', url);

    try {
      const data = await makeRequest(url);
      console.log('返回数据总数:', data.values?.reduce((sum, val) => sum + val, 0));
      console.log('前5个原因:', data.labels?.slice(0, 5));
      console.log('前5个数值:', data.values?.slice(0, 5));
    } catch (error) {
      console.error('请求失败:', error.message);
    }
  }
}

// 运行测试
testTenureFilter().then(() => {
  return testFrontendAPI();
});
