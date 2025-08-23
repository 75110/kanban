const express = require('express');
const DatabaseSchema = require('../utils/database-schema');

const router = express.Router();

/**
 * 获取数据库基本信息
 * GET /api/schema/database
 */
router.get('/database', async (req, res) => {
  try {
    const schema = new DatabaseSchema(req.pool);
    const dbInfo = await schema.getDatabaseInfo();
    
    res.json({
      success: true,
      data: dbInfo
    });
  } catch (error) {
    console.error('获取数据库信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据库信息失败',
      error: error.message
    });
  }
});

/**
 * 获取所有表信息
 * GET /api/schema/tables
 */
router.get('/tables', async (req, res) => {
  try {
    const schema = new DatabaseSchema(req.pool);
    const tables = await schema.getAllTables();
    
    res.json({
      success: true,
      data: tables,
      count: tables.length
    });
  } catch (error) {
    console.error('获取表信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的字段信息
 * GET /api/schema/tables/:tableName/columns
 */
router.get('/tables/:tableName/columns', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    // 检查表是否存在
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const columns = await schema.getTableColumns(tableName);
    
    res.json({
      success: true,
      data: columns,
      tableName,
      count: columns.length
    });
  } catch (error) {
    console.error('获取表字段信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表字段信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的索引信息
 * GET /api/schema/tables/:tableName/indexes
 */
router.get('/tables/:tableName/indexes', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const indexes = await schema.getTableIndexes(tableName);
    
    res.json({
      success: true,
      data: indexes,
      tableName,
      count: indexes.length
    });
  } catch (error) {
    console.error('获取表索引信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表索引信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的外键信息
 * GET /api/schema/tables/:tableName/foreign-keys
 */
router.get('/tables/:tableName/foreign-keys', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const foreignKeys = await schema.getTableForeignKeys(tableName);
    
    res.json({
      success: true,
      data: foreignKeys,
      tableName,
      count: foreignKeys.length
    });
  } catch (error) {
    console.error('获取表外键信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表外键信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的完整架构信息
 * GET /api/schema/tables/:tableName
 */
router.get('/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const tableSchema = await schema.getTableSchema(tableName);
    
    res.json({
      success: true,
      data: tableSchema
    });
  } catch (error) {
    console.error('获取表架构信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表架构信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的统计信息
 * GET /api/schema/tables/:tableName/stats
 */
router.get('/tables/:tableName/stats', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const stats = await schema.getTableStats(tableName);
    
    res.json({
      success: true,
      data: stats,
      tableName
    });
  } catch (error) {
    console.error('获取表统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表统计信息失败',
      error: error.message
    });
  }
});

/**
 * 获取指定表的CREATE语句
 * GET /api/schema/tables/:tableName/create-statement
 */
router.get('/tables/:tableName/create-statement', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `表 ${tableName} 不存在`
      });
    }
    
    const createStatement = await schema.getCreateTableStatement(tableName);
    
    res.json({
      success: true,
      data: {
        tableName,
        createStatement
      }
    });
  } catch (error) {
    console.error('获取CREATE语句失败:', error);
    res.status(500).json({
      success: false,
      message: '获取CREATE语句失败',
      error: error.message
    });
  }
});

/**
 * 获取完整的数据库架构
 * GET /api/schema/full
 */
router.get('/full', async (req, res) => {
  try {
    const schema = new DatabaseSchema(req.pool);
    const fullSchema = await schema.getDatabaseSchema();
    
    res.json({
      success: true,
      data: fullSchema
    });
  } catch (error) {
    console.error('获取完整数据库架构失败:', error);
    res.status(500).json({
      success: false,
      message: '获取完整数据库架构失败',
      error: error.message
    });
  }
});

/**
 * 检查表是否存在
 * GET /api/schema/tables/:tableName/exists
 */
router.get('/tables/:tableName/exists', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = new DatabaseSchema(req.pool);
    
    const exists = await schema.tableExists(tableName);
    
    res.json({
      success: true,
      data: {
        tableName,
        exists
      }
    });
  } catch (error) {
    console.error('检查表是否存在失败:', error);
    res.status(500).json({
      success: false,
      message: '检查表是否存在失败',
      error: error.message
    });
  }
});

module.exports = router;
