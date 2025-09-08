const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function checkResignationData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kanban'
    });

    try {
        console.log('=== 检查2025年4月离职数据 ===');

        // 查询2025年4月的离职记录
        const [aprilResignations] = await connection.execute(
            `SELECT id, name, resignation_date, status, department, region 
       FROM employee_info 
       WHERE status = ? 
         AND resignation_date >= ? 
         AND resignation_date < ?
       ORDER BY resignation_date`,
            ['离职', '2025-04-01', '2025-05-01']
        );

        console.log('2025年4月离职记录总数:', aprilResignations.length);
        console.log('前10条记录:');
        aprilResignations.slice(0, 10).forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.id}, 姓名: ${record.name}, 离职日期: ${record.resignation_date}, 部门: ${record.department}, 区域: ${record.region}`);
        });

        // 按日期分组统计
        const dateGroups = {};
        aprilResignations.forEach(record => {
            const date = record.resignation_date.toISOString().split('T')[0];
            dateGroups[date] = (dateGroups[date] || 0) + 1;
        });

        console.log('\n按日期分组统计:');
        Object.keys(dateGroups).sort().forEach(date => {
            console.log(`${date}: ${dateGroups[date]}人`);
        });

        // 检查是否有重复记录
        const nameGroups = {};
        aprilResignations.forEach(record => {
            const name = record.name;
            if (!nameGroups[name]) {
                nameGroups[name] = [];
            }
            nameGroups[name].push(record);
        });

        const duplicates = Object.keys(nameGroups).filter(name => nameGroups[name].length > 1);
        if (duplicates.length > 0) {
            console.log('\n发现重复姓名的记录:');
            duplicates.forEach(name => {
                console.log(`${name}: ${nameGroups[name].length}条记录`);
                nameGroups[name].forEach(record => {
                    console.log(`  - ID: ${record.id}, 离职日期: ${record.resignation_date}`);
                });
            });
        } else {
            console.log('\n没有发现重复姓名的记录');
        }

        // 检查是否有异常的离职日期
        console.log('\n检查异常离职日期:');
        const invalidDates = aprilResignations.filter(record => {
            const date = new Date(record.resignation_date);
            const month = date.getMonth() + 1; // getMonth() 返回 0-11
            return month !== 4;
        });

        if (invalidDates.length > 0) {
            console.log('发现非4月的离职记录:');
            invalidDates.forEach(record => {
                console.log(`  - ID: ${record.id}, 姓名: ${record.name}, 离职日期: ${record.resignation_date}`);
            });
        } else {
            console.log('所有记录的离职日期都在4月份');
        }

    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        await connection.end();
    }
}

checkResignationData();