const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '192.168.24.6',
  port: 3306,
  user: 'root',
  password: 'JL123456',
  database: 'hr',
  charset: 'utf8mb4'
};

// 格式化字符串，左对齐并填充空格
function padRight(str, length) {
  return (str || '').toString().padEnd(length, ' ');
}

// 格式化输出分隔线
function printSeparator(length = 120) {
  console.log('-'.repeat(length));
}

// 格式化输出等号分隔线
function printDoubleSeparator(length = 100) {
  console.log('='.repeat(length));
}

async function inspectDatabase() {
  let connection;
  
  try {
    console.log('===== 数据库表结构详细信息 =====\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功!');
    console.log(`服务器: ${dbConfig.host}`);
    console.log(`数据库: ${dbConfig.database}\n`);

    // 获取所有表名和注释
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME, 
        TABLE_COMMENT,
        TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    console.log(`数据库中共有 ${tables.length} 个表：`);
    tables.forEach(table => {
      const comment = table.TABLE_COMMENT ? ` (${table.TABLE_COMMENT})` : '';
      console.log(`- ${table.TABLE_NAME}${comment}`);
    });
    console.log('');

    // 遍历每个表
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const tableComment = table.TABLE_COMMENT ? ` (${table.TABLE_COMMENT})` : '';
      
      console.log(`===== 表：${tableName}${tableComment} =====\n`);
      
      // 获取列信息
      const [columns] = await connection.execute(`SHOW FULL COLUMNS FROM \`${tableName}\``);
      
      console.log('表结构：');
      console.log(
        padRight('字段名', 25) +
        padRight('类型', 20) +
        padRight('允许NULL', 10) +
        padRight('键', 10) +
        padRight('默认值', 20) +
        padRight('额外信息', 20) +
        '注释'
      );
      printSeparator();
      
      columns.forEach(column => {
        const defaultValue = column.Default === null ? 'NULL' : column.Default;
        console.log(
          padRight(column.Field, 25) +
          padRight(column.Type, 20) +
          padRight(column.Null, 10) +
          padRight(column.Key, 10) +
          padRight(defaultValue, 20) +
          padRight(column.Extra, 20) +
          (column.Comment || '')
        );
      });
      
      // 获取表的记录数
      const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const recordCount = countResult[0].count;
      console.log(`\n记录数：${recordCount}\n`);

      // 获取索引信息
      const [indexes] = await connection.execute(`SHOW INDEX FROM \`${tableName}\``);
      if (indexes.length > 0) {
        console.log('索引信息：');
        const indexGroups = {};
        indexes.forEach(index => {
          if (!indexGroups[index.Key_name]) {
            indexGroups[index.Key_name] = [];
          }
          indexGroups[index.Key_name].push(index);
        });
        
        Object.keys(indexGroups).forEach(indexName => {
          const indexInfo = indexGroups[indexName];
          const columns = indexInfo.map(idx => idx.Column_name).join(', ');
          const unique = indexInfo[0].Non_unique === 0 ? 'UNIQUE' : '';
          const type = indexInfo[0].Index_type;
          console.log(`- ${indexName}: (${columns}) ${unique} ${type}`);
        });
        console.log('');
      }

      // 显示创建表的SQL
      const [createResult] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      console.log('创建语句：');
      console.log(createResult[0]['Create Table']);
      console.log('');
      
      printDoubleSeparator();
      console.log('');
    }

    // 显示表之间的关系
    console.log('===== 外键关系 =====\n');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [dbConfig.database]);

    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('没有发现外键关系');
    }
    console.log('');

  } catch (error) {
    console.error('数据库错误:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此文件，则执行检查
if (require.main === module) {
  inspectDatabase();
}

module.exports = { inspectDatabase };
