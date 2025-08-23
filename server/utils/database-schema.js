const mysql = require('mysql2/promise');

/**
 * 数据库架构查询工具类
 * 用于查询数据库的表结构、字段信息、索引等架构信息
 */
class DatabaseSchema {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * 获取数据库中所有表的信息
   * @returns {Promise<Array>} 表信息数组
   */
  async getAllTables() {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          TABLE_NAME as tableName,
          TABLE_COMMENT as tableComment,
          ENGINE as engine,
          TABLE_ROWS as tableRows,
          DATA_LENGTH as dataLength,
          INDEX_LENGTH as indexLength,
          CREATE_TIME as createTime,
          UPDATE_TIME as updateTime
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);
      return rows;
    } catch (error) {
      console.error('获取表信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定表的字段信息
   * @param {string} tableName - 表名
   * @returns {Promise<Array>} 字段信息数组
   */
  async getTableColumns(tableName) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          COLUMN_NAME as columnName,
          DATA_TYPE as dataType,
          IS_NULLABLE as isNullable,
          COLUMN_DEFAULT as columnDefault,
          COLUMN_KEY as columnKey,
          EXTRA as extra,
          COLUMN_COMMENT as columnComment,
          CHARACTER_MAXIMUM_LENGTH as maxLength,
          NUMERIC_PRECISION as numericPrecision,
          NUMERIC_SCALE as numericScale,
          ORDINAL_POSITION as position
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      return rows;
    } catch (error) {
      console.error('获取表字段信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定表的索引信息
   * @param {string} tableName - 表名
   * @returns {Promise<Array>} 索引信息数组
   */
  async getTableIndexes(tableName) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          INDEX_NAME as indexName,
          COLUMN_NAME as columnName,
          NON_UNIQUE as nonUnique,
          SEQ_IN_INDEX as seqInIndex,
          INDEX_TYPE as indexType,
          COMMENT as comment
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);
      return rows;
    } catch (error) {
      console.error('获取表索引信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定表的外键信息
   * @param {string} tableName - 表名
   * @returns {Promise<Array>} 外键信息数组
   */
  async getTableForeignKeys(tableName) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          CONSTRAINT_NAME as constraintName,
          COLUMN_NAME as columnName,
          REFERENCED_TABLE_NAME as referencedTable,
          REFERENCED_COLUMN_NAME as referencedColumn,
          UPDATE_RULE as updateRule,
          DELETE_RULE as deleteRule
        FROM information_schema.KEY_COLUMN_USAGE kcu
        JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        WHERE kcu.TABLE_SCHEMA = DATABASE() 
          AND kcu.TABLE_NAME = ?
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.ORDINAL_POSITION
      `, [tableName]);
      return rows;
    } catch (error) {
      console.error('获取表外键信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取完整的表架构信息（包含字段、索引、外键）
   * @param {string} tableName - 表名
   * @returns {Promise<Object>} 完整的表架构信息
   */
  async getTableSchema(tableName) {
    try {
      const [tableInfo] = await this.getAllTables();
      const table = tableInfo.find(t => t.tableName === tableName);
      
      if (!table) {
        throw new Error(`表 ${tableName} 不存在`);
      }

      const [columns, indexes, foreignKeys] = await Promise.all([
        this.getTableColumns(tableName),
        this.getTableIndexes(tableName),
        this.getTableForeignKeys(tableName)
      ]);

      return {
        table,
        columns,
        indexes,
        foreignKeys
      };
    } catch (error) {
      console.error('获取表架构信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库的完整架构信息
   * @returns {Promise<Object>} 数据库架构信息
   */
  async getDatabaseSchema() {
    try {
      const tables = await this.getAllTables();
      const schema = {
        database: await this.getDatabaseInfo(),
        tables: []
      };

      for (const table of tables) {
        const tableSchema = await this.getTableSchema(table.tableName);
        schema.tables.push(tableSchema);
      }

      return schema;
    } catch (error) {
      console.error('获取数据库架构信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库基本信息
   * @returns {Promise<Object>} 数据库信息
   */
  async getDatabaseInfo() {
    try {
      const [dbInfo] = await this.pool.execute(`
        SELECT 
          SCHEMA_NAME as databaseName,
          DEFAULT_CHARACTER_SET_NAME as charset,
          DEFAULT_COLLATION_NAME as collation
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = DATABASE()
      `);

      const [variables] = await this.pool.execute(`
        SHOW VARIABLES LIKE 'version'
      `);

      return {
        ...dbInfo[0],
        version: variables[0].Value
      };
    } catch (error) {
      console.error('获取数据库信息失败:', error);
      throw error;
    }
  }

  /**
   * 生成表的CREATE语句
   * @param {string} tableName - 表名
   * @returns {Promise<string>} CREATE语句
   */
  async getCreateTableStatement(tableName) {
    try {
      const [rows] = await this.pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
      return rows[0]['Create Table'];
    } catch (error) {
      console.error('获取CREATE语句失败:', error);
      throw error;
    }
  }

  /**
   * 检查表是否存在
   * @param {string} tableName - 表名
   * @returns {Promise<boolean>} 是否存在
   */
  async tableExists(tableName) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT COUNT(*) as count
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
      `, [tableName]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('检查表是否存在失败:', error);
      throw error;
    }
  }

  /**
   * 获取表的数据统计信息
   * @param {string} tableName - 表名
   * @returns {Promise<Object>} 统计信息
   */
  async getTableStats(tableName) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT COUNT(*) as totalRows
        FROM \`${tableName}\`
      `);

      const [sizeInfo] = await this.pool.execute(`
        SELECT 
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'sizeMB',
          ROUND((data_length / 1024 / 1024), 2) AS 'dataSizeMB',
          ROUND((index_length / 1024 / 1024), 2) AS 'indexSizeMB'
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
      `, [tableName]);

      return {
        totalRows: rows[0].totalRows,
        ...sizeInfo[0]
      };
    } catch (error) {
      console.error('获取表统计信息失败:', error);
      throw error;
    }
  }
}

module.exports = DatabaseSchema;
