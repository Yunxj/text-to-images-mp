const Database = require('better-sqlite3');
const path = require('path');

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  initDatabase() {
    try {
      // 数据库文件路径
      const dbPath = path.join(__dirname, '../../data/ai-image-app.db');
      
      // 确保数据目录存在
      const fs = require('fs');
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 创建数据库连接
      this.db = new Database(dbPath);
      
      // 启用外键支持
      this.db.pragma('foreign_keys = ON');
      
      console.log('SQLite数据库连接成功:', dbPath);
      
      // 创建表
      this.createTables();
      
    } catch (error) {
      console.error('SQLite数据库初始化失败:', error);
      throw error;
    }
  }

  createTables() {
    // 用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT,
        avatar TEXT,
        vip_level INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 100,
        device_id TEXT,
        user_type TEXT DEFAULT 'normal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加新字段（如果表已存在）
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN device_id TEXT`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'normal'`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // 作品表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        prompt TEXT NOT NULL,
        image_url TEXT,
        image_urls TEXT, -- JSON格式存储多张图片
        style TEXT,
        character_type TEXT,
        generation_mode TEXT, -- single/double
        status TEXT DEFAULT 'pending', -- pending/success/failed
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 检查并添加works表的新字段
    try {
      this.db.exec(`ALTER TABLE works ADD COLUMN enhanced_prompt TEXT`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    
    try {
      this.db.exec(`ALTER TABLE works ADD COLUMN prompt_service TEXT`);
    } catch (e) {
      // 字段已存在，忽略错误
    }
    
    try {
      this.db.exec(`ALTER TABLE works ADD COLUMN image_service TEXT`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // AI生成记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        work_id INTEGER,
        prompt TEXT NOT NULL,
        response TEXT,
        provider TEXT, -- deepseek/baidu/etc
        cost_credits INTEGER DEFAULT 1,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (work_id) REFERENCES works (id)
      )
    `);

    console.log('数据库表创建完成');
  }

  // 获取数据库实例
  getDB() {
    return this.db;
  }

  // 模拟MongoDB的collection方法
  collection(name) {
    return new SQLiteCollection(this.db, name);
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      console.log('SQLite数据库连接已关闭');
    }
  }
}

// 模拟MongoDB Collection的SQLite实现
class SQLiteCollection {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async insertOne(doc) {
    const keys = Object.keys(doc);
    const values = Object.values(doc);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = this.db.prepare(sql).run(...values);
    
    return { insertedId: result.lastInsertRowid };
  }

  async find(query = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    let params = [];

    if (Object.keys(query).length > 0) {
      const conditions = Object.keys(query).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params = Object.values(query);
    }

    const rows = this.db.prepare(sql).all(...params);
    
    return {
      toArray: async () => rows.map(row => ({ ...row, _id: row.id }))
    };
  }

  async findOne(query = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    let params = [];

    if (Object.keys(query).length > 0) {
      const conditions = Object.keys(query).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params = Object.values(query);
    }

    sql += ' LIMIT 1';
    const row = this.db.prepare(sql).get(...params);
    
    return row ? { ...row, _id: row.id } : null;
  }

  async updateOne(query, update) {
    const setClause = Object.keys(update.$set || {}).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(query).map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(update.$set || {}), ...Object.values(query)];
    
    const result = this.db.prepare(sql).run(...params);
    
    return {
      matchedCount: result.changes > 0 ? 1 : 0,
      modifiedCount: result.changes
    };
  }

  async deleteOne(query) {
    const whereClause = Object.keys(query).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
    const params = Object.values(query);
    
    const result = this.db.prepare(sql).run(...params);
    
    return { deletedCount: result.changes };
  }
}

// 创建单例实例
const sqliteDB = new SQLiteDatabase();

module.exports = sqliteDB; 