# 数据库架构查询工具

这是一个用于查询MySQL数据库架构信息的JavaScript工具集，包含了完整的数据库表结构、字段信息、索引、外键等查询功能。

## 文件结构

```
server/
├── utils/
│   └── database-schema.js          # 核心数据库架构查询类
├── routes/
│   └── schema.js                   # API路由
├── schema-query-example.js         # 使用示例
├── test-schema.js                  # 测试脚本
└── DATABASE_SCHEMA_README.md       # 本文档
```

## 功能特性

### 核心功能
- 📊 获取数据库基本信息（版本、字符集等）
- 📋 查询所有表信息
- 📝 获取表字段详细信息
- 🔍 查询表索引信息
- 🔗 获取外键约束信息
- 📈 表统计信息（行数、大小等）
- 🔧 生成CREATE语句
- ✅ 检查表是否存在
- 📦 导出完整数据库架构

### API接口
- `GET /api/schema/database` - 数据库基本信息
- `GET /api/schema/tables` - 所有表信息
- `GET /api/schema/tables/:tableName` - 指定表的完整架构
- `GET /api/schema/tables/:tableName/columns` - 表字段信息
- `GET /api/schema/tables/:tableName/indexes` - 表索引信息
- `GET /api/schema/tables/:tableName/foreign-keys` - 表外键信息
- `GET /api/schema/tables/:tableName/stats` - 表统计信息
- `GET /api/schema/tables/:tableName/create-statement` - CREATE语句
- `GET /api/schema/tables/:tableName/exists` - 检查表是否存在
- `GET /api/schema/full` - 完整数据库架构

## 快速开始

### 1. 直接使用类

```javascript
const mysql = require('mysql2/promise');
const DatabaseSchema = require('./utils/database-schema');

// 创建数据库连接
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'your_database'
});

// 创建架构查询实例
const schema = new DatabaseSchema(connection);

// 获取所有表
const tables = await schema.getAllTables();
console.log('数据库表:', tables);

// 获取指定表的字段信息
const columns = await schema.getTableColumns('your_table');
console.log('表字段:', columns);
```

### 2. 运行示例

```bash
# 运行完整示例
node server/schema-query-example.js

# 运行测试
node server/test-schema.js
```

### 3. 启动API服务

```bash
# 启动服务器
cd server
npm run dev

# 测试API
curl "http://localhost:3001/api/schema/tables"
```

## API使用示例

### 获取数据库信息
```bash
curl "http://localhost:3001/api/schema/database"
```

响应示例：
```json
{
  "success": true,
  "data": {
    "databaseName": "hr",
    "charset": "utf8mb4",
    "collation": "utf8mb4_0900_ai_ci",
    "version": "8.0.33"
  }
}
```

### 获取所有表
```bash
curl "http://localhost:3001/api/schema/tables"
```

### 获取表字段信息
```bash
curl "http://localhost:3001/api/schema/tables/sys_region/columns"
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "columnName": "id",
      "dataType": "bigint",
      "isNullable": "NO",
      "columnDefault": null,
      "columnKey": "PRI",
      "extra": "auto_increment",
      "columnComment": "",
      "maxLength": null,
      "numericPrecision": 20,
      "numericScale": 0,
      "position": 1
    }
  ],
  "tableName": "sys_region",
  "count": 2
}
```

### 获取表的完整架构
```bash
curl "http://localhost:3001/api/schema/tables/sys_region"
```

## 主要方法说明

### DatabaseSchema 类方法

| 方法 | 描述 | 返回值 |
|------|------|--------|
| `getAllTables()` | 获取所有表信息 | Array |
| `getTableColumns(tableName)` | 获取表字段信息 | Array |
| `getTableIndexes(tableName)` | 获取表索引信息 | Array |
| `getTableForeignKeys(tableName)` | 获取表外键信息 | Array |
| `getTableSchema(tableName)` | 获取完整表架构 | Object |
| `getDatabaseSchema()` | 获取完整数据库架构 | Object |
| `getDatabaseInfo()` | 获取数据库基本信息 | Object |
| `getCreateTableStatement(tableName)` | 获取CREATE语句 | String |
| `tableExists(tableName)` | 检查表是否存在 | Boolean |
| `getTableStats(tableName)` | 获取表统计信息 | Object |

## 配置说明

数据库连接配置在 `server/index.js` 中：

```javascript
const dbConfig = {
  host: process.env.DB_HOST || '192.168.24.6',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'JL123456',
  database: process.env.DB_NAME || 'hr'
};
```

可以通过环境变量或直接修改配置来连接不同的数据库。

## 错误处理

所有方法都包含完整的错误处理：

```javascript
try {
  const tables = await schema.getAllTables();
  console.log('成功:', tables);
} catch (error) {
  console.error('失败:', error.message);
}
```

API响应格式：
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

## 性能优化

- 使用连接池提高并发性能
- 支持查询缓存
- 合理的超时设置
- 自动重连机制

## 注意事项

1. 确保数据库用户有足够的权限访问 `information_schema`
2. 大型数据库的完整架构查询可能需要较长时间
3. 建议在生产环境中添加适当的缓存机制
4. API接口建议添加认证和授权机制

## 扩展功能

可以根据需要扩展以下功能：
- 表结构比较
- 架构变更检测
- 数据字典生成
- 架构文档导出
- 数据库迁移脚本生成
