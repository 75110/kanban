const mysql = require('mysql2/promise');
const DatabaseSchema = require('./utils/database-schema');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || '192.168.24.6',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'JL123456',
  database: process.env.DB_NAME || 'hr',
  charset: 'utf8mb4'
};

/**
 * 数据库架构查询示例
 */
async function demonstrateSchemaQueries() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 创建数据库架构查询实例
    const schema = new DatabaseSchema(connection);

    console.log('\n=== 数据库基本信息 ===');
    const dbInfo = await schema.getDatabaseInfo();
    console.log('数据库信息:', JSON.stringify(dbInfo, null, 2));

    console.log('\n=== 所有表信息 ===');
    const tables = await schema.getAllTables();
    console.log(`共找到 ${tables.length} 个表:`);
    tables.forEach(table => {
      console.log(`- ${table.tableName}: ${table.tableComment || '无注释'} (${table.tableRows || 0} 行)`);
    });

    // 如果有表，查询第一个表的详细信息
    if (tables.length > 0) {
      const firstTable = tables[0].tableName;
      console.log(`\n=== 表 "${firstTable}" 的详细信息 ===`);

      // 获取字段信息
      console.log('\n--- 字段信息 ---');
      const columns = await schema.getTableColumns(firstTable);
      columns.forEach(col => {
        const nullable = col.isNullable === 'YES' ? 'NULL' : 'NOT NULL';
        const key = col.columnKey ? ` [${col.columnKey}]` : '';
        console.log(`${col.columnName}: ${col.dataType} ${nullable}${key} - ${col.columnComment || '无注释'}`);
      });

      // 获取索引信息
      console.log('\n--- 索引信息 ---');
      const indexes = await schema.getTableIndexes(firstTable);
      const indexGroups = {};
      indexes.forEach(idx => {
        if (!indexGroups[idx.indexName]) {
          indexGroups[idx.indexName] = [];
        }
        indexGroups[idx.indexName].push(idx.columnName);
      });
      
      Object.entries(indexGroups).forEach(([indexName, columns]) => {
        const unique = indexes.find(idx => idx.indexName === indexName).nonUnique === 0 ? 'UNIQUE' : '';
        console.log(`${indexName}: (${columns.join(', ')}) ${unique}`);
      });

      // 获取外键信息
      console.log('\n--- 外键信息 ---');
      const foreignKeys = await schema.getTableForeignKeys(firstTable);
      if (foreignKeys.length > 0) {
        foreignKeys.forEach(fk => {
          console.log(`${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn}`);
        });
      } else {
        console.log('无外键约束');
      }

      // 获取表统计信息
      console.log('\n--- 表统计信息 ---');
      const stats = await schema.getTableStats(firstTable);
      console.log(`总行数: ${stats.totalRows}`);
      console.log(`表大小: ${stats.sizeMB} MB (数据: ${stats.dataSizeMB} MB, 索引: ${stats.indexSizeMB} MB)`);

      // 获取CREATE语句
      console.log('\n--- CREATE语句 ---');
      const createStatement = await schema.getCreateTableStatement(firstTable);
      console.log(createStatement);
    }

    // 查询特定表（如果存在）
    const targetTables = ['sys_region', 'sys_department', 'employees'];
    for (const tableName of targetTables) {
      const exists = await schema.tableExists(tableName);
      if (exists) {
        console.log(`\n=== 表 "${tableName}" 的完整架构 ===`);
        const tableSchema = await schema.getTableSchema(tableName);
        console.log(JSON.stringify(tableSchema, null, 2));
        break; // 只显示第一个找到的表
      }
    }

  } catch (error) {
    console.error('查询数据库架构时发生错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

/**
 * 导出数据库架构到JSON文件
 */
async function exportSchemaToJson() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    const schema = new DatabaseSchema(connection);
    
    console.log('正在导出数据库架构...');
    const fullSchema = await schema.getDatabaseSchema();
    
    const fs = require('fs');
    const outputPath = './database-schema.json';
    fs.writeFileSync(outputPath, JSON.stringify(fullSchema, null, 2));
    
    console.log(`数据库架构已导出到: ${outputPath}`);
    
  } catch (error) {
    console.error('导出数据库架构失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 比较两个表的结构差异
 */
async function compareTables(table1, table2) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    const schema = new DatabaseSchema(connection);
    
    const [schema1, schema2] = await Promise.all([
      schema.getTableSchema(table1),
      schema.getTableSchema(table2)
    ]);
    
    console.log(`\n=== 比较表 "${table1}" 和 "${table2}" ===`);
    
    // 比较字段
    const cols1 = schema1.columns.map(c => c.columnName);
    const cols2 = schema2.columns.map(c => c.columnName);
    
    const onlyIn1 = cols1.filter(c => !cols2.includes(c));
    const onlyIn2 = cols2.filter(c => !cols1.includes(c));
    const common = cols1.filter(c => cols2.includes(c));
    
    console.log(`共同字段 (${common.length}):`, common);
    console.log(`仅在 ${table1} 中 (${onlyIn1.length}):`, onlyIn1);
    console.log(`仅在 ${table2} 中 (${onlyIn2.length}):`, onlyIn2);
    
  } catch (error) {
    console.error('比较表结构失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  console.log('开始数据库架构查询示例...');
  
  // 可以根据需要选择运行哪个示例
  demonstrateSchemaQueries()
    .then(() => {
      console.log('\n示例执行完成');
    })
    .catch(error => {
      console.error('示例执行失败:', error);
    });
  
  // 取消注释以下行来运行其他示例
  // exportSchemaToJson();
  // compareTables('sys_region', 'sys_department');
}

module.exports = {
  demonstrateSchemaQueries,
  exportSchemaToJson,
  compareTables
};
